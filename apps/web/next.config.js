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
              "style-src 'self' 'unsafe-inline' https://goblink.io https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.bunny.net https://rsms.me https://fonts.cdnfonts.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://goblink.io https://*.rpc.blockvision.org https://api.mainnet-beta.solana.com https://mainnet.helius-rpc.com https://rpc.ankr.com https://1click.chaindefuser.com https://*.supabase.co wss://*.supabase.co https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://raw.githubusercontent.com https://cdn.jsdelivr.net https://rpc.mainnet.near.org https://rpc.near.org https://*.near.org https://free.rpc.fastnear.com https://*.fastnear.com https://config.ton.org https://api.mainnet.aptoslabs.com https://api.web3modal.org https://*.web3modal.org",
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.bunny.net https://fonts.googleapis.com https://rsms.me https://fonts.cdnfonts.com",
              "frame-src 'self' blob: data:",
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
        // Allow /embed to be iframed on any site (it's the embeddable widget)
        source: '/embed',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https://goblink.io",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://goblink.io",
              "style-src 'self' 'unsafe-inline' https://goblink.io https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.bunny.net https://rsms.me https://fonts.cdnfonts.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://goblink.io https://*.rpc.blockvision.org https://api.mainnet-beta.solana.com https://mainnet.helius-rpc.com https://rpc.ankr.com https://1click.chaindefuser.com https://*.supabase.co wss://*.supabase.co https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://raw.githubusercontent.com https://cdn.jsdelivr.net https://rpc.mainnet.near.org https://rpc.near.org https://*.near.org https://free.rpc.fastnear.com https://*.fastnear.com https://config.ton.org https://api.mainnet.aptoslabs.com https://api.web3modal.org https://*.web3modal.org",
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.bunny.net https://fonts.googleapis.com https://rsms.me https://fonts.cdnfonts.com",
              "frame-src 'self' blob: data:",
              "frame-ancestors 'self' https://goblink.io https://*.goblink.io *",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
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
