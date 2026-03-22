import { useCallback } from 'react';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
import type { AdapterHookResult } from '../core/types';

/**
 * Aptos adapter — uses @aptos-labs/wallet-adapter-react.
 */
export function useAptosAdapter(): AdapterHookResult {
  const {
    account,
    connected,
    disconnect: aptosDisconnect,
    connect: aptosConnect,
    wallets,
  } = useAptosWallet();

  const connect = useCallback(async () => {
    try {
      if (wallets?.length) {
        await aptosConnect((wallets[0] as any).name || wallets[0]);
      }
    } catch (error) {
      console.error('[BlinkConnect] Aptos connect failed:', error);
    }
  }, [aptosConnect, wallets]);

  const disconnect = useCallback(async () => {
    try {
      await aptosDisconnect();
    } catch (error) {
      console.error('[BlinkConnect] Aptos disconnect failed:', error);
    }
  }, [aptosDisconnect]);

  return {
    chain: 'APTOS',
    address: connected ? account?.address?.toString() ?? null : null,
    connected,
    connect,
    disconnect,
  };
}
