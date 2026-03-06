import { NextRequest } from 'next/server';
import { providers } from 'near-api-js';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidNearAccount } from '@/lib/validators';
import { logger } from '@/lib/logger';

const NEAR_RPC_URL = process.env.NEAR_RPC_URL || 'https://rpc.fastnear.com';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    // Validate NEAR account ID format
    if (!isValidNearAccount(accountId)) {
      return errorResponse('Invalid NEAR account ID format', 400, { code: 'INVALID_ACCOUNT_ID' });
    }

    const provider = new providers.JsonRpcProvider({ url: NEAR_RPC_URL });
    const account = await provider.query({
      request_type: 'view_account',
      finality: 'final',
      account_id: accountId,
    }) as unknown as { amount: string };

    const balanceInNear = String(Number(account.amount) / 1e24);

    return successResponse({
      balance: balanceInNear,
      balanceYocto: account.amount,
      accountId,
    });
  } catch (error: unknown) {
    logger.error('[NEAR_BALANCE_ERROR]', error);
    return errorResponse('Failed to fetch balance', 500);
  }
}
