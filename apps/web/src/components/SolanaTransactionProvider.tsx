'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  getSOLBalance,
  getSPLBalance,
  transferSOL,
  transferSPL,
  hasTokenAccount,
  createTokenAccount,
  waitForConfirmation,
  getTransactionStatus,
  getTokenMintInfo,
  parseTokenAmount,
  formatTokenAmount,
  type SolBalance,
  type SPLBalance,
  type TransactionResult,
} from '../services/solanaService';

interface SolanaTransactionContextType {
  // Balance methods
  getBalance: () => Promise<SolBalance | null>;
  getSPLBalanceFor: (mintAddress: string) => Promise<SPLBalance | null>;
  
  // Transfer methods
  sendSOL: (toAddress: string, amount: number) => Promise<TransactionResult>;
  sendSPL: (mintAddress: string, toAddress: string, amount: string, decimals?: number) => Promise<TransactionResult>;
  
  // Token account methods
  checkTokenAccount: (mintAddress: string, ownerAddress?: string) => Promise<boolean>;
  ensureTokenAccount: (mintAddress: string, ownerAddress?: string) => Promise<TransactionResult>;
  
  // Utility methods
  waitForTx: (signature: string) => Promise<boolean>;
  getTxStatus: (signature: string) => Promise<{ confirmed: boolean; error?: string }>;
  getTokenInfo: (mintAddress: string) => Promise<{ decimals: number; supply: string } | null>;
  
  // Helper methods
  parseAmount: (amount: string, decimals: number) => string;
  formatAmount: (amount: string, decimals: number) => string;
}

const SolanaTransactionContext = createContext<SolanaTransactionContextType>({
  getBalance: async () => null,
  getSPLBalanceFor: async () => null,
  sendSOL: async () => ({ success: false, signature: '', error: 'Not connected' }),
  sendSPL: async () => ({ success: false, signature: '', error: 'Not connected' }),
  checkTokenAccount: async () => false,
  ensureTokenAccount: async () => ({ success: false, signature: '', error: 'Not connected' }),
  waitForTx: async () => false,
  getTxStatus: async () => ({ confirmed: false, error: 'Not available' }),
  getTokenInfo: async () => null,
  parseAmount: () => '0',
  formatAmount: () => '0',
});

export const useSolanaTransaction = () => useContext(SolanaTransactionContext);

interface SolanaTransactionProviderProps {
  children: ReactNode;
}

export function SolanaTransactionProvider({ children }: SolanaTransactionProviderProps) {
  const wallet = useWallet();

  // Balance methods
  const getBalance = async (): Promise<SolBalance | null> => {
    if (!wallet.publicKey) return null;
    try {
      return await getSOLBalance(wallet.publicKey);
    } catch (error) {
      console.error('Failed to get SOL balance:', error);
      return null;
    }
  };

  const getSPLBalanceFor = async (mintAddress: string): Promise<SPLBalance | null> => {
    if (!wallet.publicKey) return null;
    try {
      return await getSPLBalance(wallet.publicKey, mintAddress);
    } catch (error) {
      console.error('Failed to get SPL balance:', error);
      return null;
    }
  };

  // Transfer methods
  const sendSOL = async (toAddress: string, amount: number): Promise<TransactionResult> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return { success: false, signature: '', error: 'Wallet not connected' };
    }
    try {
      const toPublicKey = new PublicKey(toAddress);
      return await transferSOL(wallet, toPublicKey, amount);
    } catch (error: any) {
      return { success: false, signature: '', error: error.message || 'Transfer failed' };
    }
  };

  const sendSPL = async (
    mintAddress: string,
    toAddress: string,
    amount: string,
    decimals: number = 9
  ): Promise<TransactionResult> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return { success: false, signature: '', error: 'Wallet not connected' };
    }
    try {
      const toPublicKey = new PublicKey(toAddress);
      return await transferSPL(wallet, mintAddress, toPublicKey, amount, decimals);
    } catch (error: any) {
      return { success: false, signature: '', error: error.message || 'Transfer failed' };
    }
  };

  // Token account methods
  const checkTokenAccount = async (
    mintAddress: string,
    ownerAddress?: string
  ): Promise<boolean> => {
    try {
      const ownerPublicKey = ownerAddress
        ? new PublicKey(ownerAddress)
        : wallet.publicKey;
      
      if (!ownerPublicKey) return false;
      return await hasTokenAccount(ownerPublicKey, mintAddress);
    } catch (error) {
      console.error('Failed to check token account:', error);
      return false;
    }
  };

  const ensureTokenAccount = async (
    mintAddress: string,
    ownerAddress?: string
  ): Promise<TransactionResult> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return { success: false, signature: '', error: 'Wallet not connected' };
    }
    try {
      const ownerPublicKey = ownerAddress ? new PublicKey(ownerAddress) : undefined;
      return await createTokenAccount(wallet, mintAddress, ownerPublicKey);
    } catch (error: any) {
      return { success: false, signature: '', error: error.message || 'Failed to create account' };
    }
  };

  // Utility methods
  const waitForTx = async (signature: string): Promise<boolean> => {
    return await waitForConfirmation(signature);
  };

  const getTxStatus = async (signature: string) => {
    return await getTransactionStatus(signature);
  };

  const getTokenInfo = async (mintAddress: string) => {
    return await getTokenMintInfo(mintAddress);
  };

  // Helper methods
  const parseAmount = (amount: string, decimals: number): string => {
    return parseTokenAmount(amount, decimals);
  };

  const formatAmount = (amount: string, decimals: number): string => {
    return formatTokenAmount(amount, decimals);
  };

  return (
    <SolanaTransactionContext.Provider
      value={{
        getBalance,
        getSPLBalanceFor,
        sendSOL,
        sendSPL,
        checkTokenAccount,
        ensureTokenAccount,
        waitForTx,
        getTxStatus,
        getTokenInfo,
        parseAmount,
        formatAmount,
      }}
    >
      {children}
    </SolanaTransactionContext.Provider>
  );
}
