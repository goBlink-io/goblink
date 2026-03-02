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
    if (caipAddress.startsWith('eip155:')) return 'evm' as ChainType;
    if (caipAddress.startsWith('solana:')) return 'solana' as ChainType;
    if (caipAddress.startsWith('bip122:')) return 'bitcoin' as ChainType;
    return null;
  })();

  const evmAddress =
    (appKitChain === 'evm' && appKitAddress) || (wagmiConnected && wagmiAddress) || null;
  const solanaAddress = (appKitChain === 'solana' && appKitAddress) || null;
  const bitcoinAddress = (appKitChain === 'bitcoin' && appKitAddress) || null;

  const connect = useCallback(async () => {
    openAppKit();
  }, [openAppKit]);

  const disconnect = useCallback(async () => {
    if (appKitConnected) await appKitDisconnect();
    if (wagmiConnected) wagmiDisconnect();
  }, [appKitConnected, appKitDisconnect, wagmiConnected, wagmiDisconnect]);

  return {
    evm: {
      chain: 'evm',
      address: evmAddress,
      connected: !!evmAddress,
      connect,
      disconnect,
    },
    solana: {
      chain: 'solana',
      address: solanaAddress,
      connected: !!solanaAddress,
      connect,
      disconnect,
    },
    bitcoin: {
      chain: 'bitcoin',
      address: bitcoinAddress,
      connected: !!bitcoinAddress,
      connect,
      disconnect,
    },
  };
}
