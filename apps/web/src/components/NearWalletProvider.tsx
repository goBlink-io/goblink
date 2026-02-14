'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';
import '@near-wallet-selector/modal-ui/styles.css';
import {
  getNearBalance,
  getFTBalance,
  transferNear,
  transferFT,
  checkStorageDeposit,
  registerFTAccount,
  waitForTransaction,
  type NearBalance,
  type FTBalance,
  type TransactionResult,
} from '../services/nearService';

interface NearWalletContextType {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accounts: AccountState[];
  accountId: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  // Balance methods
  getBalance: () => Promise<NearBalance | null>;
  getFTBalanceFor: (contractId: string) => Promise<FTBalance | null>;
  // Transaction methods
  sendNear: (receiverId: string, amount: string) => Promise<TransactionResult>;
  sendFT: (contractId: string, receiverId: string, amount: string, memo?: string) => Promise<TransactionResult>;
  ensureFTStorage: (contractId: string, accountId?: string) => Promise<TransactionResult>;
  checkFTStorage: (contractId: string, accountId?: string) => Promise<boolean>;
}

const NearWalletContext = createContext<NearWalletContextType>({
  selector: null,
  modal: null,
  accounts: [],
  accountId: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  getBalance: async () => null,
  getFTBalanceFor: async () => null,
  sendNear: async () => ({ success: false, transactionHash: '', error: 'Not connected' }),
  sendFT: async () => ({ success: false, transactionHash: '', error: 'Not connected' }),
  ensureFTStorage: async () => ({ success: false, transactionHash: '', error: 'Not connected' }),
  checkFTStorage: async () => false,
});

export const useNearWallet = () => useContext(NearWalletContext);

interface NearWalletProviderProps {
  children: ReactNode;
}

export function NearWalletProvider({ children }: NearWalletProviderProps) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<AccountState[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const initWalletSelector = async () => {
      try {
        const _selector = await setupWalletSelector({
          network: 'mainnet',
          modules: [
            setupMyNearWallet(),
            setupMeteorWallet(),
            setupHereWallet(),
          ],
        });

        const _modal = setupModal(_selector, {
          contractId: '', // Optional: Add contract ID if needed
        });

        const state = _selector.store.getState();
        setAccounts(state.accounts);

        // Subscribe to wallet state changes
        const subscription = _selector.store.observable
          .subscribe((state) => {
            setAccounts(state.accounts);
          });

        setSelector(_selector);
        setModal(_modal);

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Failed to initialize NEAR wallet selector:', error);
      }
    };

    initWalletSelector();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      setAccountId(accounts[0].accountId);
    } else {
      setAccountId(null);
    }
  }, [accounts]);

  const connect = () => {
    if (modal) {
      modal.show();
    }
  };

  const disconnect = async () => {
    if (selector) {
      const wallet = await selector.wallet();
      await wallet.signOut();
    }
  };

  // Balance methods
  const getBalance = async (): Promise<NearBalance | null> => {
    if (!accountId) return null;
    try {
      return await getNearBalance(accountId);
    } catch (error) {
      console.error('Failed to get NEAR balance:', error);
      return null;
    }
  };

  const getFTBalanceFor = async (contractId: string): Promise<FTBalance | null> => {
    if (!accountId) return null;
    try {
      return await getFTBalance(accountId, contractId);
    } catch (error) {
      console.error('Failed to get FT balance:', error);
      return null;
    }
  };

  // Transaction methods
  const sendNear = async (receiverId: string, amount: string): Promise<TransactionResult> => {
    if (!selector) {
      return { success: false, transactionHash: '', error: 'Wallet not connected' };
    }
    return await transferNear(selector, receiverId, amount);
  };

  const sendFT = async (
    contractId: string,
    receiverId: string,
    amount: string,
    memo?: string
  ): Promise<TransactionResult> => {
    if (!selector) {
      return { success: false, transactionHash: '', error: 'Wallet not connected' };
    }
    return await transferFT(selector, contractId, receiverId, amount, memo);
  };

  const ensureFTStorage = async (
    contractId: string,
    targetAccountId?: string
  ): Promise<TransactionResult> => {
    if (!selector) {
      return { success: false, transactionHash: '', error: 'Wallet not connected' };
    }
    return await registerFTAccount(selector, contractId, targetAccountId);
  };

  const checkFTStorage = async (
    contractId: string,
    targetAccountId?: string
  ): Promise<boolean> => {
    const checkAccountId = targetAccountId || accountId;
    if (!checkAccountId) return false;
    try {
      return await checkStorageDeposit(checkAccountId, contractId);
    } catch (error) {
      console.error('Failed to check FT storage:', error);
      return false;
    }
  };

  return (
    <NearWalletContext.Provider
      value={{
        selector,
        modal,
        accounts,
        accountId,
        isConnected: accounts.length > 0,
        connect,
        disconnect,
        getBalance,
        getFTBalanceFor,
        sendNear,
        sendFT,
        ensureFTStorage,
        checkFTStorage,
      }}
    >
      {children}
    </NearWalletContext.Provider>
  );
}
