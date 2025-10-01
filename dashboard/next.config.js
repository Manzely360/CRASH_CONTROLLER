/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_CONTROLLER_URL: process.env.NEXT_PUBLIC_CONTROLLER_URL || 'http://localhost:3002',
    NEXT_PUBLIC_MOCK_CRASH_URL: process.env.NEXT_PUBLIC_MOCK_CRASH_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
