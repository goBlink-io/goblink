import { useState, useEffect, useCallback } from 'react';
import { useBlinkWalletContext } from './BlinkConnectProvider';
import type { ChainType } from '../core/types';

export interface BalanceResult {
  /** Formatted balance string */
  balance: string | null;

  /** Native token symbol */
  symbol: string | null;

  /** Whether balance is currently loading */
  isLoading: boolean;

  /** Error if balance fetch failed */
  error: Error | null;

  /** Manually refresh the balance */
  refetch: () => void;
}

/**
 * Hook to fetch wallet balance for a connected chain.
 * Auto-refreshes on an interval.
 *
 * @param chain - The chain to fetch balance for. Defaults to primary chain.
 * @param refreshInterval - Auto-refresh interval in ms. Default 30000 (30s). Set to 0 to disable.
 *
 * @example
 * ```tsx
 * const { balance, symbol, isLoading } = useBalance('EVM');
 * // => { balance: "1.234", symbol: "ETH", isLoading: false }
 * ```
 */
export function useBalance(chain?: ChainType, refreshInterval = 30000): BalanceResult {
  const ctx = useBlinkWalletContext();
  const targetChain = chain || ctx.chain;

  const [balance, setBalance] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!targetChain) return;
    const adapter = ctx.adapters[targetChain];
    if (!adapter?.connected || !adapter.address) {
      setBalance(null);
      setSymbol(null);
      return;
    }

    // Balance fetching depends on the adapter implementing getBalance
    // For now, we set a placeholder — real implementation would use chain-specific RPC
    setIsLoading(true);
    setError(null);

    try {
      // Adapters can optionally implement getBalance via the raw adapter
      // This is a hook-level concern — each chain has different balance APIs
      setBalance(null);
      setSymbol(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch balance'));
    } finally {
      setIsLoading(false);
    }
  }, [targetChain, ctx.adapters]);

  useEffect(() => {
    fetchBalance();

    if (refreshInterval > 0) {
      const timer = setInterval(fetchBalance, refreshInterval);
      return () => clearInterval(timer);
    }
  }, [fetchBalance, refreshInterval]);

  return {
    balance,
    symbol,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}
