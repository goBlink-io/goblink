import { NextRequest, NextResponse } from 'next/server';
import { providers } from 'near-api-js';

const NEAR_RPC_URL = process.env.NEAR_RPC_URL || 'https://rpc.fastnear.com';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const provider = new providers.JsonRpcProvider({ url: NEAR_RPC_URL });
    const account = await provider.query({
      request_type: 'view_account', finality: 'final', account_id: accountId,
    }) as unknown as { amount: string };
    const balanceInNear = (Number(account.amount) / 1e24).toFixed(4);
    return NextResponse.json({ balance: balanceInNear, balanceYocto: account.amount, accountId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch balance', message }, { status: 500 });
  }
}
