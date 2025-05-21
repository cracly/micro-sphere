import type { NextConfig } from "next";

// Check if GITHUB_REPOSITORY environment variable is available
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export', // Enable static export for GitHub Pages
  // Only add basePath if it's not empty (prevents empty path issues)
  ...(basePath ? { basePath } : {}),
  // Only add assetPrefix if it's not empty
  ...(basePath ? { assetPrefix: basePath } : {}),
  images: {
    unoptimized: true, // Required for static export
  },
  // Remove the experimental flag that's causing issues
  trailingSlash: true, // Use this instead of skipTrailingSlashRedirect
};

export default nextConfig;
