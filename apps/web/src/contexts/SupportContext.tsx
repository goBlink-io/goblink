'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useWalletContext } from './WalletContext';
import { AppState } from '@/lib/support/types';

interface SupportContextType {
  appState: AppState;
  updateFormState: (updates: Partial<AppState>) => void;
  updateQuoteState: (status: AppState['quoteStatus'], error?: string | null) => void;
  updateTxState: (status: AppState['txStatus'], error?: string | null, depositAddress?: string | null) => void;
  addError: (message: string, context: string) => void;
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export function SupportProvider({ children }: { children: ReactNode }) {
  const { connectedWallets } = useWalletContext();
  
  // ── App State ──
  const [appState, setAppState] = useState<AppState>({
    // Wallet state
    connectedWallets: [],
    hasAnyWallet: false,
    
    // Form state
    fromChain: null,
    toChain: null,
    fromToken: null,
    toToken: null,
    amount: null,
    recipient: null,
    
    // Quote state
    quoteStatus: 'idle',
    quoteError: null,
    
    // Transaction state
    txStatus: 'idle',
    txError: null,
    depositAddress: null,
    txStartedAt: null,
    
    // Balance info
    insufficientBalance: false,
    userBalance: null,
    requiredAmount: null,
    
    // Environment
    isMobile: false,
    detectedWalletExtensions: [],
    
    // Error history
    recentErrors: [],
  });
  
  // ── Update wallet state from WalletContext ──
  useEffect(() => {
    setAppState(prev => ({
      ...prev,
      connectedWallets: connectedWallets.map(w => ({
        chain: w.chain,
        address: w.address,
        isConnected: true,
      })),
      hasAnyWallet: connectedWallets.length > 0,
    }));
  }, [connectedWallets]);
  
  // ── Detect mobile ──
  useEffect(() => {
    const checkMobile = () => {
      setAppState(prev => ({
        ...prev,
        isMobile: window.innerWidth < 768,
      }));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // ── Detect wallet extensions ──
  useEffect(() => {
    const detected: string[] = [];
    
    if (typeof window !== 'undefined') {
      if ((window as any).ethereum) {
        if ((window as any).ethereum.isMetaMask) detected.push('metamask');
        if ((window as any).ethereum.isCoinbaseWallet) detected.push('coinbase');
      }
      if ((window as any).solana) detected.push('phantom');
      if ((window as any).suiWallet) detected.push('sui');
      if ((window as any).petra) detected.push('petra');
      if ((window as any).starknet) detected.push('argent');
    }
    
    setAppState(prev => ({
      ...prev,
      detectedWalletExtensions: detected,
    }));
  }, []);
  
  // ── Update form state ──
  const updateFormState = useCallback((updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  }, []);
  
  // ── Update quote state ──
  const updateQuoteState = useCallback((status: AppState['quoteStatus'], error?: string | null) => {
    setAppState(prev => ({
      ...prev,
      quoteStatus: status,
      quoteError: error ?? null,
    }));
  }, []);
  
  // ── Update transaction state ──
  const updateTxState = useCallback((
    status: AppState['txStatus'],
    error?: string | null,
    depositAddress?: string | null
  ) => {
    setAppState(prev => ({
      ...prev,
      txStatus: status,
      txError: error ?? null,
      depositAddress: depositAddress ?? prev.depositAddress,
      txStartedAt: status === 'pending' || status === 'confirming' ? Date.now() : prev.txStartedAt,
    }));
  }, []);
  
  // ── Add error to history ──
  const addError = useCallback((message: string, context: string) => {
    setAppState(prev => ({
      ...prev,
      recentErrors: [
        ...prev.recentErrors.slice(-9), // Keep last 10 errors
        { message, timestamp: Date.now(), context }
      ],
    }));
  }, []);
  
  return (
    <SupportContext.Provider value={{
      appState,
      updateFormState,
      updateQuoteState,
      updateTxState,
      addError,
    }}>
      {children}
    </SupportContext.Provider>
  );
}

export function useSupportContext() {
  const ctx = useContext(SupportContext);
  if (!ctx) throw new Error('useSupportContext must be used within SupportProvider');
  return ctx;
}
