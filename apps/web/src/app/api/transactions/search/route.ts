import { NextRequest } from 'next/server';
import { searchTransactions } from '@/lib/server/transactions';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, successResponse, addRateLimitHeaders } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/transactions/search?q=...
 * Search transactions by wallet address, deposit address, or tx hash
 * Primarily for customer support use
 */
export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, RateLimitConfigs.status);

  if (!rateLimit.allowed) {
    return addRateLimitHeaders(
      errorResponse('Rate limit exceeded', 429),
      rateLimit
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 3) {
      return addRateLimitHeaders(
        errorResponse('Search query must be at least 3 characters', 400),
        rateLimit
      );
    }

    const result = await searchTransactions(query);

    if (!result.success) {
      return addRateLimitHeaders(
        errorResponse(result.error || 'Search failed', 500),
        rateLimit
      );
    }

    logger.info('[TRANSACTION_SEARCH]', { query, resultsCount: result.transactions?.length || 0 });
    return addRateLimitHeaders(
      successResponse({
        transactions: result.transactions || [],
        query,
      }),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[TRANSACTION_SEARCH_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Search failed', 500, { details: message }),
      rateLimit
    );
  }
}
