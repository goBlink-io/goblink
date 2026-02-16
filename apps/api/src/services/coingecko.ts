/**
 * CoinGecko API service for fetching token icons and metadata
 */

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>;
}

interface CoinGeckoTokenDetail {
  id: string;
  symbol: string;
  name: string;
  image?: {
    thumb?: string;
    small?: string;
    large?: string;
  };
}

// Cache for token list and icons
let tokenListCache: CoinGeckoToken[] | null = null;
let tokenListCacheTime: number = 0;
const TOKEN_LIST_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const iconCache = new Map<string, string>();
const iconCacheTime = new Map<string, number>();
const ICON_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1200; // 1.2 seconds between requests (50 calls/min limit)

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
}

/**
 * Static mapping of common token symbols to CoinGecko IDs
 * This avoids API calls for the most common tokens
 */
const STATIC_TOKEN_MAPPING: Record<string, string> = {
  // Major tokens
  'BTC': 'bitcoin',
  'WBTC': 'wrapped-bitcoin',
  'ETH': 'ethereum',
  'WETH': 'weth',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'USDC.e': 'usd-coin',
  'DAI': 'dai',
  'BUSD': 'binance-usd',
  
  // Chain native tokens
  'BNB': 'binancecoin',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'SOL': 'solana',
  'SUI': 'sui',
  'NEAR': 'near',
  'wNEAR': 'near',
  
  // DeFi tokens
  'AAVE': 'aave',
  'UNI': 'uniswap',
  'LINK': 'chainlink',
  'MKR': 'maker',
  'COMP': 'compound-governance-token',
  'SNX': 'synthetix-network-token',
  'CRV': 'curve-dao-token',
  'SUSHI': 'sushi',
  '1INCH': '1inch',
  'YFI': 'yearn-finance',
  'BAL': 'balancer',
  
  // Stablecoins
  'FRAX': 'frax',
  'TUSD': 'true-usd',
  'USDP': 'paxos-standard',
  'LUSD': 'liquity-usd',
  'sUSD': 'nusd',
  'USDD': 'usdd',
  'GUSD': 'gemini-dollar',
  
  // Wrapped tokens
  'stETH': 'staked-ether',
  'wstETH': 'wrapped-steth',
  'cbETH': 'coinbase-wrapped-staked-eth',
  'rETH': 'rocket-pool-eth',
  'cbBTC': 'coinbase-wrapped-btc',
  
  // Meme tokens
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'PEPE': 'pepe',
  'FLOKI': 'floki',
  'BONK': 'bonk',
  'WIF': 'dogwifcoin',
  '$WIF': 'dogwifcoin',
  'BOME': 'book-of-meme',
  'TRUMP': 'maga',
  'TURBO': 'turbo',
  
  // Other popular tokens
  'APE': 'apecoin',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AXS': 'axie-infinity',
  'ENS': 'ethereum-name-service',
  'GRT': 'the-graph',
  'FTM': 'fantom',
  'ATOM': 'cosmos',
  'DOT': 'polkadot',
  'ADA': 'cardano',
  'XRP': 'ripple',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'ETC': 'ethereum-classic',
  'XLM': 'stellar',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'HBAR': 'hedera-hashgraph',
  'APT': 'aptos',
  'OP': 'optimism',
  'IMX': 'immutable-x',
  'RNDR': 'render-token',
  'INJ': 'injective-protocol',
  'STX': 'blockstack',
  'TIA': 'celestia',
  'SEI': 'sei-network',
  'BLUR': 'blur',
  'PENGU': 'pudgy-penguins',
  'xBTC': 'xbtc',
  'SPX': 'spx6900',
  'ADI': 'adi',
  'INX': 'inx',
  'TITN': 'titn',
  'KAITO': 'kaito',
  'AURORA': 'aurora-near',
  'KNC': 'kyber-network-crystal',
  'SAFE': 'safe',
  'HAPI': 'hapi',
  'SWEAT': 'sweat-economy',
  'ASTER': 'aster',
};

/**
 * Get CoinGecko icon URL from static mapping
 */
