/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
          },
        ],
      },
    ]
  },
}

export default nextConfig
