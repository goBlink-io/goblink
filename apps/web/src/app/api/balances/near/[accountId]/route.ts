import { NextRequest } from 'next/server';
import { providers } from 'near-api-js';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, successResponse, addRateLimitHeaders } from '@/lib/api-response';
import { isValidNearAccount } from '@/lib/validators';
import { logger } from '@/lib/logger';

const NEAR_RPC_URL = process.env.NEAR_RPC_URL || 'https://rpc.fastnear.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
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
    const { accountId } = await params;
    
    // Validate NEAR account ID format
    if (!isValidNearAccount(accountId)) {
      return addRateLimitHeaders(
        errorResponse('Invalid NEAR account ID format', 400, { code: 'INVALID_ACCOUNT_ID' }),
        rateLimit
      );
    }
    
    const provider = new providers.JsonRpcProvider({ url: NEAR_RPC_URL });
    const account = await provider.query({
      request_type: 'view_account',
      finality: 'final',
      account_id: accountId,
    }) as unknown as { amount: string };
    
    const balanceInNear = String(Number(account.amount) / 1e24);
    
    return addRateLimitHeaders(
      successResponse({
        balance: balanceInNear,
        balanceYocto: account.amount,
        accountId,
      }),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[NEAR_BALANCE_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to fetch balance', 500, { details: message }),
      rateLimit
    );
  }
}
