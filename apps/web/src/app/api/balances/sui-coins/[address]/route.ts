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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch Sui coins', message }, { status: 500 });
  }
}
