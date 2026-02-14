'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useStellarWallet } from './StellarWalletProvider';
import * as stellarService from '../services/stellarService';
import * as StellarSdk from '@stellar/stellar-sdk';

interface StellarTransactionContextType {
  // Balance queries
  getBalance: () => Promise<string>;
  getAssetBalance: (assetCode: string, assetIssuer: string) => Promise<string>;
  getAllBalances: () => Promise<any[]>;
  
  // Transfer methods
  sendXLM: (toAddress: string, amount: string, memo?: string) => Promise<any>;
  sendAsset: (
    toAddress: string,
    assetCode: string,
    assetIssuer: string,
    amount: string,
    memo?: string
  ) => Promise<any>;
  
  // Transaction utilities
  waitForTx: (txHash: string) => Promise<any>;
  getTxStatus: (txHash: string) => Promise<any>;
  
  // Account utilities
  accountExists: (publicKey: string) => Promise<boolean>;
  getMinimumBalance: () => Promise<string>;
  hasTrustline: (assetCode: string, assetIssuer: string) => Promise<boolean>;
  createTrustline: (assetCode: string, assetIssuer: string, limit?: string) => Promise<any>;
  
  // Utility functions
  parseAmount: (stroops: string) => string;
  formatAmount: (xlm: string) => string;
  validateAddress: (address: string) => boolean;
  estimateFee: () => Promise<string>;
}

const StellarTransactionContext = createContext<StellarTransactionContextType | undefined>(
  undefined
);

export function StellarTransactionProvider({ children }: { children: ReactNode }) {
  const { publicKey, isConnected } = useStellarWallet();

  // Helper to get Freighter API
  const getFreighter = () => {
    if (typeof window === 'undefined') return null;
    return (window as any).freighter;
  };

  // Balance queries
  const getBalance = async (): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected');
    return stellarService.getXLMBalance(publicKey);
  };

  const getAssetBalance = async (
    assetCode: string,
    assetIssuer: string
  ): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected');
    return stellarService.getAssetBalance(publicKey, assetCode, assetIssuer);
  };

  const getAllBalances = async (): Promise<any[]> => {
    if (!publicKey) throw new Error('Wallet not connected');
    return stellarService.getAllBalances(publicKey);
  };

  // Send XLM
  const sendXLM = async (
    toAddress: string,
    amount: string,
    memo?: string
  ): Promise<any> => {
    if (!publicKey) throw new Error('Wallet not connected');
    if (!isConnected) throw new Error('Wallet not connected');

    const freighter = getFreighter();
    if (!freighter) throw new Error('Freighter wallet not found');

    try {
      // Build transaction
      const transaction = await stellarService.buildXLMPayment(
        publicKey,
        toAddress,
        amount,
        memo
      );

      // Sign with Freighter
      const xdr = transaction.toXDR();
      const signedXdr = await freighter.signTransaction(xdr, {
        networkPassphrase: StellarSdk.Networks.PUBLIC,
      });

      // Submit transaction
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        StellarSdk.Networks.PUBLIC
      ) as StellarSdk.Transaction;

      const result = await stellarService.submitTransaction(signedTransaction);
      return result;
    } catch (error: any) {
      console.error('Error sending XLM:', error);
      throw new Error(error.message || 'Failed to send XLM');
    }
  };

  // Send asset
  const sendAsset = async (
    toAddress: string,
    assetCode: string,
    assetIssuer: string,
    amount: string,
    memo?: string
  ): Promise<any> => {
    if (!publicKey) throw new Error('Wallet not connected');
    if (!isConnected) throw new Error('Wallet not connected');

    const freighter = getFreighter();
    if (!freighter) throw new Error('Freighter wallet not found');

    try {
      // Build transaction
      const transaction = await stellarService.buildAssetPayment(
        publicKey,
        toAddress,
        assetCode,
        assetIssuer,
        amount,
        memo
      );

      // Sign with Freighter
      const xdr = transaction.toXDR();
      const signedXdr = await freighter.signTransaction(xdr, {
        networkPassphrase: StellarSdk.Networks.PUBLIC,
      });

      // Submit transaction
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        StellarSdk.Networks.PUBLIC
      ) as StellarSdk.Transaction;

      const result = await stellarService.submitTransaction(signedTransaction);
      return result;
    } catch (error: any) {
      console.error('Error sending asset:', error);
      throw new Error(error.message || `Failed to send ${assetCode}`);
    }
  };

  // Create trustline
  const createTrustline = async (
    assetCode: string,
    assetIssuer: string,
    limit?: string
  ): Promise<any> => {
    if (!publicKey) throw new Error('Wallet not connected');
    if (!isConnected) throw new Error('Wallet not connected');

    const freighter = getFreighter();
    if (!freighter) throw new Error('Freighter wallet not found');

    try {
      // Build change trust transaction
      const transaction = await stellarService.buildChangeTrust(
        publicKey,
        assetCode,
        assetIssuer,
        limit
      );

      // Sign with Freighter
      const xdr = transaction.toXDR();
      const signedXdr = await freighter.signTransaction(xdr, {
        networkPassphrase: StellarSdk.Networks.PUBLIC,
      });

      // Submit transaction
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        StellarSdk.Networks.PUBLIC
      ) as StellarSdk.Transaction;

      const result = await stellarService.submitTransaction(signedTransaction);
      return result;
    } catch (error: any) {
      console.error('Error creating trustline:', error);
      throw new Error(error.message || 'Failed to create trustline');
    }
  };

  // Transaction utilities
  const waitForTx = async (txHash: string): Promise<any> => {
    return stellarService.waitForTransaction(txHash);
  };

  const getTxStatus = async (txHash: string): Promise<any> => {
    return stellarService.getTransactionStatus(txHash);
  };

  // Account utilities
  const accountExists = async (address: string): Promise<boolean> => {
    return stellarService.accountExists(address);
  };

  const getMinimumBalance = async (): Promise<string> => {
    return stellarService.getMinimumBalance();
  };

  const hasTrustline = async (
    assetCode: string,
    assetIssuer: string
  ): Promise<boolean> => {
    if (!publicKey) throw new Error('Wallet not connected');
    return stellarService.hasTrustline(publicKey, assetCode, assetIssuer);
  };

  // Utility functions
  const parseAmount = (stroops: string): string => {
    return stellarService.parseAmount(stroops);
  };

  const formatAmount = (xlm: string): string => {
    return stellarService.formatAmount(xlm);
  };

  const validateAddress = (address: string): boolean => {
    return stellarService.validateAddress(address);
  };

  const estimateFee = async (): Promise<string> => {
    return stellarService.estimateFee();
  };

  return (
    <StellarTransactionContext.Provider
      value={{
        getBalance,
        getAssetBalance,
        getAllBalances,
        sendXLM,
        sendAsset,
        waitForTx,
        getTxStatus,
        accountExists,
        getMinimumBalance,
        hasTrustline,
        createTrustline,
        parseAmount,
        formatAmount,
        validateAddress,
        estimateFee,
      }}
    >
      {children}
    </StellarTransactionContext.Provider>
  );
}

export function useStellarTransaction() {
  const context = useContext(StellarTransactionContext);
  if (context === undefined) {
    throw new Error('useStellarTransaction must be used within a StellarTransactionProvider');
  }
  return context;
}
