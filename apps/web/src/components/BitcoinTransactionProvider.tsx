'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useBitcoinWallet } from './BitcoinWalletProvider';
import {
  getUTXOs,
  getBitcoinBalance,
  getFeeEstimates,
  calculateFee,
  selectUTXOs,
  sendBitcoin,
  getTransaction,
  getTransactionStatus,
  waitForConfirmation,
  isValidBitcoinAddress,
  btcToSatoshis,
  satoshisToBTC,
  formatBTC,
  parseBTC,
  hasSufficientBalance,
  getRecommendedFee,
  estimateTransactionSize,
  type UTXO,
  type BitcoinBalance,
  type TransactionResult,
  type FeeEstimate,
} from '../services/bitcoinService';

interface BitcoinTransactionContextType {
  // Balance and UTXO methods
  getBalance: () => Promise<BitcoinBalance | null>;
  getUTXOs: () => Promise<UTXO[] | null>;

  // Transaction methods
  sendBTC: (toAddress: string, amount: number, feeRate: number) => Promise<TransactionResult>;

  // Fee estimation
  getFeeEstimates: () => Promise<FeeEstimate | null>;
  getRecommendedFee: (priority?: 'fast' | 'medium' | 'slow') => Promise<number>;
  calculateFee: (inputCount: number, outputCount: number, feeRate: number) => number;
  estimateTxSize: (inputCount: number, outputCount: number) => number;

  // Transaction tracking
  getTx: (txid: string) => Promise<any>;
  getTxStatus: (txid: string) => Promise<any>;
  waitForConfirmation: (txid: string) => Promise<boolean>;

  // UTXO management
  selectUTXOs: (targetAmount: number, feeRate: number) => Promise<{ selectedUTXOs: UTXO[]; fee: number; change: number } | null>;

  // Utility methods
  validateAddress: (address: string) => boolean;
  btcToSatoshis: (btc: number | string) => number;
  satoshisToBTC: (satoshis: number) => string;
  formatBTC: (satoshis: number, decimals?: number) => string;
  parseBTC: (btc: string) => number;
  checkSufficientBalance: (amount: number) => Promise<boolean>;
}

const BitcoinTransactionContext = createContext<BitcoinTransactionContextType>({
  getBalance: async () => null,
  getUTXOs: async () => null,
  sendBTC: async () => ({ success: false, txid: '', error: 'Not connected' }),
  getFeeEstimates: async () => null,
  getRecommendedFee: async () => 10,
  calculateFee: () => 0,
  estimateTxSize: () => 0,
  getTx: async () => null,
  getTxStatus: async () => ({ confirmed: false }),
  waitForConfirmation: async () => false,
  selectUTXOs: async () => null,
  validateAddress: () => false,
  btcToSatoshis: () => 0,
  satoshisToBTC: () => '0',
  formatBTC: () => '0',
  parseBTC: () => 0,
  checkSufficientBalance: async () => false,
});

export const useBitcoinTransaction = () => useContext(BitcoinTransactionContext);

interface BitcoinTransactionProviderProps {
  children: ReactNode;
}

