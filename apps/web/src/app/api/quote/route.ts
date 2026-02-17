import { NextRequest, NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import { QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import * as fees from '@/lib/server/fees';

const NATIVE_TO_NEP141_MAP: Record<string, string> = {
  'sui:0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI': 'nep141:sui.omft.near',
  'solana:native': 'nep141:sol.omft.near',
};

// Token price cache (refreshed from /api/tokens data)
let tokenPriceCache: Map<string, { price: number; decimals: number }> = new Map();
let tokenCacheTimestamp = 0;
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getTokenPrices(): Promise<Map<string, { price: number; decimals: number }>> {
  if (Date.now() - tokenCacheTimestamp < TOKEN_CACHE_TTL && tokenPriceCache.size > 0) {
    return tokenPriceCache;
  }

  try {
    const tokens = await oneclick.getTokens() as Array<{
      assetId: string;
      price?: number;
      decimals: number;
      symbol?: string;
    }>;

    const cache = new Map<string, { price: number; decimals: number }>();
    for (const token of tokens) {
      if (token.price && token.price > 0) {
        cache.set(token.assetId, { price: token.price, decimals: token.decimals });
      }
    }

    tokenPriceCache = cache;
    tokenCacheTimestamp = Date.now();
    return cache;
  } catch (error) {
    console.error('Failed to fetch token prices for fee calculation:', error);
    return tokenPriceCache; // Return stale cache on error
  }
}

/**
 * Estimate the USD value of a transaction amount.
 * Uses the origin asset's price from the 1Click API.
 */
async function estimateAmountUsd(
  assetId: string,
  atomicAmount: string
): Promise<number | undefined> {
  const prices = await getTokenPrices();
  const tokenInfo = prices.get(assetId);
  if (!tokenInfo) return undefined;

  try {
    const amount = Number(BigInt(atomicAmount)) / Math.pow(10, tokenInfo.decimals);
    return amount * tokenInfo.price;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dry, originAsset, destinationAsset, amount, recipient, refundTo, swapType, slippageTolerance, deadline } = body;

    if (!originAsset || !destinationAsset || !amount || !recipient || !refundTo) {
      return NextResponse.json(
        { error: 'Missing required fields: originAsset, destinationAsset, amount, recipient, refundTo' },
        { status: 400 }
      );
    }

    const resolvedOriginAsset = NATIVE_TO_NEP141_MAP[originAsset] || originAsset;
    const resolvedDestinationAsset = NATIVE_TO_NEP141_MAP[destinationAsset] || destinationAsset;

    // Estimate USD value for tiered fee calculation
    const amountUsd = await estimateAmountUsd(resolvedOriginAsset, amount);
    const feeBps = fees.calculateEffectiveFeeBps(amountUsd);
    const feeRecipient = fees.getFeeRecipient();

    const quoteRequest: QuoteRequest = {
      dry: dry ?? true,
      originAsset: resolvedOriginAsset,
      destinationAsset: resolvedDestinationAsset,
      amount,
      recipient,
      refundTo,
      swapType: swapType ?? QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: slippageTolerance ?? 100,
      deadline: deadline ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
      appFees: [{ recipient: feeRecipient, fee: feeBps }],
    };

    const quote = await oneclick.getQuote(quoteRequest);

    // Attach fee metadata for frontend display
    const response = {
      ...quote as Record<string, unknown>,
      feeInfo: {
        bps: feeBps,
        percent: (feeBps / 100).toFixed(2),
        estimatedUsd: amountUsd
          ? (amountUsd * feeBps / 10000).toFixed(2)
          : null,
        tier: amountUsd !== undefined
          ? (amountUsd <= 5000 ? 'Standard' : amountUsd <= 50000 ? 'Pro' : 'Whale')
          : 'Standard',
        recipient: feeRecipient,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    let statusCode = 500;
    if (message.includes('refundTo') || message.includes('recipient') || message.includes('amount') || message.includes('asset')) {
      statusCode = 400;
    } else if (message.includes('timeout') || message.includes('network')) {
      statusCode = 503;
    }
    return NextResponse.json({ error: 'Failed to get quote', message }, { status: statusCode });
  }
}
