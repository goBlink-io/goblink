import { NextRequest } from 'next/server';
import { getTransaction } from '@/lib/server/transactions';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, successResponse, addRateLimitHeaders } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/transactions/[id]
 * Get a single transaction by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, RateLimitConfigs.status);

  if (!rateLimit.allowed) {
    return addRateLimitHeaders(
      errorResponse('Rate limit exceeded', 429),
      rateLimit
    );
  }

  try {
    const { id } = await params;

    if (!id) {
      return addRateLimitHeaders(
        errorResponse('Transaction ID is required', 400),
        rateLimit
      );
    }

    const result = await getTransaction(id);

    if (!result.success) {
      const statusCode = result.error === 'Transaction not found' ? 404 : 500;
      return addRateLimitHeaders(
        errorResponse(result.error || 'Failed to fetch transaction', statusCode),
        rateLimit
      );
    }

    return addRateLimitHeaders(
      successResponse(result.transaction),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[TRANSACTION_GET_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to fetch transaction', 500, { details: message }),
      rateLimit
    );
  }
}
