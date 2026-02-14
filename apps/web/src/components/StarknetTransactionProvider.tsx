'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useStarknetWallet } from './StarknetWalletProvider';
import {
  getStarknetBalance,
  getStarknetTokenBalance,
  sendStarknetEth,
  sendStarknetToken,
  waitForTransaction,
  getTransactionStatus,
  getTokenMetadata,
  parseAmount,
  formatAmount,
  isValidStarknetAddress,
  estimateTransactionFee,
  hasSufficientBalance,
  type StarknetBalance,
  type StarknetTokenBalance,
  type TransactionResult,
} from '../services/starknetService';

interface StarknetTransactionContextType {
  // Balance methods
  getBalance: () => Promise<StarknetBalance | null>;
  getTokenBalance: (contractAddress: string) => Promise<StarknetTokenBalance | null>;
  
  // Transfer methods
  sendETH: (toAddress: string, amount: string) => Promise<TransactionResult>;
  sendToken: (contractAddress: string, toAddress: string, amount: string) => Promise<TransactionResult>;
  
  // Utility methods
  waitForTx: (transactionHash: string) => Promise<boolean>;
  getTxStatus: (transactionHash: string) => Promise<any>;
  getTokenInfo: (contractAddress: string) => Promise<any>;
  estimateFee: (calls: any[]) => Promise<string>;
  checkSufficientBalance: (amount: string, contractAddress?: string) => Promise<boolean>;
  
  // Helper methods
  parseAmount: (amount: string, decimals: number) => string;
  formatAmount: (amount: string, decimals: number) => string;
  validateAddress: (address: string) => boolean;
}

const StarknetTransactionContext = createContext<StarknetTransactionContextType>({
  getBalance: async () => null,
  getTokenBalance: async () => null,
  sendETH: async () => ({ success: false, transactionHash: '', error: 'Not connected' }),
  sendToken: async () => ({ success: false, transactionHash: '', error: 'Not connected' }),
  waitForTx: async () => false,
  getTxStatus: async () => ({ status: 'unknown' }),
  getTokenInfo: async () => null,
  estimateFee: async () => '0',
  checkSufficientBalance: async () => false,
  parseAmount: () => '0',
  formatAmount: () => '0',
  validateAddress: () => false,
});

export const useStarknetTransaction = () => useContext(StarknetTransactionContext);

interface StarknetTransactionProviderProps {
  children: ReactNode;
}

export function StarknetTransactionProvider({ children }: StarknetTransactionProviderProps) {
  const { address, wallet } = useStarknetWallet();

  // Balance methods
  const getBalance = async (): Promise<StarknetBalance | null> => {
    if (!address) return null;
    try {
      return await getStarknetBalance(address);
    } catch (error) {
      console.error('Failed to get ETH balance:', error);
      return null;
    }
  };

  const getTokenBalance = async (contractAddress: string): Promise<StarknetTokenBalance | null> => {
    if (!address) return null;
    try {
      return await getStarknetTokenBalance(address, contractAddress);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return null;
    }
  };

  // Transfer methods
  const sendETH = async (toAddress: string, amount: string): Promise<TransactionResult> => {
    if (!address || !wallet) {
      return { success: false, transactionHash: '', error: 'Wallet not connected' };
    }
    
    if (!isValidStarknetAddress(toAddress)) {
      return { success: false, transactionHash: '', error: 'Invalid recipient address' };
    }

    try {
      return await sendStarknetEth(wallet, toAddress, amount);
    } catch (error: any) {
      return { success: false, transactionHash: '', error: error.message || 'Transfer failed' };
    }
  };

  const sendToken = async (
    contractAddress: string,
    toAddress: string,
    amount: string
  ): Promise<TransactionResult> => {
    if (!address || !wallet) {
      return { success: false, transactionHash: '', error: 'Wallet not connected' };
    }
    
    if (!isValidStarknetAddress(toAddress)) {
      return { success: false, transactionHash: '', error: 'Invalid recipient address' };
    }

    try {
      return await sendStarknetToken(wallet, contractAddress, toAddress, amount);
    } catch (error: any) {
      return { success: false, transactionHash: '', error: error.message || 'Transfer failed' };
    }
  };

  // Utility methods
  const waitForTx = async (transactionHash: string): Promise<boolean> => {
    try {
      return await waitForTransaction(transactionHash);
    } catch (error) {
      console.error('Failed to wait for transaction:', error);
      return false;
    }
  };

  const getTxStatus = async (transactionHash: string) => {
    try {
      return await getTransactionStatus(transactionHash);
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return { status: 'unknown', error: 'Failed to get status' };
    }
  };

  const getTokenInfo = async (contractAddress: string) => {
    try {
      return await getTokenMetadata(contractAddress);
    } catch (error) {
      console.error('Failed to get token metadata:', error);
      return null;
    }
  };

  const estimateFee = async (calls: any[]): Promise<string> => {
    if (!wallet) return '0';
    try {
      return await estimateTransactionFee(wallet, calls);
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      return '0';
    }
  };

  const checkSufficientBalance = async (
    amount: string,
    contractAddress?: string
  ): Promise<boolean> => {
    if (!address) return false;
    try {
      return await hasSufficientBalance(address, amount, contractAddress);
    } catch (error) {
      console.error('Failed to check balance:', error);
      return false;
    }
  };

  // Helper methods
  const parseAmountHandler = (amount: string, decimals: number): string => {
    try {
      return parseAmount(amount, decimals);
    } catch (error) {
      console.error('Failed to parse amount:', error);
      return '0';
    }
  };

  const formatAmountHandler = (amount: string, decimals: number): string => {
    try {
      return formatAmount(amount, decimals);
    } catch (error) {
      console.error('Failed to format amount:', error);
      return '0';
    }
  };

  const validateAddress = (address: string): boolean => {
    return isValidStarknetAddress(address);
  };

  return (
    <StarknetTransactionContext.Provider
      value={{
        getBalance,
        getTokenBalance,
        sendETH,
        sendToken,
        waitForTx,
        getTxStatus,
        getTokenInfo,
        estimateFee,
        checkSufficientBalance,
        parseAmount: parseAmountHandler,
        formatAmount: formatAmountHandler,
        validateAddress,
      }}
    >
      {children}
    </StarknetTransactionContext.Provider>
  );
}
