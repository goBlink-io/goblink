'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useTronWallet } from './TronWalletProvider';
import {
  getTronBalance,
  getTRC20Balance,
  sendTRX,
  sendTRC20,
  waitForTransaction,
  getTransactionStatus,
  getTRC20TokenInfo,
  parseAmount,
  formatAmount,
  isValidTronAddress,
  estimateTransactionFee,
  hasSufficientBalance,
  trxToSun,
  sunToTrx,
  type TronBalance,
  type TRC20Balance,
  type TransactionResult,
} from '../services/tronService';

interface TronTransactionContextType {
  // Balance methods
  getBalance: () => Promise<TronBalance | null>;
  getTRC20Balance: (tokenAddress: string) => Promise<TRC20Balance | null>;

  // Transfer methods
  sendTRX: (toAddress: string, amount: string) => Promise<TransactionResult>;
  sendTRC20: (tokenAddress: string, toAddress: string, amount: string) => Promise<TransactionResult>;

  // Utility methods
  waitForTx: (txID: string) => Promise<boolean>;
  getTxStatus: (txID: string) => Promise<any>;
  getTokenInfo: (tokenAddress: string) => Promise<any>;
  estimateFee: (isTokenTransfer?: boolean) => Promise<string>;
  checkSufficientBalance: (amount: string, tokenAddress?: string) => Promise<boolean>;

  // Helper methods
  parseAmount: (amount: string, decimals?: number) => string;
  formatAmount: (amount: string, decimals?: number) => string;
  validateAddress: (address: string) => boolean;
  trxToSun: (trxAmount: string | number) => string;
  sunToTrx: (sunAmount: string | number) => string;
}

const TronTransactionContext = createContext<TronTransactionContextType>({
  getBalance: async () => null,
  getTRC20Balance: async () => null,
  sendTRX: async () => ({ success: false, txID: '', error: 'Not connected' }),
  sendTRC20: async () => ({ success: false, txID: '', error: 'Not connected' }),
  waitForTx: async () => false,
  getTxStatus: async () => ({ status: 'unknown' }),
  getTokenInfo: async () => null,
  estimateFee: async () => '0',
  checkSufficientBalance: async () => false,
  parseAmount: () => '0',
  formatAmount: () => '0',
  validateAddress: () => false,
  trxToSun: () => '0',
  sunToTrx: () => '0',
});

export const useTronTransaction = () => useContext(TronTransactionContext);

interface TronTransactionProviderProps {
  children: ReactNode;
}

export function TronTransactionProvider({ children }: TronTransactionProviderProps) {
  const { address, tronWeb } = useTronWallet();

  // Balance methods
  const getBalance = async (): Promise<TronBalance | null> => {
    if (!address) return null;
    try {
      return await getTronBalance(address);
    } catch (error) {
      console.error('Failed to get TRX balance:', error);
      return null;
    }
  };

  const getTRC20BalanceHandler = async (tokenAddress: string): Promise<TRC20Balance | null> => {
    if (!address) return null;
    try {
      return await getTRC20Balance(address, tokenAddress);
    } catch (error) {
      console.error('Failed to get TRC-20 balance:', error);
      return null;
    }
  };

  // Transfer methods
  const sendTRXHandler = async (toAddress: string, amount: string): Promise<TransactionResult> => {
    if (!address || !tronWeb) {
      return { success: false, txID: '', error: 'Wallet not connected' };
    }

    if (!isValidTronAddress(toAddress)) {
      return { success: false, txID: '', error: 'Invalid recipient address' };
    }

    try {
      return await sendTRX(tronWeb, address, toAddress, amount);
    } catch (error: any) {
      return { success: false, txID: '', error: error.message || 'Transfer failed' };
    }
  };

  const sendTRC20Handler = async (
    tokenAddress: string,
    toAddress: string,
    amount: string
  ): Promise<TransactionResult> => {
    if (!address || !tronWeb) {
      return { success: false, txID: '', error: 'Wallet not connected' };
    }

    if (!isValidTronAddress(toAddress)) {
      return { success: false, txID: '', error: 'Invalid recipient address' };
    }

    if (!isValidTronAddress(tokenAddress)) {
      return { success: false, txID: '', error: 'Invalid token address' };
    }

    try {
      return await sendTRC20(tronWeb, address, tokenAddress, toAddress, amount);
    } catch (error: any) {
      return { success: false, txID: '', error: error.message || 'Transfer failed' };
    }
  };

  // Utility methods
  const waitForTx = async (txID: string): Promise<boolean> => {
    try {
      return await waitForTransaction(txID);
    } catch (error) {
      console.error('Failed to wait for transaction:', error);
      return false;
    }
  };

  const getTxStatus = async (txID: string) => {
    try {
      return await getTransactionStatus(txID);
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return { status: 'unknown', error: 'Failed to get status' };
    }
  };

  const getTokenInfo = async (tokenAddress: string) => {
    try {
      return await getTRC20TokenInfo(tokenAddress);
    } catch (error) {
      console.error('Failed to get token info:', error);
      return null;
    }
  };

  const estimateFeeHandler = async (isTokenTransfer: boolean = false): Promise<string> => {
    try {
      return await estimateTransactionFee(isTokenTransfer);
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      return '0';
    }
  };

  const checkSufficientBalance = async (
    amount: string,
    tokenAddress?: string
  ): Promise<boolean> => {
    if (!address) return false;
    try {
      return await hasSufficientBalance(address, amount, tokenAddress);
    } catch (error) {
      console.error('Failed to check balance:', error);
      return false;
    }
  };

  // Helper methods
  const parseAmountHandler = (amount: string, decimals: number = 6): string => {
    try {
      return parseAmount(amount, decimals);
    } catch (error) {
      console.error('Failed to parse amount:', error);
      return '0';
    }
  };

  const formatAmountHandler = (amount: string, decimals: number = 6): string => {
    try {
      return formatAmount(amount, decimals);
    } catch (error) {
      console.error('Failed to format amount:', error);
      return '0';
    }
  };

  const validateAddress = (address: string): boolean => {
    return isValidTronAddress(address);
  };

  const trxToSunHandler = (trxAmount: string | number): string => {
    try {
      return trxToSun(trxAmount);
    } catch (error) {
      console.error('Failed to convert TRX to SUN:', error);
      return '0';
    }
  };

  const sunToTrxHandler = (sunAmount: string | number): string => {
    try {
      return sunToTrx(sunAmount);
    } catch (error) {
      console.error('Failed to convert SUN to TRX:', error);
      return '0';
    }
  };

  return (
    <TronTransactionContext.Provider
      value={{
        getBalance,
        getTRC20Balance: getTRC20BalanceHandler,
        sendTRX: sendTRXHandler,
        sendTRC20: sendTRC20Handler,
        waitForTx,
        getTxStatus,
        getTokenInfo,
        estimateFee: estimateFeeHandler,
        checkSufficientBalance,
        parseAmount: parseAmountHandler,
        formatAmount: formatAmountHandler,
        validateAddress,
        trxToSun: trxToSunHandler,
        sunToTrx: sunToTrxHandler,
      }}
    >
      {children}
    </TronTransactionContext.Provider>
  );
}