export function getStaticIconUrl(symbol: string): string | null {
  const normalizedSymbol = symbol.toUpperCase().replace('.OMFT', '').replace('.OMDEP', '');
  const coingeckoId = STATIC_TOKEN_MAPPING[normalizedSymbol];
  
  if (coingeckoId) {
    return `https://assets.coingecko.com/coins/images/1/large/${coingeckoId}.png`;
  }
  
  return null;
}

/**
 * Search for a token by symbol on CoinGecko
 */
export async function searchTokenBySymbol(symbol: string): Promise<string | null> {
  try {
    // Check static mapping first
    const normalizedSymbol = symbol.toUpperCase().replace('.OMFT', '').replace('.OMDEP', '');
    if (STATIC_TOKEN_MAPPING[normalizedSymbol]) {
      return STATIC_TOKEN_MAPPING[normalizedSymbol];
    }

    // Check cache
    const cacheKey = `symbol:${normalizedSymbol}`;
    const cached = iconCache.get(cacheKey);
    const cacheTime = iconCacheTime.get(cacheKey) || 0;
    if (cached && Date.now() - cacheTime < ICON_CACHE_DURATION) {
      return cached;
    }

    // Fetch token list if not cached or expired
    if (!tokenListCache || Date.now() - tokenListCacheTime > TOKEN_LIST_CACHE_DURATION) {
      await rateLimit();
      const response = await fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=true');
      if (!response.ok) {
        console.error('Failed to fetch CoinGecko token list:', response.status);
        return null;
      }
      tokenListCache = await response.json() as CoinGeckoToken[];
      tokenListCacheTime = Date.now();
    }

    // Search for token by symbol
    const token = tokenListCache?.find(t => 
      t.symbol.toUpperCase() === normalizedSymbol
    );

    if (token) {
      iconCache.set(cacheKey, token.id);
      iconCacheTime.set(cacheKey, Date.now());
      return token.id;
    }

    return null;
  } catch (error) {
    console.error(`Error searching CoinGecko for symbol ${symbol}:`, error);
    return null;
  }
}

/**
 * Get token icon URL by CoinGecko ID
 */
export async function getTokenIcon(coingeckoId: string): Promise<string | null> {
  try {
    // Check cache
    const cacheKey = `icon:${coingeckoId}`;
    const cached = iconCache.get(cacheKey);
    const cacheTime = iconCacheTime.get(cacheKey) || 0;
    if (cached && Date.now() - cacheTime < ICON_CACHE_DURATION) {
      return cached;
    }

    await rateLimit();
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coingeckoId}`);
    if (!response.ok) {
      console.error(`Failed to fetch CoinGecko token details for ${coingeckoId}:`, response.status);
      return null;
    }

    const data = await response.json() as CoinGeckoTokenDetail;
    const iconUrl = data.image?.large || data.image?.small || data.image?.thumb;

    if (iconUrl) {
      iconCache.set(cacheKey, iconUrl);
      iconCacheTime.set(cacheKey, Date.now());
      return iconUrl;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching CoinGecko icon for ${coingeckoId}:`, error);
    return null;
  }
}

/**
 * Get token icon URL by symbol (combines search + icon fetch)
 */
export async function getTokenIconBySymbol(symbol: string): Promise<string | null> {
  try {
    // Check static mapping first
    const normalizedSymbol = symbol.toUpperCase().replace('.OMFT', '').replace('.OMDEP', '');
    const staticId = STATIC_TOKEN_MAPPING[normalizedSymbol];
    
    if (staticId) {
      // Use direct CoinGecko asset URL for static mappings (no API call needed)
      return `https://assets.coingecko.com/coins/images/1/large/${staticId}.png`;
    }

    // Fall back to API search
    const coingeckoId = await searchTokenBySymbol(symbol);
    if (!coingeckoId) {
      return null;
    }

    return await getTokenIcon(coingeckoId);
  } catch (error) {
    console.error(`Error getting CoinGecko icon for symbol ${symbol}:`, error);
    return null;
  }
}

/**
 * Batch get icons for multiple tokens (rate-limited)
 */
export async function batchGetTokenIcons(symbols: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const symbol of symbols) {
    const iconUrl = await getTokenIconBySymbol(symbol);
    if (iconUrl) {
      results[symbol] = iconUrl;
    }
  }

  return results;
}
