/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // Fix for Next.js 16 monorepo support with Turbopack
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    // Fix for Yarn PnP with lru-cache
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  transpilePackages: ['@mysten/dapp-kit', '@mysten/sui', '@reown/appkit', '@reown/appkit-adapter-solana', '@reown/appkit-adapter-wagmi'],
}

module.exports = nextConfig
