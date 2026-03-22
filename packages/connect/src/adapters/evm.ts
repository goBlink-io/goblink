import { useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import {
  useAppKitAccount,
  useDisconnect as useAppKitDisconnect,
  useAppKit,
} from '@reown/appkit/react';
import type { AdapterHookResult, ChainType, ConnectOptions } from '../core/types';

interface EvmAdapterResult {
  evm: AdapterHookResult;
  solana: AdapterHookResult;
  bitcoin: AdapterHookResult;
}

/**
 * EVM adapter — uses ReOwn AppKit which handles EVM + Solana + Bitcoin.
 * Returns adapter results for all three chains since they share one connection layer.
 */
export function useEvmAdapter(): EvmAdapterResult {
  const { address: appKitAddress, isConnected: appKitConnected, caipAddress } = useAppKitAccount();
  const { disconnect: appKitDisconnect } = useAppKitDisconnect();
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { open: openAppKit } = useAppKit();

  // Determine which chain AppKit is connected to via CAIP address
  const appKitChain = (() => {
    if (!caipAddress) return null;
    if (caipAddress.startsWith('eip155:')) return 'EVM' as ChainType;
    if (caipAddress.startsWith('solana:')) return 'SOLANA' as ChainType;
    if (caipAddress.startsWith('bip122:')) return 'BITCOIN' as ChainType;
    return null;
  })();

  const evmAddress =
    (appKitChain === 'EVM' && appKitAddress) || (wagmiConnected && wagmiAddress) || null;
  const solanaAddress = (appKitChain === 'SOLANA' && appKitAddress) || null;
  const bitcoinAddress = (appKitChain === 'BITCOIN' && appKitAddress) || null;

  const connect = useCallback(async () => {
    try {
      openAppKit();
    } catch (error) {
      console.error('[BlinkConnect] EVM/AppKit connect failed:', error);
    }
  }, [openAppKit]);

  const disconnect = useCallback(async () => {
    try {
      if (appKitConnected) await appKitDisconnect();
      if (wagmiConnected) wagmiDisconnect();
    } catch (error) {
      console.error('[BlinkConnect] EVM/AppKit disconnect failed:', error);
    }
  }, [appKitConnected, appKitDisconnect, wagmiConnected, wagmiDisconnect]);

  return {
    evm: {
      chain: 'EVM',
      address: evmAddress,
      connected: !!evmAddress,
      connect,
      disconnect,
    },
    solana: {
      chain: 'SOLANA',
      address: solanaAddress,
      connected: !!solanaAddress,
      connect,
      disconnect,
    },
    bitcoin: {
      chain: 'BITCOIN',
      address: bitcoinAddress,
      connected: !!bitcoinAddress,
      connect,
      disconnect,
    },
  };
}
