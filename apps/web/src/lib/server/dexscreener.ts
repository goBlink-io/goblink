const CHAIN_ID_MAPPING: Record<string, string> = {
  'ethereum': 'ethereum', 'bsc': 'bsc', 'polygon': 'polygon',
  'arbitrum': 'arbitrum', 'optimism': 'optimism', 'base': 'base',
  'avalanche': 'avalanche', 'solana': 'solana', 'sui': 'sui',
  'berachain': 'berachain', 'monad': 'monad',
};

const MAX_CACHE_SIZE = 500;
const tokenDataCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

interface DexScreenerPair {
  chainId: string;
  priceUsd?: string;
  priceChange: { h24: number };
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
}

export async function getTokenPairs(chainId: string, tokenAddress: string): Promise<DexScreenerPair[]> {
  const cacheKey = `pairs:${chainId}:${tokenAddress}`;
  const cached = tokenDataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data as DexScreenerPair[];

  try {
    const dexChainId = CHAIN_ID_MAPPING[chainId] || chainId;
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    if (!response.ok) return [];
    const data = await response.json();
    const pairs = (data.pairs || []).filter((pair: DexScreenerPair) =>
      pair.chainId.toLowerCase() === dexChainId.toLowerCase()
    );
    // Evict stale entries when cache grows too large
    if (tokenDataCache.size >= MAX_CACHE_SIZE) {
      const now = Date.now();
      for (const [key, val] of tokenDataCache) {
        if (now - val.timestamp >= CACHE_TTL) tokenDataCache.delete(key);
      }
      // If still too large, delete oldest entries
      if (tokenDataCache.size >= MAX_CACHE_SIZE) {
        const firstKey = tokenDataCache.keys().next().value;
        if (firstKey) tokenDataCache.delete(firstKey);
      }
    }
    tokenDataCache.set(cacheKey, { data: pairs, timestamp: Date.now() });
    return pairs;
  } catch {
    return [];
  }
}

export async function enrichTokenData(
  chainId: string, tokenAddress: string, _symbol: string
): Promise<{ icon?: string; priceUsd?: string; priceChange24h?: number }> {
  if (!tokenAddress || tokenAddress === 'native' || tokenAddress.length < 10) return {};
  try {
    const pairs = await getTokenPairs(chainId, tokenAddress);
    const result: { icon?: string; priceUsd?: string; priceChange24h?: number } = {};
    for (const pair of pairs) {
      if (pair.info?.imageUrl) { result.icon = pair.info.imageUrl; break; }
    }
    const bestPair = pairs
      .filter(p => p.priceUsd && p.liquidity?.usd)
      .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
    if (bestPair?.priceUsd) {
      result.priceUsd = bestPair.priceUsd;
      result.priceChange24h = bestPair.priceChange.h24;
    }
    return result;
  } catch {
    return {};
  }
}
