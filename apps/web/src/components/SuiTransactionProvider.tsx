'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import {
  getSuiBalance,
  getSuiTokenBalance,
  getAllBalances,
  sendSui,
  sendSuiToken,
  waitForTransaction,
  getTransactionStatus,
  getCoinMetadata,
  parseAmount,
  formatAmount,
  isValidSuiAddress,
  getGasPrice,
  hasSufficientBalance,
  type SuiBalance,
  type SuiTokenBalance,
  type TransactionResult,
} from '../services/suiService';

interface SuiTransactionContextType {
  // Balance methods
  getBalance: () => Promise<SuiBalance | null>;
  getTokenBalance: (coinType: string) => Promise<SuiTokenBalance | null>;
  getAllBalances: () => Promise<any>;
  
  // Transfer methods
  sendSUI: (toAddress: string, amount: string) => Promise<TransactionResult>;
  sendToken: (coinType: string, toAddress: string, amount: string) => Promise<TransactionResult>;
  
  // Utility methods
  waitForTx: (digest: string) => Promise<boolean>;
  getTxStatus: (digest: string) => Promise<any>;
  getCoinInfo: (coinType: string) => Promise<any>;
  getGasPrice: () => Promise<string>;
  checkSufficientBalance: (amount: string, coinType?: string) => Promise<boolean>;
  
  // Helper methods
  parseAmount: (amount: string, decimals: number) => string;
  formatAmount: (amount: string, decimals: number) => string;
  validateAddress: (address: string) => boolean;
}

const SuiTransactionContext = createContext<SuiTransactionContextType>({
  getBalance: async () => null,
  getTokenBalance: async () => null,
  getAllBalances: async () => [],
  sendSUI: async () => ({ success: false, digest: '', error: 'Not connected' }),
  sendToken: async () => ({ success: false, digest: '', error: 'Not connected' }),
  waitForTx: async () => false,
  getTxStatus: async () => ({ status: 'unknown' }),
  getCoinInfo: async () => null,
  getGasPrice: async () => '0',
  checkSufficientBalance: async () => false,
  parseAmount: () => '0',
  formatAmount: () => '0',
  validateAddress: () => false,
});

export const useSuiTransaction = () => useContext(SuiTransactionContext);

interface SuiTransactionProviderProps {
  children: ReactNode;
}

export function SuiTransactionProvider({ children }: SuiTransactionProviderProps) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransaction();

  // Balance methods
  const getBalance = async (): Promise<SuiBalance | null> => {
    if (!currentAccount?.address) return null;
    try {
      return await getSuiBalance(currentAccount.address);
    } catch (error) {
      console.error('Failed to get SUI balance:', error);
      return null;
    }
  };

  const getTokenBalance = async (coinType: string): Promise<SuiTokenBalance | null> => {
    if (!currentAccount?.address) return null;
    try {
      return await getSuiTokenBalance(currentAccount.address, coinType);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return null;
    }
  };

  const getAllBalancesHandler = async () => {
    if (!currentAccount?.address) return [];
    try {
      return await getAllBalances(currentAccount.address);
    } catch (error) {
      console.error('Failed to get all balances:', error);
      return [];
    }
  };

  // Transfer methods
  const sendSUI = async (toAddress: string, amount: string): Promise<TransactionResult> => {
    if (!currentAccount?.address) {
      return { success: false, digest: '', error: 'Wallet not connected' };
    }
    
    if (!isValidSuiAddress(toAddress)) {
      return { success: false, digest: '', error: 'Invalid recipient address' };
    }

    try {
      return await sendSui(signAndExecuteTransactionBlock, toAddress, amount);
    } catch (error: any) {
      return { success: false, digest: '', error: error.message || 'Transfer failed' };
    }
  };

  const sendToken = async (
    coinType: string,
    toAddress: string,
    amount: string
  ): Promise<TransactionResult> => {
    if (!currentAccount?.address) {
      return { success: false, digest: '', error: 'Wallet not connected' };
    }
    
    if (!isValidSuiAddress(toAddress)) {
      return { success: false, digest: '', error: 'Invalid recipient address' };
    }

    try {
      return await sendSuiToken(
        signAndExecuteTransactionBlock,
        currentAccount.address,
        coinType,
        toAddress,
        amount
      );
    } catch (error: any) {
      return { success: false, digest: '', error: error.message || 'Transfer failed' };
    }
  };

  // Utility methods
  const waitForTx = async (digest: string): Promise<boolean> => {
    try {
      return await waitForTransaction(digest);
    } catch (error) {
      console.error('Failed to wait for transaction:', error);
      return false;
    }
  };

  const getTxStatus = async (digest: string) => {
    try {
      return await getTransactionStatus(digest);
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return { status: 'unknown', error: 'Failed to get status' };
    }
  };

  const getCoinInfo = async (coinType: string) => {
    try {
      return await getCoinMetadata(coinType);
    } catch (error) {
      console.error('Failed to get coin metadata:', error);
      return null;
    }
  };

  const getGasPriceHandler = async (): Promise<string> => {
    try {
      return await getGasPrice();
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return '0';
    }
  };

  const checkSufficientBalance = async (
    amount: string,
    coinType: string = '0x2::sui::SUI'
  ): Promise<boolean> => {
    if (!currentAccount?.address) return false;
    try {
      return await hasSufficientBalance(currentAccount.address, amount, coinType);
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
    return isValidSuiAddress(address);
  };

  return (
    <SuiTransactionContext.Provider
      value={{
        getBalance,
        getTokenBalance,
        getAllBalances: getAllBalancesHandler,
        sendSUI,
        sendToken,
        waitForTx,
        getTxStatus,
        getCoinInfo,
        getGasPrice: getGasPriceHandler,
        checkSufficientBalance,
        parseAmount: parseAmountHandler,
        formatAmount: formatAmountHandler,
        validateAddress,
      }}
    >
      {children}
    </SuiTransactionContext.Provider>
  );
}
