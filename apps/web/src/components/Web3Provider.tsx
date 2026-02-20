'use client';

import React, { ReactNode } from 'react';

// Wagmi & Reown AppKit for EVM
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, sepolia, bsc, gnosis, avalanche } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks';
import type { Chain } from 'viem';

// Sui
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import '@mysten/dapp-kit/dist/index.css';

// Aptos
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';

// Starknet
import { StarknetConfig, publicProvider, InjectedConnector } from '@starknet-react/core';
import { mainnet as starknetMainnet } from '@starknet-react/chains';

// TON
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// Tron
import { WalletProvider as TronWalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters';

// Unified Wallet Context
import { WalletProvider as UnifiedWalletProvider } from '@/contexts/WalletContext';
import ConnectWalletModal from './ConnectWalletModal';

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';

if (!projectId) {
  console.error('⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

const metadata = {
  name: 'Blink',
  description: 'Cross-Chain Transfers — instant, low-cost, any chain',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://goblink.io',
  icons: ['https://goblink.io/icon.png']
};

// Custom EVM chain definitions
const berachain = {
  id: 80094, name: 'Berachain',
  nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.berachain.com'] }, public: { http: ['https://rpc.berachain.com'] } },
  blockExplorers: { default: { name: 'Berascan', url: 'https://berascan.com' } },
} as const satisfies Chain;

const monad = {
  id: 143, name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://rpc.monad.xyz'] }, public: { http: ['https://rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' } },
} as const satisfies Chain;

const aurora = {
  id: 1313161554, name: 'Aurora',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://mainnet.aurora.dev'] }, public: { http: ['https://mainnet.aurora.dev'] } },
  blockExplorers: { default: { name: 'Aurora Explorer', url: 'https://explorer.aurora.dev' } },
} as const satisfies Chain;

const plasma = {
  id: 9745, name: 'Plasma',
  nativeCurrency: { name: 'XPL', symbol: 'XPL', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.plasma.cash'] }, public: { http: ['https://rpc.plasma.cash'] } },
  blockExplorers: { default: { name: 'Plasma Explorer', url: 'https://explorer.plasma.cash' } },
} as const satisfies Chain;

const xlayer = {
  id: 196, name: 'X Layer',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.xlayer.tech'] }, public: { http: ['https://rpc.xlayer.tech'] } },
  blockExplorers: { default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer' } },
} as const satisfies Chain;

const adiChain = {
  id: 36900, name: 'ADI Chain',
  nativeCurrency: { name: 'ADI', symbol: 'ADI', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.adichain.io'] }, public: { http: ['https://rpc.adichain.io'] } },
  blockExplorers: { default: { name: 'ADI Explorer', url: 'https://explorer.adichain.io' } },
} as const satisfies Chain;

const evmChains = [
  mainnet, polygon, optimism, arbitrum, base, bsc, avalanche, gnosis,
  berachain, monad, aurora, plasma, xlayer, adiChain, sepolia,
];

const wagmiAdapter = new WagmiAdapter({ networks: evmChains, projectId });
const solanaWeb3JsAdapter = new SolanaAdapter({ wallets: [] });

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
    email: true,
    socials: ['google', 'apple', 'discord', 'x', 'github', 'farcaster'],
  },
  themeMode: 'light',
});

// Sui
const suiNetworks = {
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443', network: 'mainnet' as const },
  testnet: { url: 'https://fullnode.testnet.sui.io:443', network: 'testnet' as const },
};

// Starknet connectors
const starknetConnectors = [
  new InjectedConnector({ options: { id: 'argentX' } }),
  new InjectedConnector({ options: { id: 'braavos' } }),
];

// Tron adapters
const tronAdapters = [new TronLinkAdapter()];

// TON Connect manifest URL (required by TON Connect)
const tonManifestUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/tonconnect-manifest.json`
  : 'https://goblink.io/tonconnect-manifest.json';

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={suiNetworks} defaultNetwork="mainnet">
          <SuiWalletProvider>
            <AptosWalletAdapterProvider autoConnect={false}>
              <StarknetConfig
                chains={[starknetMainnet]}
                provider={publicProvider()}
                connectors={starknetConnectors as any}
              >
                <TonConnectUIProvider manifestUrl={tonManifestUrl}>
                  <TronWalletProvider adapters={tronAdapters} autoConnect={false}>
                    <UnifiedWalletProvider>
                      {children}
                      <ConnectWalletModal />
                    </UnifiedWalletProvider>
                  </TronWalletProvider>
                </TonConnectUIProvider>
              </StarknetConfig>
            </AptosWalletAdapterProvider>
          </SuiWalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
