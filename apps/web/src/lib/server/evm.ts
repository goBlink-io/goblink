import { createPublicClient, http, formatUnits, type PublicClient, type Address, type Chain } from 'viem';
import { mainnet, polygon, optimism, arbitrum, base, bsc } from 'viem/chains';

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
] as const;

const berachain: Chain = {
  id: 80094, name: 'Berachain',
  nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.berachain.com'] } },
};

const monad: Chain = {
  id: 143, name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.monad.xyz'] } },
};

const CHAIN_CONFIGS: Record<string, { chain: Chain; rpcUrl: string }> = {
  ethereum: { chain: mainnet, rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com' },
  base: { chain: base, rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org' },
  arbitrum: { chain: arbitrum, rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc' },
  bsc: { chain: bsc, rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org' },
  polygon: { chain: polygon, rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com' },
  optimism: { chain: optimism, rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io' },
  berachain: { chain: berachain, rpcUrl: process.env.BERACHAIN_RPC_URL || 'https://rpc.berachain.com' },
  monad: { chain: monad, rpcUrl: process.env.MONAD_RPC_URL || 'https://rpc.monad.xyz' },
};

export type SupportedChain = keyof typeof CHAIN_CONFIGS;

const clientCache: Map<string, PublicClient> = new Map();

export function getSupportedChains(): string[] {
  return Object.keys(CHAIN_CONFIGS);
}

function getPublicClient(chainName: SupportedChain): PublicClient {
  if (clientCache.has(chainName)) return clientCache.get(chainName)!;
  const config = CHAIN_CONFIGS[chainName];
  if (!config) throw new Error(`Unsupported chain: ${chainName}`);
  const client = createPublicClient({ chain: config.chain, transport: http(config.rpcUrl) });
  clientCache.set(chainName, client as PublicClient);
  return client as PublicClient;
}

export async function getNativeBalance(chainName: SupportedChain, address: string) {
  const client = getPublicClient(chainName);
  const balanceWei = await client.getBalance({ address: address as Address });
  const balance = formatUnits(balanceWei, 18);
  return {
    balance: parseFloat(balance).toFixed(4),
    balanceWei: balanceWei.toString(),
    address,
    chain: chainName,
  };
}

export async function getTokenBalance(
  chainName: SupportedChain, address: string, tokenAddress: string, decimals?: number
) {
  const client = getPublicClient(chainName);
  const balanceRaw = await client.readContract({
    address: tokenAddress as Address, abi: ERC20_ABI, functionName: 'balanceOf',
    args: [address as Address],
  });
  let tokenDecimals = decimals;
  if (tokenDecimals === undefined || tokenDecimals === null) {
    tokenDecimals = await client.readContract({
      address: tokenAddress as Address, abi: ERC20_ABI, functionName: 'decimals',
    }) as number;
  }
  const balance = formatUnits(balanceRaw as bigint, tokenDecimals);
  return {
    balance: parseFloat(balance).toFixed(4),
    balanceRaw: (balanceRaw as bigint).toString(),
    address, tokenAddress, chain: chainName, decimals: tokenDecimals,
  };
}
