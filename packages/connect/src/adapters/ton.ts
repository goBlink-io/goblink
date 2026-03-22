import { useCallback } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import type { AdapterHookResult } from '../core/types';

/**
 * TON adapter — uses @tonconnect/ui-react.
 */
export function useTonAdapter(): AdapterHookResult {
  const [tonConnectUI] = useTonConnectUI();
  const tonAddr = useTonAddress();

  const connect = useCallback(async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('[BlinkConnect] TON connect failed:', error);
    }
  }, [tonConnectUI]);

  const disconnect = useCallback(async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error('[BlinkConnect] TON disconnect failed:', error);
    }
  }, [tonConnectUI]);

  return {
    chain: 'TON',
    address: tonAddr || null,
    connected: !!tonAddr,
    connect,
    disconnect,
  };
}
