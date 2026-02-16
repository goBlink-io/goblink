/**
 * DexScreener API Service
 * Provides token icons, prices, and market data from DexScreener
 * API Documentation: https://docs.dexscreener.com/api/reference
 */

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: { label: string; url: string }[];
    socials?: { type: string; url: string }[];
  };
}

interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: { type: string; label: string; url: string }[];
}

interface TokenProfilesResponse {
  [tokenAddress: string]: TokenProfile;
}

// Map our chain IDs to DexScreener chain IDs
const CHAIN_ID_MAPPING: Record<string, string> = {
  'ethereum': 'ethereum',
  'bsc': 'bsc',
  'polygon': 'polygon',
  'arbitrum': 'arbitrum',
  'optimism': 'optimism',
  'base': 'base',
  'avalanche': 'avalanche',
  'solana': 'solana',
  'sui': 'sui',
  // Note: DexScreener may not support all chains yet
  'berachain': 'berachain',
  'monad': 'monad',
};

// Cache for token data (in-memory, could be moved to Redis)
const tokenDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch token pairs from DexScreener by token address
 */
export async function getTokenPairs(
  chainId: string,
  tokenAddress: string
): Promise<DexScreenerPair[]> {
  const cacheKey = `pairs:${chainId}:${tokenAddress}`;
  const cached = tokenDataCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const dexChainId = CHAIN_ID_MAPPING[chainId] || chainId;
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json() as DexScreenerResponse;
    
    // Filter pairs for the specific chain
    const pairs = (data.pairs || []).filter(pair => 
      pair.chainId.toLowerCase() === dexChainId.toLowerCase()
    );

    // Cache the result
    tokenDataCache.set(cacheKey, { data: pairs, timestamp: Date.now() });

    return pairs;
  } catch (error) {
    console.error('Failed to fetch token pairs from DexScreener:', error);
    return [];
  }
}

/**
 * Get the best price for a token (highest liquidity pair with USD quote)
 */
export async function getTokenPrice(
  chainId: string,
  tokenAddress: string
): Promise<{ priceUsd: string; priceChange24h: number } | null> {
  try {
    const pairs = await getTokenPairs(chainId, tokenAddress);
    
    if (pairs.length === 0) {
      return null;
    }

    // Find the pair with highest liquidity and USD price
    const bestPair = pairs
      .filter(pair => pair.priceUsd && pair.liquidity?.usd)
      .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

    if (!bestPair || !bestPair.priceUsd) {
      return null;
    }

    return {
      priceUsd: bestPair.priceUsd,
      priceChange24h: bestPair.priceChange.h24,
    };
  } catch (error) {
    console.error('Failed to get token price:', error);
    return null;
  }
}

/**
 * Get token icon/logo from DexScreener
 */
export async function getTokenIcon(
  chainId: string,
  tokenAddress: string
): Promise<string | null> {
  try {
    const pairs = await getTokenPairs(chainId, tokenAddress);
    
    if (pairs.length === 0) {
      return null;
    }

    // Find the best pair with an icon
    for (const pair of pairs) {
      if (pair.info?.imageUrl) {
        return pair.info.imageUrl;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get token icon:', error);
    return null;
  }
}

/**
 * Get token profile from DexScreener (includes icon, description, etc.)
 */
export async function getTokenProfile(
  chainId: string,
  tokenAddress: string
): Promise<TokenProfile | null> {
  const cacheKey = `profile:${chainId}:${tokenAddress}`;
  const cached = tokenDataCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const dexChainId = CHAIN_ID_MAPPING[chainId] || chainId;
    const response = await fetch(
      `https://api.dexscreener.com/token-profiles/latest/v1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as TokenProfilesResponse;
    const profileKey = `${dexChainId}:${tokenAddress.toLowerCase()}`;
    const profile = data[profileKey] || null;

    // Cache the result
    tokenDataCache.set(cacheKey, { data: profile, timestamp: Date.now() });

    return profile;
  } catch (error) {
    console.error('Failed to get token profile:', error);
    return null;
  }
}

/**
 * Enrich token data with DexScreener information
 */
export async function enrichTokenData(
  chainId: string,
  tokenAddress: string,
  symbol: string
): Promise<{
  icon?: string;
  priceUsd?: string;
  priceChange24h?: number;
}> {
  // Skip enrichment for native tokens or invalid addresses
  if (!tokenAddress || tokenAddress === 'native' || tokenAddress.length < 10) {
    return {};
  }

  try {
    // Fetch pairs and profile in parallel
    const [pairs, profile] = await Promise.all([
      getTokenPairs(chainId, tokenAddress),
      getTokenProfile(chainId, tokenAddress),
    ]);

    const result: any = {};

    // Get icon from profile or best pair
    if (profile?.icon) {
      result.icon = profile.icon;
    } else if (pairs.length > 0) {
      for (const pair of pairs) {
        if (pair.info?.imageUrl) {
          result.icon = pair.info.imageUrl;
          break;
        }
      }
    }

    // Get price from best liquidity pair
    if (pairs.length > 0) {
      const bestPair = pairs
        .filter(pair => pair.priceUsd && pair.liquidity?.usd)
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

      if (bestPair?.priceUsd) {
        result.priceUsd = bestPair.priceUsd;
        result.priceChange24h = bestPair.priceChange.h24;
      }
    }

    return result;
  } catch (error) {
    console.error(`Failed to enrich token data for ${chainId}:${tokenAddress}:`, error);
    return {};
  }
}

/**
 * Batch enrich multiple tokens
 */
export async function enrichMultipleTokens(
  tokens: Array<{ chainId: string; tokenAddress: string; symbol: string }>
): Promise<Map<string, { icon?: string; priceUsd?: string; priceChange24h?: number }>> {
  const results = new Map();

  // Process tokens with rate limiting (max 2 requests per second)
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const key = `${token.chainId}:${token.tokenAddress}`;
    
    try {
      const enriched = await enrichTokenData(token.chainId, token.tokenAddress, token.symbol);
      results.set(key, enriched);
      
      // Rate limit: wait 500ms between requests
      if (i < tokens.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Failed to enrich token ${key}:`, error);
      results.set(key, {});
    }
  }

  return results;
}
