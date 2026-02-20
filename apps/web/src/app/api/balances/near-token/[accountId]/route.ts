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
    
    // Validate NEAR account ID
    if (!isValidNearAccount(accountId)) {
      return addRateLimitHeaders(
        errorResponse('Invalid NEAR account ID format', 400, { code: 'INVALID_ACCOUNT_ID' }),
        rateLimit
      );
    }
    
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');
    const decimals = searchParams.get('decimals');

    if (!contractAddress || !decimals) {
      return addRateLimitHeaders(
        errorResponse('contractAddress and decimals are required', 400),
        rateLimit
      );
    }

    // Validate contract address is a NEAR account
    if (!isValidNearAccount(contractAddress)) {
      // Skip non-NEAR addresses (return 0 balance instead of error for compatibility)
      return addRateLimitHeaders(
        successResponse({
          balance: '0.00',
          balanceRaw: '0',
          accountId,
          contractAddress,
        }),
        rateLimit
      );
    }

    const provider = new providers.JsonRpcProvider({ url: NEAR_RPC_URL });
    const result = await provider.query({
      request_type: 'call_function',
      finality: 'final',
      account_id: contractAddress,
      method_name: 'ft_balance_of',
      args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
    }) as unknown as { result: number[] };

    const balance = JSON.parse(Buffer.from(result.result).toString());
    const decimalsNum = parseInt(decimals);
    const balanceInTokens = String(Number(balance) / Math.pow(10, decimalsNum));

    return addRateLimitHeaders(
      successResponse({
        balance: balanceInTokens,
        balanceRaw: balance,
        accountId,
        contractAddress,
      }),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[NEAR_TOKEN_BALANCE_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to fetch token balance', 500, { details: message }),
      rateLimit
    );
  }
}
