export interface ChainConfig {
  id: number;
  name: string;
  displayName: string;
  nativeToken: {
    symbol: string;
    name: string;
    decimals: number;
  };
  explorer: string;
  rpcUrls: string[];
  testnet?: boolean;
}

export const EVM_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: 1,
    name: 'ethereum',
    displayName: 'Ethereum',
    nativeToken: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    explorer: 'https://etherscan.io',
    rpcUrls: ['https://eth.llamarpc.com'],
  },
  base: {
    id: 8453,
    name: 'base',
    displayName: 'Base',
    nativeToken: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    explorer: 'https://basescan.org',
    rpcUrls: ['https://mainnet.base.org'],
  },
  arbitrum: {
    id: 42161,
    name: 'arbitrum',
    displayName: 'Arbitrum One',
    nativeToken: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    explorer: 'https://arbiscan.io',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  },
  bsc: {
    id: 56,
    name: 'bsc',
    displayName: 'BNB Chain',
    nativeToken: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    explorer: 'https://bscscan.com',
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
  },
  berachain: {
    id: 80094,
    name: 'berachain',
    displayName: 'Berachain',
    nativeToken: { symbol: 'BERA', name: 'BERA', decimals: 18 },
    explorer: 'https://berascan.com',
    rpcUrls: ['https://rpc.berachain.com'],
  },
  monad: {
    id: 143,
    name: 'monad',
    displayName: 'Monad',
    nativeToken: { symbol: 'MON', name: 'MON', decimals: 18 },
    explorer: 'https://explorer.monad.xyz',
    rpcUrls: ['https://rpc.monad.xyz'],
  },
  polygon: {
    id: 137,
    name: 'polygon',
    displayName: 'Polygon',
    nativeToken: { symbol: 'MATIC', name: 'Matic', decimals: 18 },
    explorer: 'https://polygonscan.com',
    rpcUrls: ['https://polygon-rpc.com'],
  },
  optimism: {
    id: 10,
    name: 'optimism',
    displayName: 'Optimism',
    nativeToken: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    explorer: 'https://optimistic.etherscan.io',
    rpcUrls: ['https://mainnet.optimism.io'],
  },
};

/**
 * List of all supported EVM chain names
 */
export const EVM_CHAIN_NAMES = Object.keys(EVM_CHAINS);

/**
 * Native token symbols that indicate native (non-ERC20) tokens
 */
export const NATIVE_TOKEN_SYMBOLS = ['ETH', 'BNB', 'MATIC', 'BERA', 'MON'];

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerTxUrl(chain: string, txHash: string): string {
  const config = EVM_CHAINS[chain.toLowerCase()];
  if (config) {
    return `${config.explorer}/tx/${txHash}`;
  }
  return `https://etherscan.io/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getExplorerAddressUrl(chain: string, address: string): string {
  const config = EVM_CHAINS[chain.toLowerCase()];
  if (config) {
    return `${config.explorer}/address/${address}`;
  }
  return `https://etherscan.io/address/${address}`;
}

/**
 * Check if a blockchain name is an EVM chain
 */
export function isEvmChain(blockchain: string): boolean {
  return EVM_CHAIN_NAMES.includes(blockchain.toLowerCase());
}

/**
 * Check if a token symbol is a native EVM token
 */
export function isNativeToken(symbol: string): boolean {
  return NATIVE_TOKEN_SYMBOLS.includes(symbol);
}
