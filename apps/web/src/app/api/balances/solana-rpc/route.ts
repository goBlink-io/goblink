import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await axios.post(SOLANA_RPC_URL, body, {
      headers: { 'Content-Type': 'application/json' },
    });
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32000, message }, id: null },
      { status: 500 }
    );
  }
}
