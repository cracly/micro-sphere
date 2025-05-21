#!/bin/bash

# Exit on error
set -e

# Store the current branch name
current_branch=$(git branch --show-current)
echo "Current branch: $current_branch"

# Build the project
echo "Building the project..."
cd ./frontend
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

# Switch to the gh-pages branch
echo "Switching to gh-pages branch..."
git checkout gh-pages

# Remove existing files (except .git directory)
echo "Cleaning gh-pages branch..."
find . -maxdepth 1 ! -path "./.git" ! -path "." -exec rm -rf {} \;

# Copy the build output from the temporary directory
echo "Copying build files to gh-pages branch..."
cp -R $temp_dir/* .

# Add all files to git
echo "Adding files to git..."
git add .

# Commit with a timestamp
echo "Committing changes..."
git commit -m "Deploy to GitHub Pages - $(date)"

# Push to gh-pages
echo "Pushing to gh-pages branch..."
git push origin gh-pages

# Return to the original branch
echo "Returning to $current_branch branch..."
git checkout $current_branch

# Clean up the temporary directory
echo "Cleaning up..."
rm -rf $temp_dir

echo "Deployment complete! Your site is now published on GitHub Pages."
