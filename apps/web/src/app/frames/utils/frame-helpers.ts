/**
 * Farcaster Frames — shared utilities
 * Token addresses, chain IDs, ERC20 encoding, amount parsing
 */

const BASE_URL = 'https://goblink.io';

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || BASE_URL;
}

// ─── Well-known ERC20 token addresses per chain ───────────────────────────────

export const TOKEN_ADDRESSES: Record<string, Record<string, { address: string; decimals: number }>> = {
  base: {
    USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    USDT: { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6 },
    DAI:  { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18 },
  },
  ethereum: {
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    DAI:  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  },
  arbitrum: {
    USDC: { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    USDT: { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
    DAI:  { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
  },
  optimism: {
    USDC: { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    USDT: { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
    DAI:  { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 },
  },
  polygon: {
    USDC: { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
    USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    DAI:  { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
  },
  bsc: {
    USDC: { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
    USDT: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    DAI:  { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18 },
  },
};

// ─── Native tokens per chain (for ETH/BNB transfers) ─────────────────────────

export const NATIVE_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  ethereum:  { symbol: 'ETH',  decimals: 18 },
  base:      { symbol: 'ETH',  decimals: 18 },
  arbitrum:  { symbol: 'ETH',  decimals: 18 },
  optimism:  { symbol: 'ETH',  decimals: 18 },
  polygon:   { symbol: 'POL',  decimals: 18 },
  bsc:       { symbol: 'BNB',  decimals: 18 },
  avalanche: { symbol: 'AVAX', decimals: 18 },
};

// ─── Chain ID mapping ─────────────────────────────────────────────────────────

export const CHAIN_IDS: Record<string, number> = {
  ethereum:  1,
  base:      8453,
  arbitrum:  42161,
  polygon:   137,
  optimism:  10,
  bsc:       56,
  avalanche: 43114,
  gnosis:    100,
  berachain: 80094,
  monad:     143,
};

export const CHAIN_DISPLAY_NAMES: Record<string, string> = {
  ethereum:  'Ethereum',
  base:      'Base',
  arbitrum:  'Arbitrum',
  polygon:   'Polygon',
  optimism:  'Optimism',
  bsc:       'BNB Chain',
  avalanche: 'Avalanche',
  gnosis:    'Gnosis',
  berachain: 'Berachain',
  monad:     'Monad',
  solana:    'Solana',
  near:      'NEAR',
  sui:       'Sui',
  aptos:     'Aptos',
  tron:      'Tron',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}\u2026${addr.slice(-4)}`;
}

export function getChainId(chain: string): number | null {
  return CHAIN_IDS[chain.toLowerCase()] ?? null;
}

export function getChainDisplayName(chain: string): string {
  return CHAIN_DISPLAY_NAMES[chain.toLowerCase()] || chain;
}

export function getTokenInfo(chain: string, token: string) {
  const chainTokens = TOKEN_ADDRESSES[chain.toLowerCase()];
  if (!chainTokens) return null;
  return chainTokens[token.toUpperCase()] ?? null;
}

export function isNativeToken(chain: string, token: string): boolean {
  const native = NATIVE_TOKENS[chain.toLowerCase()];
  return !!native && native.symbol.toUpperCase() === token.toUpperCase();
}

export function getNativeToken(chain: string) {
  return NATIVE_TOKENS[chain.toLowerCase()] ?? null;
}

// ─── ERC20 encoding ───────────────────────────────────────────────────────────

/** Encode ERC20 transfer(address,uint256) calldata */
export function encodeErc20Transfer(to: string, amount: bigint): string {
  const selector = 'a9059cbb';
  const paddedTo = to.toLowerCase().replace('0x', '').padStart(64, '0');
  const paddedAmount = amount.toString(16).padStart(64, '0');
  return `0x${selector}${paddedTo}${paddedAmount}`;
}

/** Parse a human-readable amount (e.g. "50.5") to atomic units */
export function parseAmount(amount: string, decimals: number): bigint {
  const parts = amount.split('.');
  const whole = parts[0] || '0';
  const fraction = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(fraction);
}

/** ERC20 transfer ABI fragment for Farcaster tx response */
export const ERC20_TRANSFER_ABI = [
  {
    type: 'function' as const,
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable' as const,
  },
];
