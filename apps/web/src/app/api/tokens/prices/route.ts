import { NextRequest, NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, addRateLimitHeaders } from '@/lib/api-response';
import { logger } from '@/lib/logger';

// Cache prices for 2 minutes
export const revalidate = 120;

/** Carry over the `price` field from 1Click API as `priceUsd` */
function extractPricing(token: Record<string, unknown>): { assetId: string; priceUsd?: string } {
  const price = token.price as number | undefined;
  const result: { assetId: string; priceUsd?: string } = {
    assetId: token.assetId as string,
  };
  if (price != null && price > 0) {
    result.priceUsd = String(price);
  }
  return result;
}

export async function GET(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, RateLimitConfigs.tokens);
  
  if (!rateLimit.allowed) {
    return addRateLimitHeaders(
      errorResponse('Rate limit exceeded', 429),
      rateLimit
    );
  }
  
  try {
    const rawTokens = await oneclick.getTokens();
    
    // Extract just the pricing data
    const prices = (rawTokens as Record<string, unknown>[]).map(extractPricing);

    const response = NextResponse.json(prices, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60',
      },
    });
    
    return addRateLimitHeaders(response, rateLimit);
  } catch (error: unknown) {
    logger.error('[PRICES_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to fetch prices', 500, { details: message }),
      rateLimit
    );
  }
}
