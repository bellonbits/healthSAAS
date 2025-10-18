/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static exports
  trailingSlash: true, // Add trailing slashes to URLs
  images: {
    unoptimized: true, // Required for static exports
  },
  // Remove the experimental section as appDir is now stable
};

module.exports = nextConfig;