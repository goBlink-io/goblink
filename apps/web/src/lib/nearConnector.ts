'use client';

import { NearConnector } from '@hot-labs/near-connect';

// Initialize NEAR connector
let nearConnector: NearConnector | null = null;

export const initNearConnector = () => {
  if (typeof window === 'undefined') return null;
  
  if (!nearConnector) {
    nearConnector = new NearConnector({
      networkId: process.env.NEXT_PUBLIC_NEAR_NETWORK_ID || 'mainnet',
      network: 'mainnet',
      logger: {
        log: console.log,
        error: console.error,
      },
    } as any); // Type assertion due to library type limitations
  }
  
  return nearConnector;
};

export const getNearConnector = () => {
  if (!nearConnector) {
    return initNearConnector();
  }
  return nearConnector;
};

export const connectNearWallet = async () => {
  const connector = getNearConnector();
  if (!connector) throw new Error('NEAR connector not initialized');
  
  try {
    console.log('[nearConnector] Initiating wallet connection...');
    const wallet = await connector.connect();
    console.log('[nearConnector] Wallet connected:', wallet);
    
    // Get accounts from the wallet
    const accounts = await (wallet as any).getAccounts?.();
    console.log('[nearConnector] Accounts:', accounts);
    
    if (accounts && accounts.length > 0) {
      const accountId = accounts[0].accountId || accounts[0];
      console.log('[nearConnector] Account ID:', accountId);
      return typeof accountId === 'string' ? accountId : null;
    }
    
    console.log('[nearConnector] No accounts found');
    return null;
  } catch (error) {
    console.error('[nearConnector] Failed to connect NEAR wallet:', error);
    throw error;
  }
};

export const disconnectNearWallet = async () => {
  const connector = getNearConnector();
  if (!connector) return;
  
  try {
    await connector.disconnect();
  } catch (error) {
    console.error('Failed to disconnect NEAR wallet:', error);
    throw error;
  }
};

export const getNearAccount = async (): Promise<string | null> => {
  const connector = getNearConnector();
  if (!connector) {
    console.log('[nearConnector] Connector not initialized');
    return null;
  }
  
  try {
    // Try to get wallet - it may not be available if not connected
    const wallet = await connector.wallet().catch(() => null);
    
    if (!wallet) {
      console.log('[nearConnector] No wallet instance available');
      return null;
    }
    
    // Try to get accounts from the wallet
    const accounts = await (wallet as any).getAccounts?.();
    console.log('[nearConnector] Got accounts:', accounts);
    
    if (accounts && accounts.length > 0) {
      const accountId = accounts[0].accountId || accounts[0];
      if (typeof accountId === 'string') {
        console.log('[nearConnector] Found accountId:', accountId);
        return accountId;
      }
    }
    
    console.log('[nearConnector] Wallet exists but no accounts');
    return null;
  } catch (error) {
    console.error('[nearConnector] Error getting NEAR account:', error);
    return null;
  }
};

export const isNearWalletConnected = async () => {
  const connector = getNearConnector();
  if (!connector) return false;
  
  try {
    const wallet = await connector.wallet();
    return !!(wallet as any)?.accountId;
  } catch (error) {
    return false;
  }
};
