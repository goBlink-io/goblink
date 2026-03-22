import { useCallback } from 'react';
import { useBlinkWalletContext } from './BlinkConnectProvider';
import type { ChainType, ConnectedWallet } from '../core/types';

export interface UseWalletReturn {
  /** All connected wallets */
  wallets: ConnectedWallet[];

  /** Primary wallet address (first connected) */
  address: string | null;

  /** Primary wallet chain */
  chain: ChainType | null;

  /** Whether any wallet is connected */
  isConnected: boolean;

  /** Number of connected wallets */
  connectedCount: number;

  /** Open the connect modal, optionally for a specific chain */
  connect: (chain?: ChainType) => Promise<void>;

  /** Disconnect a specific chain or all */
  disconnect: (chain?: ChainType) => Promise<void>;

  /** Get address for a specific chain */
  getAddress: (chain: ChainType) => string | null;

  /** Check if a specific chain is connected */
  isChainConnected: (chain: ChainType) => boolean;

  /** Switch primary chain (opens modal for that chain) */
  switchChain: (chain: ChainType) => Promise<void>;
}

/**
 * Primary hook for wallet interaction.
 *
 * @example
 * ```tsx
 * const { wallets, address, isConnected, connect, disconnect } = useWallet();
 *
 * // Connect any chain
 * <button onClick={() => connect()}>Connect</button>
 *
 * // Connect specific chain
 * <button onClick={() => connect('SOLANA')}>Connect Solana</button>
 *
 * // Show address
 * {isConnected && <span>{address}</span>}
 * ```
 */
export function useWallet(): UseWalletReturn {
  const ctx = useBlinkWalletContext();

  const switchChain = useCallback(
    async (chain: ChainType) => {
      if (!ctx.isChainConnected(chain)) {
        await ctx.connect(chain);
      }
    },
    [ctx]
  );

  return {
    wallets: ctx.connectedWallets,
    address: ctx.address,
    chain: ctx.chain,
    isConnected: ctx.isConnected,
    connectedCount: ctx.connectedWallets.length,
    connect: ctx.connect,
    disconnect: ctx.disconnect,
    getAddress: ctx.getAddressForChain,
    isChainConnected: ctx.isChainConnected,
    switchChain,
  };
}
