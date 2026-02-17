import { NextRequest, NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';

export async function POST(request: NextRequest) {
  try {
    const { txHash, depositAddress } = await request.json();
    if (!txHash || !depositAddress) {
      return NextResponse.json({ error: 'txHash and depositAddress are required' }, { status: 400 });
    }
    try {
      const result = await oneclick.submitDeposit(txHash, depositAddress);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({
        success: true,
        message: 'Transaction will be tracked via Intents Explorer',
        txHash,
      });
    }
  } catch {
    return NextResponse.json({
      success: true,
      message: 'Transaction will be tracked via Intents Explorer',
    });
  }
}
