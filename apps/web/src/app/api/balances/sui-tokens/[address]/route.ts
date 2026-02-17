import { NextRequest, NextResponse } from 'next/server';
import { getSuiAccountTokens } from '@/lib/server/sui';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const tokens = await getSuiAccountTokens(address);
    return NextResponse.json({ address, tokens, count: tokens.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch Sui tokens', message }, { status: 500 });
  }
}
