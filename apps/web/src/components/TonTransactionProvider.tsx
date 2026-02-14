'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import {
  getTonBalance,
  getJettonBalance,
  buildTonTransfer,
  buildJettonTransfer,
  waitForTransaction,
  getTransactionStatus,
  getJettonMetadata,
  parseAmount,
  formatAmount,
  isValidTonAddress,
  estimateTransactionFee,
  hasSufficientBalance,
  type TonBalance,
  type JettonBalance,
  type TransactionResult,
} from '../services/tonService';

interface TonTransactionContextType {
  // Balance methods
  getBalance: () => Promise<TonBalance | null>;
  getJettonBalance: (jettonMasterAddress: string) => Promise<JettonBalance | null>;
  
  // Transfer methods
  sendTON: (toAddress: string, amount: string, memo?: string) => Promise<TransactionResult>;
  sendJetton: (
    jettonMasterAddress: string,
    jettonWalletAddress: string,
    toAddress: string,
    amount: string
  ) => Promise<TransactionResult>;
  
  // Utility methods
  waitForTx: (transactionHash: string) => Promise<boolean>;
  getTxStatus: (transactionHash: string) => Promise<any>;
  getJettonInfo: (jettonMasterAddress: string) => Promise<any>;
  estimateFee: () => Promise<string>;
  checkSufficientBalance: (amount: string, jettonAddress?: string) => Promise<boolean>;
  
  // Helper methods
  parseAmount: (amount: string, decimals?: number) => string;
  formatAmount: (amount: string, decimals?: number) => string;
  validateAddress: (address: string) => boolean;
}

const TonTransactionContext = createContext<TonTransactionContextType>({
  getBalance: async () => null,
  getJettonBalance: async () => null,
  sendTON: async () => ({ success: false, boc: '', error: 'Not connected' }),
  sendJetton: async () => ({ success: false, boc: '', error: 'Not connected' }),
  waitForTx: async () => false,
  getTxStatus: async () => ({ status: 'unknown' }),
  getJettonInfo: async () => null,
  estimateFee: async () => '0',
  checkSufficientBalance: async () => false,
  parseAmount: () => '0',
  formatAmount: () => '0',
  validateAddress: () => false,
});

export const useTonTransaction = () => useContext(TonTransactionContext);

interface TonTransactionProviderProps {
  children: ReactNode;
}

export function TonTransactionProvider({ children }: TonTransactionProviderProps) {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();

  // Balance methods
  const getBalance = async (): Promise<TonBalance | null> => {
    if (!address) return null;
    try {
      return await getTonBalance(address);
    } catch (error) {
      console.error('Failed to get TON balance:', error);
      return null;
    }
  };

  const getJettonBalanceHandler = async (jettonMasterAddress: string): Promise<JettonBalance | null> => {
    if (!address) return null;
    try {
      return await getJettonBalance(address, jettonMasterAddress);
    } catch (error) {
      console.error('Failed to get jetton balance:', error);
      return null;
    }
  };

  // Transfer methods
  const sendTON = async (toAddress: string, amount: string, memo?: string): Promise<TransactionResult> => {
    if (!address) {
      return { success: false, boc: '', error: 'Wallet not connected' };
    }
    
    if (!isValidTonAddress(toAddress)) {
      return { success: false, boc: '', error: 'Invalid recipient address' };
    }

    try {
      const transaction = buildTonTransfer(toAddress, amount, memo);
      const result = await tonConnectUI.sendTransaction(transaction);
      
      return {
        success: true,
        boc: result.boc,
      };
    } catch (error: any) {
      return { success: false, boc: '', error: error.message || 'Transfer failed' };
    }
  };

  const sendJetton = async (
    jettonMasterAddress: string,
    jettonWalletAddress: string,
    toAddress: string,
    amount: string
  ): Promise<TransactionResult> => {
    if (!address) {
      return { success: false, boc: '', error: 'Wallet not connected' };
    }
    
    if (!isValidTonAddress(toAddress)) {
      return { success: false, boc: '', error: 'Invalid recipient address' };
    }

    try {
      const transaction = buildJettonTransfer(jettonWalletAddress, toAddress, amount);
      const result = await tonConnectUI.sendTransaction(transaction);
      
      return {
        success: true,
        boc: result.boc,
      };
    } catch (error: any) {
      return { success: false, boc: '', error: error.message || 'Transfer failed' };
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

  const getJettonInfo = async (jettonMasterAddress: string) => {
    try {
      return await getJettonMetadata(jettonMasterAddress);
    } catch (error) {
      console.error('Failed to get jetton metadata:', error);
      return null;
    }
  };

  const estimateFeeHandler = async (): Promise<string> => {
    try {
      return await estimateTransactionFee();
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      return '0';
    }
  };

  const checkSufficientBalance = async (
    amount: string,
    jettonAddress?: string
  ): Promise<boolean> => {
    if (!address) return false;
    try {
      return await hasSufficientBalance(address, amount, jettonAddress);
    } catch (error) {
      console.error('Failed to check balance:', error);
      return false;
    }
  };

  // Helper methods
  const parseAmountHandler = (amount: string, decimals: number = 9): string => {
    try {
      return parseAmount(amount, decimals);
    } catch (error) {
      console.error('Failed to parse amount:', error);
      return '0';
    }
  };

  const formatAmountHandler = (amount: string, decimals: number = 9): string => {
    try {
      return formatAmount(amount, decimals);
    } catch (error) {
      console.error('Failed to format amount:', error);
      return '0';
    }
  };

  const validateAddress = (address: string): boolean => {
    return isValidTonAddress(address);
  };

  return (
    <TonTransactionContext.Provider
      value={{
        getBalance,
        getJettonBalance: getJettonBalanceHandler,
        sendTON,
        sendJetton,
        waitForTx,
        getTxStatus,
        getJettonInfo,
        estimateFee: estimateFeeHandler,
        checkSufficientBalance,
        parseAmount: parseAmountHandler,
        formatAmount: formatAmountHandler,
        validateAddress,
      }}
    >
      {children}
    </TonTransactionContext.Provider>
  );
}
