import { NextRequest, NextResponse } from 'next/server';
import { getTransaction, updateTransactionStatus } from '@/lib/server/transactions';
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

// Allowed terminal + in-progress statuses (guards against arbitrary writes)
const VALID_STATUSES = new Set(['pending', 'processing', 'completed', 'refunded', 'failed']);

/**
 * PATCH /api/transactions/[id]
 * Update status (and optional fields) for a transaction — called by the history
 * page after confirming real status from the 1Click execution-status API.
 */
export async function PATCH(
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
    const body = await request.json();
    const { depositAddress, status, amountOut, fulfillmentTxHash, refundTxHash } = body;

    if (!depositAddress || !status) {
      return addRateLimitHeaders(
        errorResponse('depositAddress and status are required', 400),
        rateLimit
      );
    }

    if (!VALID_STATUSES.has(status)) {
      return addRateLimitHeaders(
        errorResponse(`Invalid status. Allowed: ${[...VALID_STATUSES].join(', ')}`, 400),
        rateLimit
      );
    }

    const result = await updateTransactionStatus(depositAddress, {
      status,
      ...(amountOut && { amountOut }),
      ...(fulfillmentTxHash && { fulfillmentTxHash }),
      ...(refundTxHash && { refundTxHash }),
    });

    if (!result.success) {
      return addRateLimitHeaders(
        errorResponse(result.error || 'Failed to update transaction', 500),
        rateLimit
      );
    }

    logger.info('[TRANSACTION_STATUS_UPDATED]', { id, status });
    return addRateLimitHeaders(
      NextResponse.json({ success: true, status }),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[TRANSACTION_PATCH_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to update transaction', 500, { details: message }),
      rateLimit
    );
  }
}
