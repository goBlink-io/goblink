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
import { SolanaTransactionProvider } from './SolanaTransactionProvider';

// Sui Imports
import { SuiTransactionProvider } from './SuiTransactionProvider';
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import '@mysten/dapp-kit/dist/index.css';

// NEAR Imports
import { NearWalletProvider } from './NearWalletProvider';

// Phase 2.4 New Chain Imports
import { StellarWalletProvider } from './StellarWalletProvider';
import { StellarTransactionProvider } from './StellarTransactionProvider';
import { StarknetWalletProvider } from './StarknetWalletProvider';
import { StarknetTransactionProvider } from './StarknetTransactionProvider';
import { TonWalletProvider } from './TonWalletProvider';
import { TonTransactionProvider } from './TonTransactionProvider';
import { TronWalletProvider } from './TronWalletProvider';
import { TronTransactionProvider } from './TronTransactionProvider';
import { BitcoinWalletProvider } from './BitcoinWalletProvider';
import { BitcoinTransactionProvider } from './BitcoinTransactionProvider';

// Phase 2.5 Unified Wallet Manager
import { UnifiedWalletProvider } from './UnifiedWalletProvider';

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
            <SuiTransactionProvider>
              <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                  <WalletModalProvider>
                    <SolanaTransactionProvider>
                      <NearWalletProvider>
                        <TonWalletProvider>
                          <TonTransactionProvider>
                            <StellarWalletProvider>
                              <StellarTransactionProvider>
                                <StarknetWalletProvider>
                                  <StarknetTransactionProvider>
                                    <TronWalletProvider>
                                      <TronTransactionProvider>
                                        <BitcoinWalletProvider>
                                          <BitcoinTransactionProvider>
                                            <RainbowKitProvider>
                                              <UnifiedWalletProvider>
                                                {children}
                                              </UnifiedWalletProvider>
                                            </RainbowKitProvider>
                                          </BitcoinTransactionProvider>
                                        </BitcoinWalletProvider>
                                      </TronTransactionProvider>
                                    </TronWalletProvider>
                                  </StarknetTransactionProvider>
                                </StarknetWalletProvider>
                              </StellarTransactionProvider>
                            </StellarWalletProvider>
                          </TonTransactionProvider>
                        </TonWalletProvider>
                      </NearWalletProvider>
                    </SolanaTransactionProvider>
                  </WalletModalProvider>
                </WalletProvider>
              </ConnectionProvider>
            </SuiTransactionProvider>
          </SuiWalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
