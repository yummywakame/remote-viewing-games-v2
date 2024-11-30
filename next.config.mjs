/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the output: 'export' line if you're not doing static exports
  images: {
    // Consider enabling image optimization if you're not doing static exports
    // unoptimized: true,
  },
  typescript: {
    // Consider removing this to catch TypeScript errors during build
    // ignoreBuildErrors: true
  },
  experimental: {
    typedRoutes: false
  }
}

export default nextConfig

