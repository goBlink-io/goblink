'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Freighter API types
interface FreighterAPI {
  isConnected: () => Promise<boolean>;
  getPublicKey: () => Promise<string>;
  getNetwork: () => Promise<{ network: string; networkPassphrase: string }>;
  signTransaction: (xdr: string, opts?: any) => Promise<string>;
}

interface StellarWalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  network: string | null;
  error: string | null;
}

const StellarWalletContext = createContext<StellarWalletContextType | undefined>(undefined);

// Helper to get Freighter API from window
const getFreighter = (): FreighterAPI | null => {
  if (typeof window === 'undefined') return null;
  return (window as any).freighter;
};

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [network, setNetwork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if Freighter is installed and connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const freighter = getFreighter();
      if (!freighter) return;

      const isConn = await freighter.isConnected();
      if (isConn) {
        const key = await freighter.getPublicKey();
        const netInfo = await freighter.getNetwork();
        setPublicKey(key);
        setConnected(true);
        setNetwork(netInfo.network);
        setError(null);
      }
    } catch (err) {
      console.error('Stellar wallet connection check failed:', err);
      // Silently fail - wallet might not be installed
    }
  };

  const connect = useCallback(async () => {
    try {
      setError(null);
      
      const freighter = getFreighter();
      if (!freighter) {
        throw new Error('Freighter wallet not installed. Please install from freighter.app');
      }
      
      // Request public key (triggers Freighter connection)
      const key = await freighter.getPublicKey();
      const netInfo = await freighter.getNetwork();
      
      setPublicKey(key);
      setConnected(true);
      setNetwork(netInfo.network);
    } catch (err: any) {
      console.error('Failed to connect Stellar wallet:', err);
      setError(err.message || 'Failed to connect to Freighter wallet');
      setPublicKey(null);
      setConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setConnected(false);
    setNetwork(null);
    setError(null);
  }, []);

  return (
    <StellarWalletContext.Provider
      value={{
        publicKey,
        isConnected: connected,
        connect,
        disconnect,
        network,
        error,
      }}
    >
      {children}
    </StellarWalletContext.Provider>
  );
}

export function useStellarWallet() {
  const context = useContext(StellarWalletContext);
  if (context === undefined) {
    throw new Error('useStellarWallet must be used within a StellarWalletProvider');
  }
  return context;
}
