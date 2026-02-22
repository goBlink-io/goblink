import { NextRequest, NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import { QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import * as fees from '@/lib/server/fees';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, addRateLimitHeaders } from '@/lib/api-response';
import { isValidAssetId, isValidAmount, isValidSlippage, isValidDeadline } from '@/lib/validators';
import { logger } from '@/lib/logger';

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
    logger.error('Failed to fetch token prices for fee calculation:', error);
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
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, RateLimitConfigs.quote);
  
  if (!rateLimit.allowed) {
    return addRateLimitHeaders(
      errorResponse('Rate limit exceeded. Maximum 10 quotes per minute.', 429),
      rateLimit
    );
  }
  
  try {
    const body = await request.json();
    const { dry, originAsset, destinationAsset, amount, recipient, refundTo, swapType, slippageTolerance, deadline } = body;

    // Required fields validation
    if (!originAsset || !destinationAsset || !amount || !recipient || !refundTo) {
      return addRateLimitHeaders(
        errorResponse('Missing required fields: originAsset, destinationAsset, amount, recipient, refundTo', 400),
        rateLimit
      );
    }

    // Validate asset IDs
    if (!isValidAssetId(originAsset)) {
      return addRateLimitHeaders(
        errorResponse('Invalid originAsset format', 400, { code: 'INVALID_ORIGIN_ASSET' }),
        rateLimit
      );
    }
    
    if (!isValidAssetId(destinationAsset)) {
      return addRateLimitHeaders(
        errorResponse('Invalid destinationAsset format', 400, { code: 'INVALID_DESTINATION_ASSET' }),
        rateLimit
      );
    }

    // Validate amount
    const amountValidation = isValidAmount(amount, 18); // Use 18 decimals as default
    if (!amountValidation.valid) {
      return addRateLimitHeaders(
        errorResponse(amountValidation.error || 'Invalid amount', 400, { code: 'INVALID_AMOUNT' }),
        rateLimit
      );
    }

    // Validate addresses (basic length check - specific validation per chain would be better)
    if (typeof recipient !== 'string' || recipient.length < 10 || recipient.length > 128) {
      return addRateLimitHeaders(
        errorResponse('Invalid recipient address', 400, { code: 'INVALID_RECIPIENT' }),
        rateLimit
      );
    }
    
    if (typeof refundTo !== 'string' || refundTo.length < 10 || refundTo.length > 128) {
      return addRateLimitHeaders(
        errorResponse('Invalid refundTo address', 400, { code: 'INVALID_REFUND_ADDRESS' }),
        rateLimit
      );
    }

    // Validate slippage tolerance if provided
    const slippageValue = slippageTolerance ?? 100;
    if (!isValidSlippage(slippageValue)) {
      return addRateLimitHeaders(
        errorResponse('Invalid slippage tolerance: must be 0-10000 bps (0-100%)', 400, { code: 'INVALID_SLIPPAGE' }),
        rateLimit
      );
    }

    // Validate deadline if provided
    const deadlineValue = deadline ?? new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const deadlineValidation = isValidDeadline(deadlineValue);
    if (!deadlineValidation.valid) {
      return addRateLimitHeaders(
        errorResponse(deadlineValidation.error || 'Invalid deadline', 400, { code: 'INVALID_DEADLINE' }),
        rateLimit
      );
    }

    const resolvedOriginAsset = NATIVE_TO_NEP141_MAP[originAsset] || originAsset;
    const resolvedDestinationAsset = NATIVE_TO_NEP141_MAP[destinationAsset] || destinationAsset;

    // Estimate USD value for tiered fee calculation.
    // For EXACT_OUTPUT, `amount` is the desired destination amount — use destination asset price.
    // For EXACT_INPUT (default), `amount` is the origin input amount — use origin asset price.
    const isExactOutput = swapType === 'EXACT_OUTPUT';
    const feeEstimationAsset = isExactOutput ? resolvedDestinationAsset : resolvedOriginAsset;
    const amountUsd = await estimateAmountUsd(feeEstimationAsset, amount);
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
      slippageTolerance: slippageValue,
      deadline: deadlineValue,
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

    return addRateLimitHeaders(
      NextResponse.json(response),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[QUOTE_ERROR]', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    let statusCode = 500;
    let code = 'QUOTE_ERROR';
    
    if (message.includes('refundTo') || message.includes('recipient') || message.includes('amount') || message.includes('asset')) {
      statusCode = 400;
      code = 'INVALID_PARAMS';
    } else if (message.includes('timeout') || message.includes('network')) {
      statusCode = 503;
      code = 'SERVICE_UNAVAILABLE';
    }
    
    return errorResponse('Failed to get quote', statusCode, { code, details: message });
  }
}
