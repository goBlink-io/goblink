import { createPublicClient, http, formatUnits, type PublicClient, type Address, type Chain } from 'viem';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  bsc,
} from 'viem/chains';

/**
 * EVM Balance Service
 * Fetches native and ERC-20 token balances across EVM chains
 */

// ERC-20 ABI for balanceOf and decimals
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

// Custom chain definitions for chains not yet in viem
const berachain: Chain = {
  id: 80094,
  name: 'Berachain',
  nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.berachain.com'] },
  },
  blockExplorers: {
    default: { name: 'Berascan', url: 'https://berascan.com' },
  },
};

const monad: Chain = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
};

// Chain configurations with RPC URLs
const CHAIN_CONFIGS: Record<string, { chain: Chain; rpcUrl: string }> = {
  ethereum: {
    chain: mainnet,
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  },
  base: {
    chain: base,
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  },
  arbitrum: {
    chain: arbitrum,
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  },
  bsc: {
    chain: bsc,
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
  },
  polygon: {
    chain: polygon,
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  },
  optimism: {
    chain: optimism,
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  },
  berachain: {
    chain: berachain,
    rpcUrl: process.env.BERACHAIN_RPC_URL || 'https://rpc.berachain.com',
  },
  monad: {
    chain: monad,
    rpcUrl: process.env.MONAD_RPC_URL || 'https://rpc.monad.xyz',
  },
};

export type SupportedChain = keyof typeof CHAIN_CONFIGS;

// Cache for public clients
const clientCache: Map<string, PublicClient> = new Map();

/**
 * Get list of supported EVM chains
 */
export function getSupportedChains(): string[] {
  return Object.keys(CHAIN_CONFIGS);
}

/**
 * Get or create a public client for a specific chain
 */
function getPublicClient(chainName: SupportedChain): PublicClient {
  if (clientCache.has(chainName)) {
    return clientCache.get(chainName)!;
  }

  const config = CHAIN_CONFIGS[chainName];
  if (!config) {
    throw new Error(`Unsupported chain: ${chainName}`);
  }

  const client = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });

  clientCache.set(chainName, client as PublicClient);
  return client as PublicClient;
}

/**
 * Get native token balance (ETH, BNB, BERA, MON, etc.)
 */
export async function getNativeBalance(
  chainName: SupportedChain,
  address: string
): Promise<{
  balance: string;
  balanceWei: string;
  address: string;
  chain: string;
}> {
  try {
    const client = getPublicClient(chainName);
    const balanceWei = await client.getBalance({ address: address as Address });
    const balance = formatUnits(balanceWei, 18); // Native tokens are 18 decimals

    console.log(`[EVM-${chainName.toUpperCase()}] Native balance:`, {
      address,
      balanceWei: balanceWei.toString(),
      balance,
    });

    return {
      balance: parseFloat(balance).toFixed(4),
      balanceWei: balanceWei.toString(),
      address,
      chain: chainName,
    };
  } catch (error: any) {
    console.error(`[EVM-${chainName.toUpperCase()}] Error fetching native balance:`, error.message);
    throw error;
  }
}

/**
 * Get ERC-20 token balance
 */
export async function getTokenBalance(
  chainName: SupportedChain,
  address: string,
  tokenAddress: string,
  decimals?: number
): Promise<{
  balance: string;
  balanceRaw: string;
  address: string;
  tokenAddress: string;
  chain: string;
  decimals: number;
}> {
  try {
    const client = getPublicClient(chainName);

    // Fetch balance
    const balanceRaw = await client.readContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as Address],
    });

    // Fetch decimals if not provided
    let tokenDecimals = decimals;
    if (tokenDecimals === undefined || tokenDecimals === null) {
      tokenDecimals = await client.readContract({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }) as number;
    }

    const balance = formatUnits(balanceRaw as bigint, tokenDecimals);

    console.log(`[EVM-${chainName.toUpperCase()}] Token balance:`, {
      address,
      tokenAddress,
      balanceRaw: (balanceRaw as bigint).toString(),
      balance,
      decimals: tokenDecimals,
    });

    return {
      balance: parseFloat(balance).toFixed(4),
      balanceRaw: (balanceRaw as bigint).toString(),
      address,
      tokenAddress,
      chain: chainName,
      decimals: tokenDecimals,
    };
  } catch (error: any) {
    console.error(`[EVM-${chainName.toUpperCase()}] Error fetching token balance:`, error.message);
    throw error;
  }
}

/**
 * Get multiple token balances at once
 */
export async function getMultipleBalances(
  chainName: SupportedChain,
  address: string,
  tokenAddresses: string[]
): Promise<Array<{
  tokenAddress: string;
  balance: string;
  balanceRaw: string;
  decimals: number;
}>> {
  const results = await Promise.allSettled(
    tokenAddresses.map((tokenAddress) =>
      getTokenBalance(chainName, address, tokenAddress)
    )
  );

  return results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => {
      const data = (result as PromiseFulfilledResult<any>).value;
      return {
        tokenAddress: data.tokenAddress,
        balance: data.balance,
        balanceRaw: data.balanceRaw,
        decimals: data.decimals,
      };
    });
}

export default {
  getNativeBalance,
  getTokenBalance,
  getMultipleBalances,
  getSupportedChains,
  CHAIN_CONFIGS,
};
