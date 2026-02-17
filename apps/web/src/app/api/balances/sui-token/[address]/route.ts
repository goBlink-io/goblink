import { NextRequest, NextResponse } from 'next/server';
import { getSuiTokenBalance } from '@/lib/server/sui';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const coinType = new URL(request.url).searchParams.get('coinType');
    if (!coinType) {
      return NextResponse.json({ error: 'coinType query parameter is required' }, { status: 400 });
    }
    const result = await getSuiTokenBalance(address, coinType);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch Sui token balance', message }, { status: 500 });
  }
}
