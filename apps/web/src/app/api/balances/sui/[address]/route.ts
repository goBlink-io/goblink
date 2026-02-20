import { NextRequest } from 'next/server';
import { getSuiBalance } from '@/lib/server/sui';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, successResponse, addRateLimitHeaders } from '@/lib/api-response';
import { isValidSuiAddress } from '@/lib/validators';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, RateLimitConfigs.balance);
  
  if (!rateLimit.allowed) {
    return addRateLimitHeaders(
      errorResponse('Rate limit exceeded', 429),
      rateLimit
    );
  }
  
  try {
    const { address } = await params;
    
    // Validate Sui address format
    if (!isValidSuiAddress(address)) {
      return addRateLimitHeaders(
        errorResponse('Invalid Sui address format (must be 0x followed by 64 hex characters)', 400, { code: 'INVALID_ADDRESS' }),
        rateLimit
      );
    }
    
    const result = await getSuiBalance(address);
    
    return addRateLimitHeaders(
      successResponse(result),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[SUI_BALANCE_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to fetch SUI balance', 500, { details: message }),
      rateLimit
    );
  }
}
