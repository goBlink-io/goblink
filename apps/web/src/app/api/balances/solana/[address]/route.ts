import { NextRequest } from 'next/server';
import axios from 'axios';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { errorResponse, successResponse, addRateLimitHeaders } from '@/lib/api-response';
import { isValidSolanaAddress } from '@/lib/validators';
import { logger } from '@/lib/logger';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const REQUEST_TIMEOUT = 10000; // 10 seconds

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
    
    // Validate Solana address format
    if (!isValidSolanaAddress(address)) {
      return addRateLimitHeaders(
        errorResponse('Invalid Solana address format', 400, { code: 'INVALID_ADDRESS' }),
        rateLimit
      );
    }
    
    const response = await axios.post(
      SOLANA_RPC_URL,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      },
      {
        timeout: REQUEST_TIMEOUT,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }
    );
    
    const lamports = response.data?.result?.value || 0;
    const balanceInSol = String(lamports / 1e9);
    
    return addRateLimitHeaders(
      successResponse({
        balance: balanceInSol,
        balanceLamports: lamports.toString(),
        address,
      }),
      rateLimit
    );
  } catch (error: unknown) {
    logger.error('[SOLANA_BALANCE_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return addRateLimitHeaders(
      errorResponse('Failed to fetch SOL balance', 500, { details: message }),
      rateLimit
    );
  }
}
