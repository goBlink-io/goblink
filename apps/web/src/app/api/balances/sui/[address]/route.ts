import { NextRequest, NextResponse } from 'next/server';
import { getSuiBalance } from '@/lib/server/sui';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const result = await getSuiBalance(address);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch SUI balance', message }, { status: 500 });
  }
}
