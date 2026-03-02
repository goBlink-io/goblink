/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // Fix for Next.js 16 monorepo support with Turbopack
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  experimental: {
    externalDir: true,
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
    // Resolve @goblink/connect subpath exports for linked package
    const connectPath = path.resolve(__dirname, '../../node_modules/@goblink/connect')
      || path.resolve(__dirname, 'node_modules/@goblink/connect');
    const blinkconnectRoot = require('fs').realpathSync(
      path.resolve(__dirname, 'node_modules/@goblink/connect')
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      '@goblink/connect/react': path.join(blinkconnectRoot, 'dist/react/index.js'),
      '@goblink/connect/vanilla': path.join(blinkconnectRoot, 'dist/vanilla/index.js'),
      '@goblink/connect/adapters': path.join(blinkconnectRoot, 'dist/adapters/index.js'),
      '@goblink/connect': path.join(blinkconnectRoot, 'dist/index.js'),
    };
    // Also set extensionAlias to help resolve .js → .ts in linked package
    config.resolve.conditionNames = ['import', 'require', 'default'];
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
              "upgrade-insecure-requests",  // Force HTTP→HTTPS for all sub-resources — prevents Phantom iOS from blocking mixed content
              "default-src 'self' https://goblink.io",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://goblink.io https://www.googletagmanager.com https://www.google-analytics.com", // unsafe-eval needed for wallet libs
              "style-src 'self' 'unsafe-inline' https://goblink.io https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.bunny.net https://rsms.me https://fonts.cdnfonts.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://goblink.io https://*.rpc.blockvision.org https://api.mainnet-beta.solana.com https://mainnet.helius-rpc.com https://rpc.ankr.com https://1click.chaindefuser.com https://*.supabase.co wss://*.supabase.co https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://*.reown.com https://pulse.walletconnect.org https://raw.githubusercontent.com https://cdn.jsdelivr.net https://rpc.mainnet.near.org https://rpc.near.org https://*.near.org https://free.rpc.fastnear.com https://*.fastnear.com https://config.ton.org https://api.mainnet.aptoslabs.com https://api.web3modal.org https://*.web3modal.org https://fullnode.mainnet.sui.io wss://fullnode.mainnet.sui.io https://fullnode.testnet.sui.io wss://fullnode.testnet.sui.io https://cca-lite.coinbase.com https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://*.phantom.app wss://*.phantom.app",
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.bunny.net https://fonts.googleapis.com https://fonts.reown.com https://rsms.me https://fonts.cdnfonts.com https:",
              "frame-src 'self' blob: data:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            // HSTS — override Vercel's default with preload-eligible version
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
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
              "upgrade-insecure-requests",
              "default-src 'self' https://goblink.io",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://goblink.io https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://goblink.io https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.bunny.net https://rsms.me https://fonts.cdnfonts.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://goblink.io https://*.rpc.blockvision.org https://api.mainnet-beta.solana.com https://mainnet.helius-rpc.com https://rpc.ankr.com https://1click.chaindefuser.com https://*.supabase.co wss://*.supabase.co https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://*.reown.com https://pulse.walletconnect.org https://raw.githubusercontent.com https://cdn.jsdelivr.net https://rpc.mainnet.near.org https://rpc.near.org https://*.near.org https://free.rpc.fastnear.com https://*.fastnear.com https://config.ton.org https://api.mainnet.aptoslabs.com https://api.web3modal.org https://*.web3modal.org https://fullnode.mainnet.sui.io wss://fullnode.mainnet.sui.io https://fullnode.testnet.sui.io wss://fullnode.testnet.sui.io https://cca-lite.coinbase.com https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com https://*.phantom.app wss://*.phantom.app",
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.bunny.net https://fonts.googleapis.com https://fonts.reown.com https://rsms.me https://fonts.cdnfonts.com https:",
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
