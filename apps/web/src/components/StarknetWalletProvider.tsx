'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Starknet wallet types
interface StarknetWallet {
  id: string;
  name: string;
  icon: string;
  account?: {
    address: string;
  };
  selectedAddress?: string;
  isConnected?: boolean;
  enable: () => Promise<string[]>;
  request: (call: any) => Promise<any>;
}

interface StarknetWalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  wallet: StarknetWallet | null;
  error: string | null;
}

const StarknetWalletContext = createContext<StarknetWalletContextType | undefined>(undefined);

// Helper to get Starknet wallet from window
const getStarknetWallet = (): StarknetWallet | null => {
  if (typeof window === 'undefined') return null;
  // Check for Argent X
  const argentX = (window as any).starknet_argentX;
  if (argentX) return argentX;
  // Check for Braavos
  const braavos = (window as any).starknet_braavos;
  if (braavos) return braavos;
  // Check for generic starknet
  const starknet = (window as any).starknet;
  if (starknet) return starknet;
  return null;
};

export function StarknetWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [wallet, setWallet] = useState<StarknetWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const starknetWallet = getStarknetWallet();
      if (starknetWallet && starknetWallet.isConnected) {
        const addr = starknetWallet.selectedAddress || starknetWallet.account?.address;
        if (addr) {
          setAddress(addr);
          setConnected(true);
          setWallet(starknetWallet);
        }
      }
    } catch (err) {
      console.error('Starknet wallet connection check failed:', err);
      // Silently fail - wallet might not be installed
    }
  };

  const handleConnect = useCallback(async () => {
    try {
      setError(null);
      
      const starknetWallet = getStarknetWallet();
      if (!starknetWallet) {
        throw new Error('No Starknet wallet found. Please install Argent X or Braavos.');
      }

      // Enable the wallet (prompts user for connection)
      const accounts = await starknetWallet.enable();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in wallet');
      }

      const addr = accounts[0] || starknetWallet.selectedAddress || starknetWallet.account?.address;
      if (!addr) {
        throw new Error('Failed to get wallet address');
      }

      setAddress(addr);
      setConnected(true);
      setWallet(starknetWallet);
    } catch (err: any) {
      console.error('Failed to connect Starknet wallet:', err);
      setError(err.message || 'Failed to connect to Starknet wallet');
      setAddress(null);
      setConnected(false);
      setWallet(null);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setAddress(null);
    setConnected(false);
    setWallet(null);
    setError(null);
  }, []);

  return (
    <StarknetWalletContext.Provider
      value={{
        address,
        isConnected: connected,
        connect: handleConnect,
        disconnect: handleDisconnect,
        wallet,
        error,
      }}
    >
      {children}
    </StarknetWalletContext.Provider>
  );
}

export function useStarknetWallet() {
  const context = useContext(StarknetWalletContext);
  if (context === undefined) {
    throw new Error('useStarknetWallet must be used within a StarknetWalletProvider');
  }
  return context;
}
