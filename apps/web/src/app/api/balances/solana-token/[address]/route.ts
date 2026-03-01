import { NextRequest } from 'next/server';
import axios from 'axios';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidSolanaAddress } from '@/lib/validators';
import { logger } from '@/lib/logger';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const REQUEST_TIMEOUT = 10000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const mint = new URL(request.url).searchParams.get('mint');

    if (!isValidSolanaAddress(address)) {
      return errorResponse('Invalid Solana address format', 400, { code: 'INVALID_ADDRESS' });
    }

    if (!mint) {
      return errorResponse('mint query parameter is required', 400, { code: 'MISSING_MINT' });
    }

    if (!isValidSolanaAddress(mint)) {
      return errorResponse('Invalid mint address format', 400, { code: 'INVALID_MINT' });
    }

    const response = await axios.post(
      SOLANA_RPC_URL,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          address,
          { mint },
          { encoding: 'jsonParsed' },
        ],
      },
      {
        timeout: REQUEST_TIMEOUT,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      }
    );

    const accounts = response.data?.result?.value ?? [];

    if (accounts.length === 0) {
      return successResponse({ balance: '0.00', address, mint });
    }

    // Sum across all token accounts for this mint (wallet may have multiple)
    let totalRaw = 0;
    let decimals = 0;
    for (const account of accounts) {
      const tokenAmount = account.account?.data?.parsed?.info?.tokenAmount;
      if (tokenAmount) {
        totalRaw += Number(tokenAmount.amount || 0);
        decimals = tokenAmount.decimals ?? decimals;
      }
    }

    const balance = decimals > 0
      ? String(totalRaw / Math.pow(10, decimals))
      : String(totalRaw);

    return successResponse({ balance, address, mint });
  } catch (error: unknown) {
    logger.error('[SOLANA_TOKEN_BALANCE_ERROR]', error);
    // Return 0.00 gracefully on RPC failures (rate limits, timeouts, etc.)
    // SPL tokens route to manual deposit anyway, so a 0 balance is safe for UI
    return successResponse({ balance: '0.00', address: '', mint: '' });
  }
}
