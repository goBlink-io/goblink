'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// TronLink types
interface TronLinkWallet {
  ready: boolean;
  request: (args: { method: string; params?: any }) => Promise<any>;
  tronWeb?: any;
}

interface TronWalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  tronWeb: any | null;
  error: string | null;
}

const TronWalletContext = createContext<TronWalletContextType | undefined>(undefined);

// Helper to get TronLink from window
const getTronLink = (): TronLinkWallet | null => {
  if (typeof window === 'undefined') return null;
  const tronLink = (window as any).tronLink || (window as any).tron;
  return tronLink || null;
};

export function TronWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [tronWeb, setTronWeb] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for existing connection on mount
  useEffect(() => {
    checkConnection();
    
    // Listen for account changes
    const handleAccountsChanged = (accounts: { base58: string }[]) => {
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0].base58);
        setConnected(true);
      } else {
        setAddress(null);
        setConnected(false);
      }
    };

    // Set up event listener if TronLink is available
    const tronLink = getTronLink();
    if (tronLink) {
      (window as any).addEventListener('message', (e: MessageEvent) => {
        if (e.data.message && e.data.message.action === 'accountsChanged') {
          handleAccountsChanged(e.data.message.data);
        }
      });
    }
  }, []);

  const checkConnection = async () => {
    try {
      const tronLink = getTronLink();
      if (!tronLink) return;

      // Wait for TronLink to be ready
      if (!tronLink.ready) {
        await new Promise((resolve) => {
          const checkReady = setInterval(() => {
            if (tronLink.ready) {
              clearInterval(checkReady);
              resolve(true);
            }
          }, 100);
          // Timeout after 3 seconds
          setTimeout(() => {
            clearInterval(checkReady);
            resolve(false);
          }, 3000);
        });
      }

      if (tronLink.ready && tronLink.tronWeb && tronLink.tronWeb.defaultAddress.base58) {
        const addr = tronLink.tronWeb.defaultAddress.base58;
        setAddress(addr);
        setConnected(true);
        setTronWeb(tronLink.tronWeb);
      }
    } catch (err) {
      console.error('TRON wallet connection check failed:', err);
      // Silently fail - wallet might not be installed
    }
  };

  const connect = useCallback(async () => {
    try {
      setError(null);
      
      const tronLink = getTronLink();
      if (!tronLink) {
        throw new Error('TronLink wallet not installed. Please install TronLink extension.');
      }

      // Request account access
      const result = await tronLink.request({ method: 'tron_requestAccounts' });
      
      if (!result || !result.code === undefined || result.code !== 200) {
        throw new Error('Failed to connect to TronLink wallet');
      }

      // Wait for TronWeb to be injected
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (tronLink.tronWeb && tronLink.tronWeb.defaultAddress.base58) {
        const addr = tronLink.tronWeb.defaultAddress.base58;
        setAddress(addr);
        setConnected(true);
        setTronWeb(tronLink.tronWeb);
      } else {
        throw new Error('Failed to get wallet address');
      }
    } catch (err: any) {
      console.error('Failed to connect TRON wallet:', err);
      setError(err.message || 'Failed to connect to TronLink wallet');
      setAddress(null);
      setConnected(false);
      setTronWeb(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnected(false);
    setTronWeb(null);
    setError(null);
  }, []);

  return (
    <TronWalletContext.Provider
      value={{
        address,
        isConnected: connected,
        connect,
        disconnect,
        tronWeb,
        error,
      }}
    >
      {children}
    </TronWalletContext.Provider>
  );
}

export function useTronWallet() {
  const context = useContext(TronWalletContext);
  if (context === undefined) {
    throw new Error('useTronWallet must be used within a TronWalletProvider');
  }
  return context;
}
