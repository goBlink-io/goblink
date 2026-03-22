import { NextRequest } from 'next/server';
import { providers } from 'near-api-js';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidNearAccount } from '@/lib/validators';
import { logger } from '@/lib/logger';

const NEAR_RPC_URL = process.env.NEAR_RPC_URL || 'https://rpc.fastnear.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    // Validate NEAR account ID
    if (!isValidNearAccount(accountId)) {
      return errorResponse('Invalid NEAR account ID format', 400, { code: 'INVALID_ACCOUNT_ID' });
    }

    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');
    const decimals = searchParams.get('decimals');

    if (!contractAddress || !decimals) {
      return errorResponse('contractAddress and decimals are required', 400);
    }

    // Validate contract address is a NEAR account
    if (!isValidNearAccount(contractAddress)) {
      // Skip non-NEAR addresses (return 0 balance instead of error for compatibility)
      return successResponse({
        balance: '0.00',
        balanceRaw: '0',
        accountId,
        contractAddress,
      });
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
    const decimalsNum = parseInt(decimals, 10);
    if (isNaN(decimalsNum) || decimalsNum < 0) {
      return errorResponse('Invalid decimals parameter', 400, { code: 'INVALID_DECIMALS' });
    }
    const raw = BigInt(balance);
    const divisor = 10n ** BigInt(decimalsNum);
    const whole = raw / divisor;
    const fraction = raw % divisor;
    const fractionStr = decimalsNum > 0
      ? fraction.toString().padStart(decimalsNum, '0').replace(/0+$/, '')
      : '';
    const balanceInTokens = fractionStr ? `${whole}.${fractionStr}` : whole.toString();

    return successResponse({
      balance: balanceInTokens,
      balanceRaw: balance,
      accountId,
      contractAddress,
    });
  } catch (error: unknown) {
    logger.error('[NEAR_TOKEN_BALANCE_ERROR]', error);
    return errorResponse('Failed to fetch token balance', 500);
  }
}