export function BitcoinTransactionProvider({ children }: BitcoinTransactionProviderProps) {
  const { paymentAddress, network } = useBitcoinWallet();
  const isTestnet = network !== 'Mainnet';

  // Balance and UTXO methods
  const getBalance = async (): Promise<BitcoinBalance | null> => {
    if (!paymentAddress) return null;
    try {
      return await getBitcoinBalance(paymentAddress, isTestnet);
    } catch (error) {
      console.error('Failed to get Bitcoin balance:', error);
      return null;
    }
  };

  const getUTXOsHandler = async (): Promise<UTXO[] | null> => {
    if (!paymentAddress) return null;
    try {
      return await getUTXOs(paymentAddress, isTestnet);
    } catch (error) {
      console.error('Failed to get UTXOs:', error);
      return null;
    }
  };

  // Transaction methods
  const sendBTCHandler = async (
    toAddress: string,
    amount: number,
    feeRate: number
  ): Promise<TransactionResult> => {
    if (!paymentAddress) {
      return { success: false, txid: '', error: 'Wallet not connected' };
    }

    if (!isValidBitcoinAddress(toAddress)) {
      return { success: false, txid: '', error: 'Invalid recipient address' };
    }

    try {
      return await sendBitcoin(paymentAddress, toAddress, amount, feeRate, isTestnet);
    } catch (error: any) {
      return { success: false, txid: '', error: error.message || 'Transfer failed' };
    }
  };

  // Fee estimation
  const getFeeEstimatesHandler = async (): Promise<FeeEstimate | null> => {
    try {
      return await getFeeEstimates(isTestnet);
    } catch (error) {
      console.error('Failed to get fee estimates:', error);
      return null;
    }
  };

  const getRecommendedFeeHandler = async (priority: 'fast' | 'medium' | 'slow' = 'medium'): Promise<number> => {
    try {
      return await getRecommendedFee(priority, isTestnet);
    } catch (error) {
      console.error('Failed to get recommended fee:', error);
      return 10; // Default fallback
    }
  };

  const calculateFeeHandler = (inputCount: number, outputCount: number, feeRate: number): number => {
    return calculateFee(inputCount, outputCount, feeRate);
  };

  const estimateTxSize = (inputCount: number, outputCount: number): number => {
    return estimateTransactionSize(inputCount, outputCount);
  };

  // Transaction tracking
  const getTx = async (txid: string) => {
    try {
      return await getTransaction(txid, isTestnet);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  };

  const getTxStatus = async (txid: string) => {
    try {
      return await getTransactionStatus(txid, isTestnet);
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return { confirmed: false, error: 'Failed to get status' };
    }
  };

  const waitForConfirmationHandler = async (txid: string): Promise<boolean> => {
    try {
      return await waitForConfirmation(txid, isTestnet);
    } catch (error) {
      console.error('Failed to wait for confirmation:', error);
      return false;
    }
  };

  // UTXO management
  const selectUTXOsHandler = async (
    targetAmount: number,
    feeRate: number
  ): Promise<{ selectedUTXOs: UTXO[]; fee: number; change: number } | null> => {
    if (!paymentAddress) return null;
    try {
      const utxos = await getUTXOs(paymentAddress, isTestnet);
      return selectUTXOs(utxos, targetAmount, feeRate);
    } catch (error) {
      console.error('Failed to select UTXOs:', error);
      return null;
    }
  };

  // Utility methods
  const validateAddress = (address: string): boolean => {
    return isValidBitcoinAddress(address);
  };

  const btcToSatoshisHandler = (btc: number | string): number => {
    return btcToSatoshis(btc);
  };

  const satoshisToBTCHandler = (satoshis: number): string => {
    return satoshisToBTC(satoshis);
  };

  const formatBTCHandler = (satoshis: number, decimals: number = 8): string => {
    return formatBTC(satoshis, decimals);
  };

  const parseBTCHandler = (btc: string): number => {
    try {
      return parseBTC(btc);
    } catch (error) {
      console.error('Failed to parse BTC:', error);
      return 0;
    }
  };

  const checkSufficientBalance = async (amount: number): Promise<boolean> => {
    if (!paymentAddress) return false;
    try {
      return await hasSufficientBalance(paymentAddress, amount, isTestnet);
    } catch (error) {
      console.error('Failed to check balance:', error);
      return false;
    }
  };

  return (
    <BitcoinTransactionContext.Provider
      value={{
        getBalance,
        getUTXOs: getUTXOsHandler,
        sendBTC: sendBTCHandler,
        getFeeEstimates: getFeeEstimatesHandler,
        getRecommendedFee: getRecommendedFeeHandler,
        calculateFee: calculateFeeHandler,
        estimateTxSize,
        getTx,
        getTxStatus,
        waitForConfirmation: waitForConfirmationHandler,
        selectUTXOs: selectUTXOsHandler,
        validateAddress,
        btcToSatoshis: btcToSatoshisHandler,
        satoshisToBTC: satoshisToBTCHandler,
        formatBTC: formatBTCHandler,
        parseBTC: parseBTCHandler,
        checkSufficientBalance,
      }}
    >
      {children}
    </BitcoinTransactionContext.Provider>
  );
}
