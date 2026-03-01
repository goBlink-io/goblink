import { NextRequest } from 'next/server';
import { searchTransactions } from '@/lib/server/transactions';
import { errorResponse, successResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/transactions/search?q=...
 * Search transactions by wallet address, deposit address, or tx hash
 * Primarily for customer support use
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 3) {
      return errorResponse('Search query must be at least 3 characters', 400);
    }

    const result = await searchTransactions(query);

    if (!result.success) {
      return errorResponse(result.error || 'Search failed', 500);
    }

    logger.info('[TRANSACTION_SEARCH]', { query, resultsCount: result.transactions?.length || 0 });
    return successResponse({
      transactions: result.transactions || [],
      query,
    });
  } catch (error: unknown) {
    logger.error('[TRANSACTION_SEARCH_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Search failed', 500, { details: message });
  }
}
