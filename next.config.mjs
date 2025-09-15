/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['d3']
  },
  // Ensure CSV files are copied to build output
  async rewrites() {
    return [];
  },
  // Make sure public files are available
  trailingSlash: false
};
export default nextConfig;
