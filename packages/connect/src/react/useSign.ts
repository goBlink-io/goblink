import { useCallback } from 'react';
import { useBlinkWalletContext } from './BlinkConnectProvider';
import type { ChainType } from '../core/types';

export interface UseSignReturn {
  /**
   * Sign a message with the connected wallet.
   * Uses the primary chain or specified chain.
   */
  signMessage: (message: string, chain?: ChainType) => Promise<string>;

  /**
   * Sign and send a transaction.
   * Uses the primary chain or specified chain.
   */
  signTransaction: (tx: unknown, chain?: ChainType) => Promise<string>;
}

/**
 * Hook for signing messages and transactions.
 *
 * @example
 * ```tsx
 * const { signMessage, signTransaction } = useSign();
 *
 * const signature = await signMessage("Hello, World!");
 * const txHash = await signTransaction({ to: '0x...', value: '0.1' });
 * ```
 */
export function useSign(): UseSignReturn {
  const ctx = useBlinkWalletContext();

  const signMessage = useCallback(
    async (message: string, chain?: ChainType): Promise<string> => {
      const targetChain = chain || ctx.chain;
      if (!targetChain) throw new Error('No wallet connected');

      // Signing is chain-specific and depends on the underlying wallet SDK.
      // This hook provides a unified interface — real implementation would
      // delegate to the chain adapter's sign method.
      throw new Error(
        `signMessage not yet implemented for ${targetChain}. Use the chain-specific SDK directly.`
      );
    },
    [ctx.chain]
  );

  const signTransaction = useCallback(
    async (tx: unknown, chain?: ChainType): Promise<string> => {
      const targetChain = chain || ctx.chain;
      if (!targetChain) throw new Error('No wallet connected');

      throw new Error(
        `signTransaction not yet implemented for ${targetChain}. Use the chain-specific SDK directly.`
      );
    },
    [ctx.chain]
  );

  return { signMessage, signTransaction };
}
