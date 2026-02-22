import { NextRequest, NextResponse } from 'next/server';
import { intentsExplorer } from '@/lib/server/intentsExplorer';
import * as oneclick from '@/lib/server/oneclick';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, addRateLimitHeaders } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * Map 1Click API status values to our internal status strings.
 * NEAR intents statuses: PENDING_DEPOSIT | KNOWN_DEPOSIT_TX | INCOMPLETE_DEPOSIT
 *                        | PROCESSING | SUCCESS | REFUNDED | FAILED
 */
function mapExecutionStatus(apiStatus: string): string {
  switch (apiStatus) {
    case 'SUCCESS':           return 'completed';
    case 'REFUNDED':          return 'refunded';
    case 'FAILED':            return 'failed';
    case 'PROCESSING':
    case 'KNOWN_DEPOSIT_TX':  return 'processing';
    case 'INCOMPLETE_DEPOSIT':
    case 'PENDING_DEPOSIT':
    default:                  return 'pending';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ depositAddress: string }> }
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
    const { depositAddress } = await params;

    // --- Primary: 1Click public status API (no JWT required) ---
    try {
      const execution = await oneclick.getExecutionStatus(depositAddress);
      const mappedStatus = mapExecutionStatus(execution.status as string);
      const quoteReq = execution.quoteResponse?.quoteRequest;
      const quoteData = execution.quoteResponse?.quote;

      return addRateLimitHeaders(
        NextResponse.json({
          depositAddress,
          status: mappedStatus,
          rawStatus: execution.status,
          originAsset: quoteReq?.originAsset,
          destinationAsset: quoteReq?.destinationAsset,
          amountIn: quoteData?.amountIn,
          amountOut: quoteData?.amountOut,
          recipient: quoteReq?.recipient,
          updatedAt: execution.updatedAt,
        }),
        rateLimit
      );
    } catch (apiError: unknown) {
      const msg = apiError instanceof Error ? apiError.message : String(apiError);
      // 404 = deposit address not yet known to 1Click (too early, not a real error)
      if (msg.includes('404') || msg.includes('not found')) {
        return addRateLimitHeaders(
          errorResponse('Swap not found', 404, { details: { depositAddress } }),
          rateLimit
        );
      }
      if (msg.includes('429') || msg.includes('rate limit')) {
        return addRateLimitHeaders(
          errorResponse('Rate limited', 429),
          rateLimit
        );
      }
      logger.warn('[STATUS_1CLICK_ERROR]', msg);
      // Fall through to Intents Explorer if available
    }

    // --- Fallback: Intents Explorer (requires JWT, optional) ---
    if (intentsExplorer.isConfigured()) {
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
            }),
            rateLimit
          );
        }
      } catch (explorerError: unknown) {
        logger.warn('[STATUS_EXPLORER_FALLBACK_ERROR]', explorerError);
      }
    }

    return addRateLimitHeaders(
      errorResponse('Status temporarily unavailable', 503),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[STATUS_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to fetch status', 500, { details: message }),
      rateLimit
    );
  }
}
