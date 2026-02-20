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
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https://goblink.io",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://goblink.io", // unsafe-eval needed for wallet libs
              "style-src 'self' 'unsafe-inline' https://goblink.io",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://goblink.io https://*.rpc.blockvision.org https://api.mainnet-beta.solana.com https://mainnet.helius-rpc.com https://rpc.ankr.com https://1click.chaindefuser.com https://*.supabase.co wss://*.supabase.co https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://goblink.io' 
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
