#!/bin/bash

# Exit on error
set -e

# Store the current branch name
current_branch=$(git branch --show-current)
echo "Current branch: $current_branch"

# Build the project
echo "Building the project..."
npm i
npm run build

# Create a temporary directory for the build output
temp_dir=$(mktemp -d)
echo "Created temp directory: $temp_dir"

# Copy the build output to the temporary directory
# Adjust this path based on where your build outputs files
# For Next.js, it's typically the 'out' directory if you're using static export
echo "Copying build files to temp directory..."
cp -R out/* $temp_dir

# Also copy any other necessary files for GitHub Pages
if [ -f "CNAME" ]; then
  cp CNAME $temp_dir
fi

# Return to project root before switching branches
cd ..

# Check if gh-pages branch exists
if git show-ref --verify --quiet refs/heads/gh-pages; then
  echo "Switching to existing gh-pages branch..."
  git checkout gh-pages
else
  echo "Creating new gh-pages branch..."
  git checkout --orphan gh-pages
  # Orphan branch is created with all files staged, so we need to reset
  git reset --hard
fi

# Remove existing files (except .git directory)
echo "Cleaning gh-pages branch..."
find . -maxdepth 1 ! -path "./.git" ! -path "." -exec rm -rf {} \;

# Copy the build output from the temporary directory
echo "Copying build files to gh-pages branch..."
cp -R $temp_dir/* .

# Create necessary GitHub Pages files
echo "Creating .nojekyll file to disable Jekyll processing..."
touch .nojekyll

# Add all files to git
echo "Adding files to git..."
git add .

# Commit with a timestamp
echo "Committing changes..."
git commit -m "Deploy to GitHub Pages - $(date)" || echo "No changes to commit"

# Push to gh-pages
echo "Pushing to gh-pages branch..."
git push -f origin gh-pages

# Return to the original branch
echo "Returning to $current_branch branch..."
git checkout $current_branch

# Clean up the temporary directory
echo "Cleaning up..."
rm -rf $temp_dir

echo "Deployment complete! Your site is now published on GitHub Pages."
