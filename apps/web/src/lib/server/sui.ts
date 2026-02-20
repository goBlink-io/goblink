import axios from 'axios';

const BLOCKVISION_BASE_URL = 'https://api.blockvision.org/v2';

export interface BlockvisionCoin {
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

export interface BlockvisionResponse {
  code: number;
  message: string;
  result: {
    coins: BlockvisionCoin[];
    usdValue: string;
  };
}

export async function getSuiAccountCoins(address: string): Promise<BlockvisionResponse> {
  const apiKey = process.env.BLOCKVISION_API_KEY?.trim();
  if (!apiKey) throw new Error('BLOCKVISION_API_KEY is not configured');
  const response = await axios.get<BlockvisionResponse>(
    `${BLOCKVISION_BASE_URL}/sui/account/coins`,
    {
      params: { account: address },
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    }
  );
  return response.data;
}

export async function getSuiBalance(address: string) {
  const response = await getSuiAccountCoins(address);
  const suiCoin = response.result.coins.find(coin =>
    coin.coinType.toLowerCase().includes('::sui::sui')
  );
  if (!suiCoin) return { balance: '0.0000', balanceMist: '0', address };
  const balanceMist = suiCoin.balance;
  const balanceInSui = String(Number(balanceMist) / 1e9);
  return { balance: balanceInSui, balanceMist, address };
}

export async function getSuiAccountTokens(address: string): Promise<BlockvisionCoin[]> {
  const response = await getSuiAccountCoins(address);
  return response.result.coins.filter(coin => BigInt(coin.balance) > 0);
}

export async function getSuiTokenBalance(address: string, coinType: string) {
  const response = await getSuiAccountCoins(address);
  const coin = response.result.coins.find(c =>
    c.coinType.toLowerCase() === coinType.toLowerCase()
  );
  if (!coin) return { balance: '0.0000', balanceRaw: '0', address, decimals: 6 };
  const balanceFormatted = String(Number(coin.balance) / Math.pow(10, coin.decimals));
  return { balance: balanceFormatted, balanceRaw: coin.balance, address, decimals: coin.decimals };
}
