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

// ─── EVM Chains ───────────────────────────────────────────────────────────────

export const EVM_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: 1, name: 'ethereum', displayName: 'Ethereum',
    nativeToken: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    explorer: 'https://etherscan.io', rpcUrls: ['https://eth.llamarpc.com'],
  },
  base: {
    id: 8453, name: 'base', displayName: 'Base',
    nativeToken: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    explorer: 'https://basescan.org', rpcUrls: ['https://mainnet.base.org'],
  },
  arbitrum: {
    id: 42161, name: 'arbitrum', displayName: 'Arbitrum One',
    nativeToken: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    explorer: 'https://arbiscan.io', rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  },
  bsc: {
    id: 56, name: 'bsc', displayName: 'BNB Chain',
    nativeToken: { symbol: 'BNB', name: 'BNB', decimals: 18 },
    explorer: 'https://bscscan.com', rpcUrls: ['https://bsc-dataseed1.binance.org'],
  },
  polygon: {
    id: 137, name: 'polygon', displayName: 'Polygon',
    nativeToken: { symbol: 'POL', name: 'POL', decimals: 18 },
    explorer: 'https://polygonscan.com', rpcUrls: ['https://polygon-rpc.com'],
  },
  optimism: {
    id: 10, name: 'optimism', displayName: 'Optimism',
    nativeToken: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    explorer: 'https://optimistic.etherscan.io', rpcUrls: ['https://mainnet.optimism.io'],
  },
  avalanche: {
    id: 43114, name: 'avax', displayName: 'Avalanche',
    nativeToken: { symbol: 'AVAX', name: 'AVAX', decimals: 18 },
    explorer: 'https://snowtrace.io', rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  },
  gnosis: {
    id: 100, name: 'gnosis', displayName: 'Gnosis',
    nativeToken: { symbol: 'xDAI', name: 'xDAI', decimals: 18 },
    explorer: 'https://gnosisscan.io', rpcUrls: ['https://rpc.gnosischain.com'],
  },
  berachain: {
    id: 80094, name: 'berachain', displayName: 'Berachain',
    nativeToken: { symbol: 'BERA', name: 'BERA', decimals: 18 },
    explorer: 'https://berascan.com', rpcUrls: ['https://rpc.berachain.com'],
  },
  monad: {
    id: 143, name: 'monad', displayName: 'Monad',
    nativeToken: { symbol: 'MON', name: 'MON', decimals: 18 },
    explorer: 'https://explorer.monad.xyz', rpcUrls: ['https://rpc.monad.xyz'],
  },
  aurora: {
    id: 1313161554, name: 'aurora', displayName: 'Aurora',
    nativeToken: { symbol: 'ETH', name: 'Ether', decimals: 18 },
    explorer: 'https://explorer.aurora.dev', rpcUrls: ['https://mainnet.aurora.dev'],
  },
  plasma: {
    id: 9745, name: 'plasma', displayName: 'Plasma',
    nativeToken: { symbol: 'XPL', name: 'XPL', decimals: 18 },
    explorer: 'https://explorer.plasma.cash', rpcUrls: ['https://rpc.plasma.cash'],
  },
  xlayer: {
    id: 196, name: 'xlayer', displayName: 'X Layer',
    nativeToken: { symbol: 'OKB', name: 'OKB', decimals: 18 },
    explorer: 'https://www.oklink.com/xlayer', rpcUrls: ['https://rpc.xlayer.tech'],
  },
  adi: {
    id: 36900, name: 'adi', displayName: 'ADI Chain',
    nativeToken: { symbol: 'ADI', name: 'ADI', decimals: 18 },
    explorer: 'https://explorer.adichain.io', rpcUrls: ['https://rpc.adichain.io'],
  },
};

// ─── Non-EVM Chains (destination-only for now, manual address input) ──────────

export interface NonEvmChainConfig {
  name: string;
  displayName: string;
  nativeToken: { symbol: string; name: string; decimals: number };
  explorer: string;
  addressPattern?: RegExp;
  addressPlaceholder: string;
}

