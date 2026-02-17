import { NextRequest, NextResponse } from 'next/server';
import { intentsExplorer } from '@/lib/server/intentsExplorer';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ depositAddress: string }> }
) {
  try {
    const { depositAddress } = await params;

    if (!intentsExplorer.isConfigured()) {
      return NextResponse.json(
        { error: 'Transaction tracking not available' },
        { status: 503 }
      );
    }

    try {
      const transaction = await intentsExplorer.getTransactionByDepositAddress(depositAddress);
      if (transaction) {
        return NextResponse.json({
          depositAddress: transaction.depositAddress,
          status: transaction.status,
          originAsset: transaction.originAsset,
          destinationAsset: transaction.destinationAsset,
          amountIn: transaction.amountIn,
          amountOut: transaction.amountOut,
          recipient: transaction.recipient,
          refundTo: transaction.refundTo,
          depositTxHash: transaction.depositTxHash,
          fulfillmentTxHash: transaction.fulfillmentTxHash,
          refundTxHash: transaction.refundTxHash,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          referral: transaction.referral,
          affiliate: transaction.affiliate,
        });
      }
      return NextResponse.json(
        { error: 'Swap not found', depositAddress },
        { status: 404 }
      );
    } catch (explorerError: unknown) {
      const msg = explorerError instanceof Error ? explorerError.message : '';
      if (msg.includes('429') || msg.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Transaction not yet available', depositAddress },
          { status: 404 }
        );
      }
      throw explorerError;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch status', message }, { status: 500 });
  }
}
