'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { TonConnectUIProvider, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';

interface TonWalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const TonWalletContext = createContext<TonWalletContextType | undefined>(undefined);

// Inner component that uses TON hooks
function TonWalletInner({ children }: { children: ReactNode }) {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const isConnected = !!address;

  const connect = async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Failed to connect TON wallet:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error('Failed to disconnect TON wallet:', error);
      throw error;
    }
  };

  return (
    <TonWalletContext.Provider
      value={{
        address: address || null,
        isConnected,
        connect,
        disconnect,
      }}
    >
      {children}
    </TonWalletContext.Provider>
  );
}

// Outer provider that wraps with TonConnectUIProvider
export function TonWalletProvider({ children }: { children: ReactNode }) {
  // Manifest URL for TONConnect (should be hosted on your domain)
  const manifestUrl = 'https://sapphire.app/tonconnect-manifest.json';

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <TonWalletInner>{children}</TonWalletInner>
    </TonConnectUIProvider>
  );
}

export function useTonWallet() {
  const context = useContext(TonWalletContext);
  if (context === undefined) {
    throw new Error('useTonWallet must be used within a TonWalletProvider');
  }
  return context;
}
