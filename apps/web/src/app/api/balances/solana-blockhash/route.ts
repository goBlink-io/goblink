import { NextResponse } from 'next/server';
import axios from 'axios';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export async function GET() {
  try {
    const response = await axios.post(SOLANA_RPC_URL, {
      jsonrpc: '2.0', id: 1, method: 'getLatestBlockhash',
      params: [{ commitment: 'confirmed' }],
    });
    const blockhash = response.data?.result?.value?.blockhash;
    const lastValidBlockHeight = response.data?.result?.value?.lastValidBlockHeight;
    if (!blockhash) throw new Error('No blockhash returned from Solana RPC');
    return NextResponse.json({ blockhash, lastValidBlockHeight });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch Solana blockhash', message }, { status: 500 });
  }
}
