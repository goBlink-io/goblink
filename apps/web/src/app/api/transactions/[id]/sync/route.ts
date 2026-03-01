import { NextRequest } from 'next/server';
import { getTransaction, syncTransactionStatus } from '@/lib/server/transactions';
import { errorResponse, successResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/transactions/[id]/sync
 * Trigger status sync from Intents Explorer for a transaction
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Transaction ID is required', 400);
    }

    // First, get the transaction to find its deposit address
    const txResult = await getTransaction(id);

    if (!txResult.success || !txResult.transaction) {
      return errorResponse('Transaction not found', 404);
    }

    const { deposit_address } = txResult.transaction;

    if (!deposit_address) {
      return errorResponse('Transaction has no deposit address to sync', 400);
    }

    // Sync from Intents Explorer
    const syncResult = await syncTransactionStatus(deposit_address);

    if (!syncResult.success) {
      // Sync is best-effort — explorer not configured, tx not indexed yet, or transient error.
      // Never surface as 500 since the transfer itself succeeded; client ignores this anyway.
      logger.info('[TRANSACTION_SYNC_SKIPPED]', { id, reason: syncResult.error });
      return successResponse({ synced: false, reason: syncResult.error });
    }

    logger.info('[TRANSACTION_SYNC]', { id, depositAddress: deposit_address, synced: syncResult.synced });
    return successResponse({
      transaction: syncResult.transaction,
      synced: syncResult.synced,
    });
  } catch (error: unknown) {
    logger.error('[TRANSACTION_SYNC_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Failed to sync transaction', 500, { details: message });
  }
}
