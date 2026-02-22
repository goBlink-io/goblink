import { NextRequest } from 'next/server';
import { getTransaction, syncTransactionStatus } from '@/lib/server/transactions';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, successResponse, addRateLimitHeaders } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/transactions/[id]/sync
 * Trigger status sync from Intents Explorer for a transaction
 */
export async function POST(
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

    // First, get the transaction to find its deposit address
    const txResult = await getTransaction(id);

    if (!txResult.success || !txResult.transaction) {
      return addRateLimitHeaders(
        errorResponse('Transaction not found', 404),
        rateLimit
      );
    }

    const { deposit_address } = txResult.transaction;

    if (!deposit_address) {
      return addRateLimitHeaders(
        errorResponse('Transaction has no deposit address to sync', 400),
        rateLimit
      );
    }

    // Sync from Intents Explorer
    const syncResult = await syncTransactionStatus(deposit_address);

    if (!syncResult.success) {
      // Sync is best-effort — explorer not configured, tx not indexed yet, or transient error.
      // Never surface as 500 since the transfer itself succeeded; client ignores this anyway.
      logger.info('[TRANSACTION_SYNC_SKIPPED]', { id, reason: syncResult.error });
      return addRateLimitHeaders(
        successResponse({ synced: false, reason: syncResult.error }),
        rateLimit
      );
    }

    logger.info('[TRANSACTION_SYNC]', { id, depositAddress: deposit_address, synced: syncResult.synced });
    return addRateLimitHeaders(
      successResponse({
        transaction: syncResult.transaction,
        synced: syncResult.synced,
      }),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[TRANSACTION_SYNC_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to sync transaction', 500, { details: message }),
      rateLimit
    );
  }
}
