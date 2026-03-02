import { useState, useEffect, useCallback } from 'react';
import type { AdapterHookResult } from '../core/types';

// Lazy-loaded NEAR connector state
let nearConnector: any = null;

function initNearConnector(networkId: string = 'mainnet') {
  if (typeof window === 'undefined') return null;
  if (nearConnector) return nearConnector;

  try {
    // Dynamic require — will fail gracefully if not installed
    const { NearConnector } = require('@hot-labs/near-connect');
    nearConnector = new NearConnector({
      networkId,
      network: networkId,
      logger: { log: console.log, error: console.error },
    } as any);
    return nearConnector;
  } catch {
    return null;
  }
}

async function getNearAccount(): Promise<string | null> {
  if (!nearConnector) return null;
  try {
    const wallet = await nearConnector.wallet().catch(() => null);
    if (!wallet) return null;
    const accounts = await (wallet as any).getAccounts?.();
    if (accounts?.length > 0) {
      const accountId = accounts[0].accountId || accounts[0];
      return typeof accountId === 'string' ? accountId : null;
    }
    return null;
  } catch {
    return null;
  }
}

async function connectNearWallet(): Promise<string | null> {
  if (!nearConnector) throw new Error('NEAR connector not initialized');
  const wallet = await nearConnector.connect();
  const accounts = await (wallet as any).getAccounts?.();
  if (accounts?.length > 0) {
    const accountId = accounts[0].accountId || accounts[0];
    return typeof accountId === 'string' ? accountId : null;
  }
  return null;
}

async function disconnectNearWallet(): Promise<void> {
  if (!nearConnector) return;
  await nearConnector.disconnect();
}

export interface NearAdapterOptions {
  networkId?: string;
}

/**
 * NEAR adapter — uses @hot-labs/near-connect.
 */
export function useNearAdapter(options?: NearAdapterOptions): AdapterHookResult {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const connector = initNearConnector(options?.networkId);
    if (!connector) return;

    const checkConnection = async () => {
      const account = await getNearAccount();
      if (account) setAddress(account);
    };

    const timer = setTimeout(checkConnection, 500);

    const onSignIn = async () => {
      const account = await getNearAccount().catch(() => null);
      if (account) setAddress(account);
    };
    const onSignOut = () => setAddress(null);

    connector.on('wallet:signIn', onSignIn);
    connector.on('wallet:signOut', onSignOut);

    return () => {
      clearTimeout(timer);
      connector.off('wallet:signIn', onSignIn);
      connector.off('wallet:signOut', onSignOut);
    };
  }, [options?.networkId]);

  const connect = useCallback(async () => {
    const account = await connectNearWallet();
    if (account) setAddress(account);
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectNearWallet();
    setAddress(null);
  }, []);

  return {
    chain: 'near',
    address,
    connected: !!address,
    connect,
    disconnect,
  };
}
