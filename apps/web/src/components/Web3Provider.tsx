'use client';

import React, { ReactNode, useMemo } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

// Solana Imports
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

// Sui Imports
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import '@mysten/dapp-kit/dist/index.css';

const wagmiConfig = getDefaultConfig({
  appName: 'Sapphire',
  projectId: 'YOUR_PROJECT_ID', 
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  // Solana Config
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  // Sui Config
  const networks = {
    mainnet: { url: getFullnodeUrl('mainnet') },
  };

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networks} defaultNetwork="mainnet">
          <SuiWalletProvider autoConnect>
            <ConnectionProvider endpoint={endpoint}>
              <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                  <RainbowKitProvider>
                    {children}
                  </RainbowKitProvider>
                </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </SuiWalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
