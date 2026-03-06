import { NextRequest } from 'next/server';
import axios from 'axios';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidSolanaAddress } from '@/lib/validators';
import { logger } from '@/lib/logger';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const REQUEST_TIMEOUT = 10000; // 10 seconds

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Validate Solana address format
    if (!isValidSolanaAddress(address)) {
      return errorResponse('Invalid Solana address format', 400, { code: 'INVALID_ADDRESS' });
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

    return successResponse({
      balance: balanceInSol,
      balanceLamports: lamports.toString(),
      address,
    });
  } catch (error: unknown) {
    logger.error('[SOLANA_BALANCE_ERROR]', error);
    return errorResponse('Failed to fetch SOL balance', 500);
  }
}
