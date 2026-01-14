/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      'lh3.googleusercontent.com',
      'localhost',
      'employee-admin-c83e8.appspot.com',
    ],
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // We need to disable strict mode to avoid double rendering in development
  reactStrictMode: false,
  
  // Since we're exporting static files, we can't use rewrites
  // Uncomment this if you don't need the rewrites functionality
  /*
  async rewrites() {
    return [];
  }
  */
};

module.exports = nextConfig; 