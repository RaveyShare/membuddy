/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_FRONT_AUTH_URL || (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:8081')
    return [
      {
        source: '/front/auth/:path*',
        destination: `${base}/front/auth/:path*`,
      },
    ]
  },
}

export default nextConfig
