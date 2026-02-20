import { NextRequest, NextResponse } from 'next/server';
import { createTransaction, getTransactionsByWallet } from '@/lib/server/transactions';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, successResponse, addRateLimitHeaders } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/transactions
 * Create a new transaction record when swap is initiated
 */
export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, RateLimitConfigs.quote);

  if (!rateLimit.allowed) {
    return addRateLimitHeaders(
      errorResponse('Rate limit exceeded', 429),
      rateLimit
    );
  }

  try {
    const body = await request.json();
    const {
      walletAddress,
      walletChain,
      depositAddress,
      fromChain,
      fromToken,
      toChain,
      toToken,
      amountIn,
      amountOut,
      amountUsd,
      recipient,
      refundTo,
      status,
      depositTxHash,
      feeBps,
      feeAmount,
      quoteId,
    } = body;

    // Validate required fields
    if (!walletAddress || !walletChain || !fromChain || !fromToken || !toChain || !toToken || !amountIn || !recipient) {
      return addRateLimitHeaders(
        errorResponse('Missing required fields', 400, {
          details: { required: ['walletAddress', 'walletChain', 'fromChain', 'fromToken', 'toChain', 'toToken', 'amountIn', 'recipient'] }
        }),
        rateLimit
      );
    }

    const result = await createTransaction({
      walletAddress,
      walletChain,
      depositAddress,
      fromChain,
      fromToken,
      toChain,
      toToken,
      amountIn,
      amountOut,
      amountUsd,
      recipient,
      refundTo,
      status,
      depositTxHash,
      feeBps,
      feeAmount,
      quoteId,
    });

    if (!result.success) {
      return addRateLimitHeaders(
        errorResponse(result.error || 'Failed to create transaction', 500),
        rateLimit
      );
    }

    logger.info('[TRANSACTION_API_CREATE]', { id: result.transaction?.id, walletAddress });
    return addRateLimitHeaders(
      successResponse(result.transaction, 201),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[TRANSACTION_API_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to create transaction', 500, { details: message }),
      rateLimit
    );
  }
}

/**
 * GET /api/transactions?wallet=0x...&page=1&limit=20&status=pending
 * Get transaction history for a wallet
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
    const wallet = searchParams.get('wallet');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || undefined;

    if (!wallet) {
      return addRateLimitHeaders(
        errorResponse('Wallet address is required', 400),
        rateLimit
      );
    }

    // Validate pagination
    if (page < 1 || page > 1000) {
      return addRateLimitHeaders(
        errorResponse('Invalid page number (1-1000)', 400),
        rateLimit
      );
    }

    if (limit < 1 || limit > 100) {
      return addRateLimitHeaders(
        errorResponse('Invalid limit (1-100)', 400),
        rateLimit
      );
    }

    const result = await getTransactionsByWallet(wallet, { page, limit, status });

    if (!result.success) {
      return addRateLimitHeaders(
        errorResponse(result.error || 'Failed to fetch transactions', 500),
        rateLimit
      );
    }

    return addRateLimitHeaders(
      NextResponse.json({
        success: true,
        data: {
          transactions: result.transactions || [],
          total: result.total || 0,
          page,
          limit,
          totalPages: Math.ceil((result.total || 0) / limit),
        },
      }),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[TRANSACTION_API_GET_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to fetch transactions', 500, { details: message }),
      rateLimit
    );
  }
}
