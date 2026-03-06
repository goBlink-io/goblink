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
    console.error('[sui-tokens]', error);
    return NextResponse.json({ error: 'Failed to fetch Sui tokens' }, { status: 500 });
  }
}
