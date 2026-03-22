import type { ChainType } from '../core/types';

export interface ChainMeta {
  id: ChainType;
  name: string;
  symbol: string;
  decimals: number;
  explorer: string;
  color: string;
}

const CHAIN_METADATA: Partial<Record<ChainType, ChainMeta>> = {
  EVM: {
    id: 'EVM',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://etherscan.io',
    color: '#627eea',
  },
  SOLANA: {
    id: 'SOLANA',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    explorer: 'https://solscan.io',
    color: '#9945ff',
  },
  BITCOIN: {
    id: 'BITCOIN',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    explorer: 'https://mempool.space',
    color: '#f7931a',
  },
  SUI: {
    id: 'SUI',
    name: 'Sui',
    symbol: 'SUI',
    decimals: 9,
    explorer: 'https://suiscan.xyz',
    color: '#4da2ff',
  },
  NEAR: {
    id: 'NEAR',
    name: 'NEAR',
    symbol: 'NEAR',
    decimals: 24,
    explorer: 'https://nearblocks.io',
    color: '#00ec97',
  },
  APTOS: {
    id: 'APTOS',
    name: 'Aptos',
    symbol: 'APT',
    decimals: 8,
    explorer: 'https://aptoscan.com',
    color: '#2dd8a7',
  },
  STARKNET: {
    id: 'STARKNET',
    name: 'Starknet',
    symbol: 'STRK',
    decimals: 18,
    explorer: 'https://starkscan.co',
    color: '#29296e',
  },
  TON: {
    id: 'TON',
    name: 'TON',
    symbol: 'TON',
    decimals: 9,
    explorer: 'https://tonscan.org',
    color: '#0098ea',
  },
  TRON: {
    id: 'TRON',
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
  return Object.values(CHAIN_METADATA).filter((v): v is ChainMeta => !!v);
}

/**
 * Get explorer URL for a transaction on a given chain.
 */
export function getExplorerTxUrl(chain: ChainType, txHash: string): string {
  const meta = CHAIN_METADATA[chain];
  if (!meta) return '';

  switch (chain) {
    case 'EVM':
      return `${meta.explorer}/tx/${txHash}`;
    case 'SOLANA':
      return `${meta.explorer}/tx/${txHash}`;
    case 'BITCOIN':
      return `${meta.explorer}/tx/${txHash}`;
    case 'SUI':
      return `${meta.explorer}/txblock/${txHash}`;
    case 'NEAR':
      return `${meta.explorer}/txns/${txHash}`;
    case 'APTOS':
      return `${meta.explorer}/transaction/${txHash}`;
    case 'STARKNET':
      return `${meta.explorer}/tx/${txHash}`;
    case 'TON':
      return `${meta.explorer}/transaction/${txHash}`;
    case 'TRON':
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
    case 'EVM':
      return `${meta.explorer}/address/${address}`;
    case 'SOLANA':
      return `${meta.explorer}/account/${address}`;
    case 'BITCOIN':
      return `${meta.explorer}/address/${address}`;
    case 'SUI':
      return `${meta.explorer}/account/${address}`;
    case 'NEAR':
      return `${meta.explorer}/address/${address}`;
    case 'APTOS':
      return `${meta.explorer}/account/${address}`;
    case 'STARKNET':
      return `${meta.explorer}/contract/${address}`;
    case 'TON':
      return `${meta.explorer}/address/${address}`;
    case 'TRON':
      return `${meta.explorer}/#/address/${address}`;
    default:
      return '';
  }
}
