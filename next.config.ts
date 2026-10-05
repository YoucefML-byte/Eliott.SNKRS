import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a static site in out/ (GitHub Pages);
// NEXT_PUBLIC_BASE_PATH is the sub-path it is served from, e.g. "/Eliott.SNKRS".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: process.env.STATIC_EXPORT ? "export" : undefined,
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