export const NON_EVM_CHAINS: Record<string, NonEvmChainConfig> = {
  near: {
    name: 'near', displayName: 'NEAR',
    nativeToken: { symbol: 'NEAR', name: 'NEAR', decimals: 24 },
    explorer: 'https://nearblocks.io',
    addressPlaceholder: 'alice.near or 64-char hex',
  },
  solana: {
    name: 'solana', displayName: 'Solana',
    nativeToken: { symbol: 'SOL', name: 'SOL', decimals: 9 },
    explorer: 'https://solscan.io',
    addressPlaceholder: 'Base58 public key (e.g. BYPsjxa3...)',
  },
  sui: {
    name: 'sui', displayName: 'Sui',
    nativeToken: { symbol: 'SUI', name: 'SUI', decimals: 9 },
    explorer: 'https://suiscan.xyz',
    addressPlaceholder: '0x... (66-char hex)',
  },
  bitcoin: {
    name: 'bitcoin', displayName: 'Bitcoin',
    nativeToken: { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
    explorer: 'https://mempool.space',
    addressPlaceholder: 'bc1q... or 1... or 3...',
  },
  litecoin: {
    name: 'litecoin', displayName: 'Litecoin',
    nativeToken: { symbol: 'LTC', name: 'Litecoin', decimals: 8 },
    explorer: 'https://litecoinspace.org',
    addressPlaceholder: 'L... or M... or ltc1...',
  },
  dogecoin: {
    name: 'dogecoin', displayName: 'Dogecoin',
    nativeToken: { symbol: 'DOGE', name: 'Dogecoin', decimals: 8 },
    explorer: 'https://dogechain.info',
    addressPlaceholder: 'D... address',
  },
  bitcoincash: {
    name: 'bitcoincash', displayName: 'Bitcoin Cash',
    nativeToken: { symbol: 'BCH', name: 'Bitcoin Cash', decimals: 8 },
    explorer: 'https://blockchair.com/bitcoin-cash',
    addressPlaceholder: 'bitcoincash:q... or 1...',
  },
  tron: {
    name: 'tron', displayName: 'Tron',
    nativeToken: { symbol: 'TRX', name: 'Tron', decimals: 6 },
    explorer: 'https://tronscan.org',
    addressPlaceholder: 'T... address',
  },
  ton: {
    name: 'ton', displayName: 'TON',
    nativeToken: { symbol: 'TON', name: 'Toncoin', decimals: 9 },
    explorer: 'https://tonviewer.com',
    addressPlaceholder: 'EQ... or UQ... address',
  },
  stellar: {
    name: 'stellar', displayName: 'Stellar',
    nativeToken: { symbol: 'XLM', name: 'Stellar Lumens', decimals: 7 },
    explorer: 'https://stellarchain.io',
    addressPlaceholder: 'G... (56-char base32)',
  },
  xrp: {
    name: 'xrp', displayName: 'XRP Ledger',
    nativeToken: { symbol: 'XRP', name: 'XRP', decimals: 6 },
    explorer: 'https://xrpscan.com',
    addressPlaceholder: 'r... or X... address',
  },
  starknet: {
    name: 'starknet', displayName: 'Starknet',
    nativeToken: { symbol: 'STRK', name: 'Starknet', decimals: 18 },
    explorer: 'https://starkscan.co',
    addressPlaceholder: '0x... (hex address)',
  },
  cardano: {
    name: 'cardano', displayName: 'Cardano',
    nativeToken: { symbol: 'ADA', name: 'Cardano', decimals: 6 },
    explorer: 'https://cardanoscan.io',
    addressPlaceholder: 'addr1...',
  },
  aptos: {
    name: 'aptos', displayName: 'Aptos',
    nativeToken: { symbol: 'APT', name: 'Aptos', decimals: 8 },
    explorer: 'https://aptoscan.com',
    addressPlaceholder: '0x... address',
  },
  aleo: {
    name: 'aleo', displayName: 'Aleo',
    nativeToken: { symbol: 'ALEO', name: 'Aleo', decimals: 6 },
    explorer: 'https://explorer.aleo.org',
    addressPlaceholder: 'aleo1... address',
  },
};

/**
 * All supported chains (EVM + non-EVM) — unified list for chain selectors
 */
export const ALL_CHAINS = {
  ...Object.fromEntries(
    Object.entries(EVM_CHAINS).map(([k, v]) => [k, { ...v, type: 'evm' as const }])
  ),
  ...Object.fromEntries(
    Object.entries(NON_EVM_CHAINS).map(([k, v]) => [k, { ...v, type: 'non-evm' as const }])
  ),
};

export const EVM_CHAIN_NAMES = Object.keys(EVM_CHAINS);
export const NON_EVM_CHAIN_NAMES = Object.keys(NON_EVM_CHAINS);
export const ALL_CHAIN_NAMES = [...EVM_CHAIN_NAMES, ...NON_EVM_CHAIN_NAMES];

export const NATIVE_TOKEN_SYMBOLS = ['ETH', 'BNB', 'POL', 'BERA', 'MON', 'AVAX', 'xDAI', 'OKB', 'XPL', 'ADI'];

export function getExplorerTxUrl(chain: string, txHash: string): string {
  const evmConfig = EVM_CHAINS[chain.toLowerCase()];
  if (evmConfig) return `${evmConfig.explorer}/tx/${txHash}`;
  const nonEvmConfig = NON_EVM_CHAINS[chain.toLowerCase()];
  if (nonEvmConfig) return `${nonEvmConfig.explorer}/tx/${txHash}`;
  return `https://etherscan.io/tx/${txHash}`;
}

export function getExplorerAddressUrl(chain: string, address: string): string {
  const evmConfig = EVM_CHAINS[chain.toLowerCase()];
  if (evmConfig) return `${evmConfig.explorer}/address/${address}`;
  const nonEvmConfig = NON_EVM_CHAINS[chain.toLowerCase()];
  if (nonEvmConfig) return `${nonEvmConfig.explorer}/address/${address}`;
  return `https://etherscan.io/address/${address}`;
}

export function isEvmChain(blockchain: string): boolean {
  return EVM_CHAIN_NAMES.includes(blockchain.toLowerCase());
}

export function isNativeToken(symbol: string): boolean {
  return NATIVE_TOKEN_SYMBOLS.includes(symbol);
}
