import { NextRequest, NextResponse } from 'next/server';
import { getSuiAccountCoins } from '@/lib/server/sui';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const result = await getSuiAccountCoins(address);
    return NextResponse.json({ address, ...result });
  } catch (error: unknown) {
    console.error('[sui-coins]', error);
    return NextResponse.json({ error: 'Failed to fetch Sui coins' }, { status: 500 });
  }
}
