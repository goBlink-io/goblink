'use client';

/**
 * Shared API client — all frontend API calls go through here.
 * Points to our own Next.js API routes (same domain, no CORS).
 */

const API_BASE = '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || error.error || `API error: ${res.status}`);
  }
  return res.json();
}

// === Swap API ===

export const getTokens = () => apiFetch<unknown[]>('/tokens');

export const getQuote = (params: {
  dry?: boolean;
  originAsset: string;
  destinationAsset: string;
  amount: string;
  recipient: string;
  refundTo: string;
  slippageTolerance?: number;
}) => apiFetch<unknown>('/quote', {
  method: 'POST',
  body: JSON.stringify(params),
});

export const submitDeposit = (txHash: string, depositAddress: string) =>
  apiFetch<unknown>('/deposit/submit', {
    method: 'POST',
    body: JSON.stringify({ txHash, depositAddress }),
  });

export const getSwapStatus = (depositAddress: string) =>
  apiFetch<unknown>(`/status/${depositAddress}`);

// === Balance API ===

export const getNearBalance = (accountId: string) =>
  apiFetch<{ balance: string; balanceYocto: string }>(`/balances/near/${accountId}`);

export const getNearTokenBalance = (accountId: string, contractAddress: string, decimals: number) =>
  apiFetch<{ balance: string; balanceRaw: string }>(
    `/balances/near-token/${accountId}?contractAddress=${encodeURIComponent(contractAddress)}&decimals=${decimals}`
  );

export const getSuiBalance = (address: string) =>
  apiFetch<{ balance: string }>(`/balances/sui/${address}`);

export const getSuiTokens = (address: string) =>
  apiFetch<{ tokens: unknown[]; count: number }>(`/balances/sui-tokens/${address}`);

export const getSuiCoins = (address: string) =>
  apiFetch<unknown>(`/balances/sui-coins/${address}`);

export const getSuiTokenBalance = (address: string, coinType: string) =>
  apiFetch<{ balance: string }>(`/balances/sui-token/${address}?coinType=${encodeURIComponent(coinType)}`);

export const getSolanaBalance = (address: string) =>
  apiFetch<{ balance: string }>(`/balances/solana/${address}`);

export const getSolanaBlockhash = () =>
  apiFetch<{ blockhash: string; lastValidBlockHeight: number }>('/balances/solana-blockhash');

export const solanaRpcProxy = (body: unknown) =>
  apiFetch<unknown>('/balances/solana-rpc', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getEvmBalance = (chain: string, address: string) =>
  apiFetch<{ balance: string }>(`/balances/evm/${chain}/${address}`);

export const getEvmTokenBalance = (chain: string, address: string, tokenAddress: string, decimals?: number) =>
  apiFetch<{ balance: string }>(
    `/balances/evm-token/${chain}/${address}?tokenAddress=${encodeURIComponent(tokenAddress)}${decimals !== undefined ? `&decimals=${decimals}` : ''}`
  );
