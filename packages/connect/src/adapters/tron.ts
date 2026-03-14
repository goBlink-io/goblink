import { useCallback } from 'react';
import { useWallet as useTronWallet } from '@tronweb3/tronwallet-adapter-react-hooks';
import type { AdapterHookResult } from '../core/types';

/**
 * TRON adapter — uses @tronweb3/tronwallet-adapter-react-hooks.
 */
export function useTronAdapter(): AdapterHookResult {
  const {
    address,
    connected,
    disconnect: tronDisconnect,
    select,
    wallets,
    connect: tronConnect,
  } = useTronWallet();

  const connect = useCallback(async () => {
    try {
      if (wallets?.length) {
        select(wallets[0].adapter.name);
        await tronConnect();
      }
    } catch (error) {
      console.error('[BlinkConnect] Tron connect failed:', error);
    }
  }, [select, wallets, tronConnect]);

  const disconnect = useCallback(async () => {
    try {
      await tronDisconnect();
    } catch (error) {
      console.error('[BlinkConnect] Tron disconnect failed:', error);
    }
  }, [tronDisconnect]);

  return {
    chain: 'TRON',
    address: connected ? address ?? null : null,
    connected,
    connect,
    disconnect,
  };
}
