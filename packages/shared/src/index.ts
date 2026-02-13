export type ChainType = 'EVM' | 'NEAR' | 'SOLANA' | 'SUI' | 'TON' | 'BITCOIN' | 'TRON' | 'STELLAR' | 'STARKNET' | 'XRP' | 'DOGE' | 'LITECOIN' | 'BITCOIN_CASH';

export interface Token {
  assetId: string;
  symbol: string;
  name?: string;
  decimals: number;
  icon?: string;
  chain?: ChainType;
  blockchain?: string;
  contractAddress?: string;
  price?: number;
  priceUpdatedAt?: string;
}

export type SwapStatus = 'PENDING_QUOTE' | 'PENDING_DEPOSIT' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'INCOMPLETE_DEPOSIT';

export interface SwapQuote {
  quoteId: string;
  depositAddress: string;
  depositMemo?: string;
  amountIn: string;
  amountOut: string;
  originAsset: string;
  destinationAsset: string;
  feeAmount: string;
  exchangeRate: string;
  estimatedTimeMs: number;
  deadline: string;
}

export interface Transaction {
  id: string;
  sessionId: string;
  originAsset: string;
  destinationAsset: string;
  amount: string;
  depositAddress: string;
  recipient: string;
  refundTo: string;
  status: SwapStatus;
  appFeeBps: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeeTier {
  maxAmountUsd: number | null;
  bps: number;
}
