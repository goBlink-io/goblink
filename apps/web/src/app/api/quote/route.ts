import { NextRequest, NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import { QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import * as fees from '@/lib/server/fees';

const NATIVE_TO_NEP141_MAP: Record<string, string> = {
  'sui:0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI': 'nep141:sui.omft.near',
  'solana:native': 'nep141:sol.omft.near',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dry, originAsset, destinationAsset, amount, recipient, refundTo, swapType, slippageTolerance, deadline } = body;

    if (!originAsset || !destinationAsset || !amount || !recipient || !refundTo) {
      return NextResponse.json(
        { error: 'Missing required fields: originAsset, destinationAsset, amount, recipient, refundTo' },
        { status: 400 }
      );
    }

    const resolvedOriginAsset = NATIVE_TO_NEP141_MAP[originAsset] || originAsset;
    const resolvedDestinationAsset = NATIVE_TO_NEP141_MAP[destinationAsset] || destinationAsset;

    const feeBps = fees.calculateFeeBps();
    const feeRecipient = fees.getFeeRecipient();

    const quoteRequest: QuoteRequest = {
      dry: dry ?? true,
      originAsset: resolvedOriginAsset,
      destinationAsset: resolvedDestinationAsset,
      amount,
      recipient,
      refundTo,
      swapType: swapType ?? QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: slippageTolerance ?? 100,
      deadline: deadline ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
      appFees: [{ recipient: feeRecipient, fee: feeBps }],
    };

    const quote = await oneclick.getQuote(quoteRequest);
    return NextResponse.json(quote);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    let statusCode = 500;
    if (message.includes('refundTo') || message.includes('recipient') || message.includes('amount') || message.includes('asset')) {
      statusCode = 400;
    } else if (message.includes('timeout') || message.includes('network')) {
      statusCode = 503;
    }
    return NextResponse.json({ error: 'Failed to get quote', message }, { status: statusCode });
  }
}
