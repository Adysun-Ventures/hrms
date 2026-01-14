/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Only use static export if explicitly requested (e.g., for GitHub Pages)
  // Netlify and self-deployed servers support SSR and should NOT use static export
  // Static export causes build retries with Next.js 15.3.6 + React 19.2.1
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  // Enable image optimization for SSR (Netlify and self-deployed servers support it)
  images: {
    unoptimized: process.env.STATIC_EXPORT === 'true',
  },
  // Base path only needed for static hosting (e.g., GitHub Pages)
  basePath: process.env.STATIC_EXPORT === 'true' ? '/Employee_Admin_Dashboard' : '',
  // Trailing slash only needed for static hosting
  trailingSlash: process.env.STATIC_EXPORT === 'true',
  // Disable strict mode to enable more compatibility options
  reactStrictMode: false,
  // Experimental features
  experimental: {
    appDocumentPreloading: false
  },
};

export default nextConfig; 