/**
 * Unified Wallet Provider
 * 
 * React context provider that exposes the unified wallet manager to the component tree.
 * Provides hooks for accessing wallet functionality across all supported chains.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { unifiedWalletManager } from '../services/unifiedWalletManager';
import type {
  SupportedChain,
  WalletInfo,
  ChainBalance,
  TransactionRequest,
  TransactionResult,
  UnifiedWalletContextState,
} from '../types/wallet';

// ============================================================================
// Context
// ============================================================================

const UnifiedWalletContext = createContext<UnifiedWalletContextState | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface UnifiedWalletProviderProps {
  children: ReactNode;
}

export function UnifiedWalletProvider({ children }: UnifiedWalletProviderProps) {
  const [wallets, setWallets] = useState<Map<SupportedChain, WalletInfo>>(new Map());
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Force re-render to update wallet states
  const forceUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // Sync wallet states from manager
  useEffect(() => {
    const syncWallets = () => {
      const allWallets = unifiedWalletManager.getAllWallets();
      const walletMap = new Map<SupportedChain, WalletInfo>();
      allWallets.forEach(wallet => {
        walletMap.set(wallet.chain, wallet);
      });
      setWallets(walletMap);
    };

    syncWallets();
    
    // Set up periodic sync (every 5 seconds)
    const interval = setInterval(syncWallets, 5000);
    
    return () => clearInterval(interval);
  }, [updateTrigger]);

  // ============================================================================
  // Connection Management
  // ============================================================================

  const connect = useCallback(async (chain: SupportedChain) => {
    try {
      await unifiedWalletManager.connect(chain);
      forceUpdate();
    } catch (error) {
      console.error(`Failed to connect ${chain}:`, error);
      throw error;
    }
  }, [forceUpdate]);

  const disconnect = useCallback(async (chain: SupportedChain) => {
    try {
      await unifiedWalletManager.disconnect(chain);
      forceUpdate();
    } catch (error) {
      console.error(`Failed to disconnect ${chain}:`, error);
      throw error;
    }
  }, [forceUpdate]);

  const disconnectAll = useCallback(async () => {
    try {
      await unifiedWalletManager.disconnectAll();
      forceUpdate();
    } catch (error) {
      console.error('Failed to disconnect all wallets:', error);
      throw error;
    }
  }, [forceUpdate]);

  // ============================================================================
  // Query Methods
  // ============================================================================

  const getWallet = useCallback((chain: SupportedChain): WalletInfo | null => {
    return unifiedWalletManager.getWalletInfo(chain);
  }, []);

  const isConnected = useCallback((chain: SupportedChain): boolean => {
    return unifiedWalletManager.isConnected(chain);
  }, []);

  const getConnectedChains = useCallback((): SupportedChain[] => {
    return unifiedWalletManager.getConnectedChains();
  }, []);

  // ============================================================================
  // Balance Queries
  // ============================================================================

  const getBalance = useCallback(async (chain: SupportedChain, address?: string): Promise<string> => {
    return await unifiedWalletManager.getBalance(chain, address);
  }, []);

  const getTokenBalance = useCallback(
    async (chain: SupportedChain, tokenAddress: string, address?: string): Promise<string> => {
      return await unifiedWalletManager.getTokenBalance(chain, tokenAddress, address);
    },
    []
  );

  const getAllBalances = useCallback(async (chain: SupportedChain): Promise<ChainBalance> => {
    return await unifiedWalletManager.getAllBalances(chain);
  }, []);

  // ============================================================================
  // Transactions
  // ============================================================================

  const sendTransaction = useCallback(async (request: TransactionRequest): Promise<TransactionResult> => {
    return await unifiedWalletManager.sendTransaction(request);
  }, []);

  const signMessage = useCallback(async (chain: SupportedChain, message: string): Promise<string> => {
    return await unifiedWalletManager.signMessage(chain, message);
  }, []);

  // ============================================================================
  // Utilities
  // ============================================================================

  const validateAddress = useCallback((chain: SupportedChain, address: string): boolean => {
    return unifiedWalletManager.validateAddress(chain, address);
  }, []);

  const formatAmount = useCallback((chain: SupportedChain, amount: string, decimals: number): string => {
    return unifiedWalletManager.formatAmount(chain, amount, decimals);
  }, []);

  const parseAmount = useCallback((chain: SupportedChain, amount: string, decimals: number): string => {
    return unifiedWalletManager.parseAmount(chain, amount, decimals);
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: UnifiedWalletContextState = {
    wallets,
    connect,
    disconnect,
    disconnectAll,
    getWallet,
    isConnected,
    getConnectedChains,
    getBalance,
    getTokenBalance,
    getAllBalances,
    sendTransaction,
    signMessage,
    validateAddress,
    formatAmount,
    parseAmount,
  };

  return (
    <UnifiedWalletContext.Provider value={contextValue}>
      {children}
    </UnifiedWalletContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access unified wallet context
 */
export function useUnifiedWallet(): UnifiedWalletContextState {
  const context = useContext(UnifiedWalletContext);
  
  if (!context) {
    throw new Error('useUnifiedWallet must be used within UnifiedWalletProvider');
  }
  
  return context;
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to access a specific chain's wallet
 */
export function useChainWallet(chain: SupportedChain): WalletInfo | null {
  const { getWallet } = useUnifiedWallet();
  return getWallet(chain);
}

/**
 * Hook to check if a chain is connected
 */
export function useIsChainConnected(chain: SupportedChain): boolean {
  const { isConnected } = useUnifiedWallet();
  return isConnected(chain);
}

/**
 * Hook to get all connected chains
 */
export function useConnectedChains(): SupportedChain[] {
  const { getConnectedChains } = useUnifiedWallet();
  return getConnectedChains();
}

/**
 * Hook to get wallet address for a chain
 */
export function useChainAddress(chain: SupportedChain): string | null {
  const wallet = useChainWallet(chain);
  return wallet?.address || null;
}

/**
 * Hook to manage chain connection
 */
export function useChainConnection(chain: SupportedChain) {
  const { connect, disconnect, isConnected } = useUnifiedWallet();
  
  return {
    connect: useCallback(() => connect(chain), [connect, chain]),
    disconnect: useCallback(() => disconnect(chain), [disconnect, chain]),
    isConnected: isConnected(chain),
  };
}

/**
 * Hook to get balance for a chain
 */
export function useChainBalance(chain: SupportedChain, address?: string) {
  const { getBalance } = useUnifiedWallet();
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bal = await getBalance(chain, address);
      setBalance(bal);
    } catch (err: any) {
      setError(err);
      console.error(`Failed to fetch balance for ${chain}:`, err);
    } finally {
      setLoading(false);
    }
  }, [getBalance, chain, address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
}

/**
 * Hook to send transactions
 */
export function useChainTransaction(chain: SupportedChain) {
  const { sendTransaction } = useUnifiedWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const send = useCallback(
    async (to: string, amount: string, token?: string, memo?: string): Promise<TransactionResult | null> => {
      setLoading(true);
      setError(null);
      
      try {
        const wallet = unifiedWalletManager.getWalletInfo(chain);
        if (!wallet?.address) {
          throw new Error(`No wallet connected for ${chain}`);
        }

        const request: TransactionRequest = {
          chain,
          from: wallet.address,
          to,
          amount,
          token,
          memo,
        };

        const result = await sendTransaction(request);
        return result;
      } catch (err: any) {
        setError(err);
        console.error(`Transaction failed for ${chain}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sendTransaction, chain]
  );

  return { send, loading, error };
}

// ============================================================================
// Export Manager (for direct access if needed)
// ============================================================================

export { unifiedWalletManager };
