import { NextRequest } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, successResponse, addRateLimitHeaders } from '@/lib/api-response';
import { isValidTxHash } from '@/lib/validators';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, RateLimitConfigs.submit);
  
  if (!rateLimit.allowed) {
    return addRateLimitHeaders(
      errorResponse('Rate limit exceeded. Please try again later.', 429),
      rateLimit
    );
  }
  
  try {
    const { txHash, depositAddress } = await request.json();
    
    // Input validation
    if (!txHash || !depositAddress) {
      return addRateLimitHeaders(
        errorResponse('txHash and depositAddress are required', 400),
        rateLimit
      );
    }
    
    // Validate txHash format
    if (!isValidTxHash(txHash)) {
      return addRateLimitHeaders(
        errorResponse('Invalid transaction hash format', 400),
        rateLimit
      );
    }
    
    // Validate depositAddress format (basic length check)
    if (typeof depositAddress !== 'string' || depositAddress.length < 10 || depositAddress.length > 128) {
      return addRateLimitHeaders(
        errorResponse('Invalid deposit address format', 400),
        rateLimit
      );
    }
    
    // Submit to 1Click API
    try {
      const result = await oneclick.submitDeposit(txHash, depositAddress);
      
      return addRateLimitHeaders(
        successResponse({
          message: 'Transaction submitted successfully',
          txHash,
          depositAddress,
          ...result,
        }),
        rateLimit
      );
    } catch (error: unknown) {
      // Log the actual error server-side
      logger.error('[SUBMIT_ERROR]', {
        txHash,
        depositAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Return honest error to client
      return addRateLimitHeaders(
        errorResponse(
          'Failed to submit transaction to tracking service',
          503,
          {
            code: 'SUBMIT_FAILED',
            details: 'Your transaction may still process. Check status in a few minutes.',
          }
        ),
        rateLimit
      );
    }
  } catch (error: unknown) {
    logger.error('[SUBMIT_PARSE_ERROR]', error);
    return errorResponse('Invalid request format', 400);
  }
}
