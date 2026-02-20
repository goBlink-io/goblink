import { NextRequest, NextResponse } from 'next/server';
import { intentsExplorer } from '@/lib/server/intentsExplorer';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, addRateLimitHeaders } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ depositAddress: string }> }
) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, RateLimitConfigs.status);
  
  if (!rateLimit.allowed) {
    return addRateLimitHeaders(
      errorResponse('Rate limit exceeded', 429),
      rateLimit
    );
  }
  
  try {
    const { depositAddress } = await params;

    if (!intentsExplorer.isConfigured()) {
      return addRateLimitHeaders(
        errorResponse('Transaction tracking not available', 503),
        rateLimit
      );
    }

    try {
      const transaction = await intentsExplorer.getTransactionByDepositAddress(depositAddress);
      if (transaction) {
        return addRateLimitHeaders(
          NextResponse.json({
            depositAddress: transaction.depositAddress,
            status: transaction.status,
            originAsset: transaction.originAsset,
            destinationAsset: transaction.destinationAsset,
            amountIn: transaction.amountIn,
            amountOut: transaction.amountOut,
            recipient: transaction.recipient,
            refundTo: transaction.refundTo,
            depositTxHash: transaction.depositTxHash,
            fulfillmentTxHash: transaction.fulfillmentTxHash,
            refundTxHash: transaction.refundTxHash,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            referral: transaction.referral,
            affiliate: transaction.affiliate,
          }),
          rateLimit
        );
      }
      return addRateLimitHeaders(
        errorResponse('Swap not found', 404, { details: { depositAddress } }),
        rateLimit
      );
    } catch (explorerError: unknown) {
      const msg = explorerError instanceof Error ? explorerError.message : '';
      if (msg.includes('429') || msg.includes('rate limit')) {
        return addRateLimitHeaders(
          errorResponse('Transaction not yet available', 404, { details: { depositAddress } }),
          rateLimit
        );
      }
      throw explorerError;
    }
  } catch (error: unknown) {
    logger.error('[STATUS_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to fetch status', 500, { details: message }),
      rateLimit
    );
  }
}
