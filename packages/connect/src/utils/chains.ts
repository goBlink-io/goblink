import type { ChainType } from '../core/types';

export interface ChainMeta {
  id: ChainType;
  name: string;
  symbol: string;
  decimals: number;
  explorer: string;
  color: string;
}

const CHAIN_METADATA: Record<ChainType, ChainMeta> = {
  evm: {
    id: 'evm',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://etherscan.io',
    color: '#627eea',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    explorer: 'https://solscan.io',
    color: '#9945ff',
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    explorer: 'https://mempool.space',
    color: '#f7931a',
  },
  sui: {
    id: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    decimals: 9,
    explorer: 'https://suiscan.xyz',
    color: '#4da2ff',
  },
  near: {
    id: 'near',
    name: 'NEAR',
    symbol: 'NEAR',
    decimals: 24,
    explorer: 'https://nearblocks.io',
    color: '#00ec97',
  },
  aptos: {
    id: 'aptos',
    name: 'Aptos',
    symbol: 'APT',
    decimals: 8,
    explorer: 'https://aptoscan.com',
    color: '#2dd8a7',
  },
  starknet: {
    id: 'starknet',
    name: 'Starknet',
    symbol: 'STRK',
    decimals: 18,
    explorer: 'https://starkscan.co',
    color: '#29296e',
  },
  ton: {
    id: 'ton',
    name: 'TON',
    symbol: 'TON',
    decimals: 9,
    explorer: 'https://tonscan.org',
    color: '#0098ea',
  },
  tron: {
    id: 'tron',
    name: 'Tron',
    symbol: 'TRX',
    decimals: 6,
    explorer: 'https://tronscan.org',
    color: '#eb0029',
  },
};

/**
 * Get metadata for a chain type.
 */
export function getChainMeta(chain: ChainType): ChainMeta | null {
  return CHAIN_METADATA[chain] ?? null;
}

/**
 * Get all chain metadata.
 */
export function getAllChainMeta(): ChainMeta[] {
  return Object.values(CHAIN_METADATA);
}

/**
 * Get explorer URL for a transaction on a given chain.
 */
export function getExplorerTxUrl(chain: ChainType, txHash: string): string {
  const meta = CHAIN_METADATA[chain];
  if (!meta) return '';

  switch (chain) {
    case 'evm':
      return `${meta.explorer}/tx/${txHash}`;
    case 'solana':
      return `${meta.explorer}/tx/${txHash}`;
    case 'bitcoin':
      return `${meta.explorer}/tx/${txHash}`;
    case 'sui':
      return `${meta.explorer}/txblock/${txHash}`;
    case 'near':
      return `${meta.explorer}/txns/${txHash}`;
    case 'aptos':
      return `${meta.explorer}/transaction/${txHash}`;
    case 'starknet':
      return `${meta.explorer}/tx/${txHash}`;
    case 'ton':
      return `${meta.explorer}/transaction/${txHash}`;
    case 'tron':
      return `${meta.explorer}/#/transaction/${txHash}`;
    default:
      return '';
  }
}

/**
 * Get explorer URL for an address on a given chain.
 */
export function getExplorerAddressUrl(chain: ChainType, address: string): string {
  const meta = CHAIN_METADATA[chain];
  if (!meta) return '';

  switch (chain) {
    case 'evm':
      return `${meta.explorer}/address/${address}`;
    case 'solana':
      return `${meta.explorer}/account/${address}`;
    case 'bitcoin':
      return `${meta.explorer}/address/${address}`;
    case 'sui':
      return `${meta.explorer}/account/${address}`;
    case 'near':
      return `${meta.explorer}/address/${address}`;
    case 'aptos':
      return `${meta.explorer}/account/${address}`;
    case 'starknet':
      return `${meta.explorer}/contract/${address}`;
    case 'ton':
      return `${meta.explorer}/address/${address}`;
    case 'tron':
      return `${meta.explorer}/#/address/${address}`;
    default:
      return '';
  }
}
