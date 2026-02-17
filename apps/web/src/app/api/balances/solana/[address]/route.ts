import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const response = await axios.post(SOLANA_RPC_URL, {
      jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address],
    });
    const lamports = response.data?.result?.value || 0;
    const balanceInSol = (lamports / 1e9).toFixed(4);
    return NextResponse.json({ balance: balanceInSol, balanceLamports: lamports.toString(), address });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch SOL balance', message }, { status: 500 });
  }
}
