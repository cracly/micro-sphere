// Resolve a processed-data file to its public URL, honoring a configured
// base path (GitHub Pages project sites without a custom domain).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function dataUrl(filename: string): string {
  return `${BASE_PATH}/backend/data/${filename}`;
}
