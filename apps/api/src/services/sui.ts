import axios from 'axios';

/**
 * Sui RPC Service using Blockvision API
 * Documentation: https://docs.blockvision.org/reference/retrieve-account-coins
 */

const BLOCKVISION_BASE_URL = 'https://api.blockvision.org/v2';

interface BlockvisionCoin {
  coinType: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  verified: boolean;
  isLpToken: boolean;
  logo: string;
  usdValue: string;
  price: string;
  priceChangePercentage24H: string;
  objects: number;
  scam: boolean;
}

interface BlockvisionResponse {
  code: number;
  message: string;
  result: {
    coins: BlockvisionCoin[];
    usdValue: string;
  };
}

/**
 * Get all coins owned by a Sui address
 * @param address - Sui wallet address
 * @returns Blockvision response with coins
 */
export async function getSuiAccountCoins(
  address: string
): Promise<BlockvisionResponse> {
  const apiKey = process.env.BLOCKVISION_API_KEY;
  
  if (!apiKey) {
    throw new Error('BLOCKVISION_API_KEY is not configured');
  }

  try {
    const response = await axios.get<BlockvisionResponse>(
      `${BLOCKVISION_BASE_URL}/sui/account/coins`,
      {
        params: { account: address },
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[SUI] Blockvision response:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error('Error fetching Sui account coins:', error.response?.data || error.message);
    throw new Error(`Failed to fetch Sui account coins: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Get SUI native token balance for an address
 * @param address - Sui wallet address
 * @returns Balance in SUI (not MIST)
 */
export async function getSuiBalance(address: string): Promise<{
  balance: string;
  balanceMist: string;
  address: string;
}> {
  const SUI_DECIMALS = 9; // SUI has 9 decimals (1 SUI = 10^9 MIST)
  
  try {
    const response = await getSuiAccountCoins(address);
    
    // Find SUI coin (it contains "::sui::SUI" in the coinType)
    const suiCoin = response.result.coins.find(coin =>
      coin.coinType.toLowerCase().includes('::sui::sui')
    );
    
    if (!suiCoin) {
      console.log('[SUI] No SUI coin found for address:', address);
      return {
        balance: '0.0000',
        balanceMist: '0',
        address,
      };
    }

    const balanceMist = suiCoin.balance;
    const balanceInSui = (Number(balanceMist) / Math.pow(10, SUI_DECIMALS)).toFixed(4);

    console.log('[SUI] Balance:', {
      address,
      balanceMist,
      balanceInSui,
    });

    return {
      balance: balanceInSui,
      balanceMist,
      address,
    };
  } catch (error: any) {
    console.error('[SUI] Error fetching SUI balance:', error.message);
    throw error;
  }
}

/**
 * Get all tokens (coins) for a Sui address with metadata
 * @param address - Sui wallet address
 * @returns Array of all coins with metadata from Blockvision
 */
export async function getSuiAccountTokens(address: string): Promise<BlockvisionCoin[]> {
  try {
    const response = await getSuiAccountCoins(address);
    
    // Filter out coins with zero balance
    const activeCoins = response.result.coins.filter(coin =>
      BigInt(coin.balance) > 0
    );

    return activeCoins;
  } catch (error: any) {
    console.error('[SUI] Error fetching Sui account tokens:', error.message);
    throw error;
  }
}

/**
 * Get balance for a specific Sui token by coin type
 * @param address - Sui wallet address
 * @param coinType - Full coin type address (e.g., "0xdba...::usdc::USDC")
 * @returns Token balance formatted with decimals
 */
export async function getSuiTokenBalance(
  address: string,
  coinType: string
): Promise<{
  balance: string;
  balanceRaw: string;
  address: string;
  decimals: number;
}> {
  try {
    const response = await getSuiAccountCoins(address);
    
    // Find the specific coin by coinType (case-insensitive)
    const coin = response.result.coins.find(c =>
      c.coinType.toLowerCase() === coinType.toLowerCase()
    );
    
    if (!coin) {
      console.log(`[SUI] Token ${coinType} not found for address:`, address);
      return {
        balance: '0.0000',
        balanceRaw: '0',
        address,
        decimals: 6, // Default to 6 decimals if not found
      };
    }

    const balanceRaw = coin.balance;
    const balanceFormatted = (Number(balanceRaw) / Math.pow(10, coin.decimals)).toFixed(4);

    console.log('[SUI] Token balance:', {
      address,
      coinType,
      symbol: coin.symbol,
      balanceRaw,
      balanceFormatted,
      decimals: coin.decimals,
    });

    return {
      balance: balanceFormatted,
      balanceRaw,
      address,
      decimals: coin.decimals,
    };
  } catch (error: any) {
    console.error(`[SUI] Error fetching token balance for ${coinType}:`, error.message);
    throw error;
  }
}

export default {
  getSuiAccountCoins,
  getSuiBalance,
  getSuiAccountTokens,
  getSuiTokenBalance,
};
