'use client';

import React, { ReactNode } from 'react';

// Wagmi & Reown AppKit for EVM
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, sepolia, bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks';
import type { Chain } from 'viem';

// Sui Imports
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import '@mysten/dapp-kit/dist/index.css';

// Unified Wallet Context
import { WalletProvider as UnifiedWalletProvider } from '@/contexts/WalletContext';
import ConnectWalletModal from './ConnectWalletModal';

// Query client (shared for all providers)
const queryClient = new QueryClient();

// 1. Get projectId from https://cloud.reown.com (formerly WalletConnect)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';

if (!projectId) {
  console.error('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Get your project ID from https://cloud.reown.com');
}

// 2. Create wagmiConfig
const metadata = {
  name: 'Sapphire',
  description: 'Cross-Chain Swap Platform powered by NEAR Intents',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://sapphire.example.com',
  icons: ['https://sapphire.example.com/icon.png']
};

// Custom chain definitions for chains not yet in wagmi
const berachain = {
  id: 80094,
  name: 'Berachain',
  nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.berachain.com'] },
    public: { http: ['https://rpc.berachain.com'] },
  },
  blockExplorers: {
    default: { name: 'Berascan', url: 'https://berascan.com' },
  },
} as const satisfies Chain;

const monad = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://rpc.monad.xyz'] },
    public: { http: ['https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
} as const satisfies Chain;

// 3. Set up Wagmi Adapter for EVM chains
const evmChains = [
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  bsc,
  berachain,
  monad,
  sepolia, // Keep for testing
];

const wagmiAdapter = new WagmiAdapter({
  networks: evmChains,
  projectId,
});

// 4. Set up Solana Adapter
const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: []
});

// 5. Create AppKit with multiple adapters
createAppKit({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter],
  networks: [
    mainnet, polygon, optimism, arbitrum, base, bsc, berachain, monad, sepolia,
    solana, solanaTestnet, solanaDevnet,
  ] as any,
  projectId,
  metadata,
  features: {
    analytics: false,
  },
  themeMode: 'light',
});

// Sui network configuration
const suiNetworks = {
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443' },
  testnet: { url: 'https://fullnode.testnet.sui.io:443' },
};

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={suiNetworks} defaultNetwork="mainnet">
          <SuiWalletProvider>
            <UnifiedWalletProvider>
              {children}
              <ConnectWalletModal />
            </UnifiedWalletProvider>
          </SuiWalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
