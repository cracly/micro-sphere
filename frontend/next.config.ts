import type { NextConfig } from "next";

// Get the repository name from package.json or set it manually
const isProd = process.env.NODE_ENV === 'production';
// Determine the base path from your GitHub repository name
// E.g., if your repo is username/micro-sphere, use /micro-sphere
const basePath = isProd ? '/micro-sphere' : '';

const nextConfig: NextConfig = {
  output: 'export', // Enable static export for GitHub Pages
  basePath, // Set the base path for GitHub Pages
  assetPrefix: basePath, // Set the asset prefix to match the base path
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
