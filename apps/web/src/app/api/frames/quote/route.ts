import { NextRequest, NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import { QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import * as fees from '@/lib/server/fees';
import { logger } from '@/lib/logger';

/**
 * POST /api/frames/quote
 * 
 * Server-side 1Click quote for Farcaster frames.
 * Accepts defuseAssetIds directly (resolved by the frame builder UI)
 * or resolves from chain+token symbol using the 1Click token list.
 * 
 * Full cross-chain: any supported chain → any supported chain.
 */

// Cache token list for resolution
let tokenCache: Array<Record<string, unknown>> = [];
let tokenCacheTimestamp = 0;
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedTokens() {
  if (Date.now() - tokenCacheTimestamp < TOKEN_CACHE_TTL && tokenCache.length > 0) {
    return tokenCache;
  }
  try {
    const tokens = await oneclick.getTokens() as Array<Record<string, unknown>>;
    tokenCache = tokens;
    tokenCacheTimestamp = Date.now();
    return tokens;
  } catch (err) {
    logger.error('Failed to fetch tokens for frame quote:', err);
    return tokenCache; // return stale on error
  }
}

/**
 * Resolve a defuseAssetId from either:
 * 1. Direct defuseAssetId passed in (preferred)
 * 2. Symbol + blockchain lookup from 1Click token list
 */
async function resolveAssetId(
  defuseAssetId?: string,
  symbol?: string,
  blockchain?: string,
): Promise<{ assetId: string; decimals: number } | null> {
  // If defuseAssetId is already a nep141/nep245/1cs_v1 ID, use it directly
  if (defuseAssetId && (defuseAssetId.startsWith('nep141:') || defuseAssetId.startsWith('nep245:') || defuseAssetId.startsWith('1cs_v1:'))) {
    // Look up decimals from token list
    const tokens = await getCachedTokens();
    const match = tokens.find(t => t.assetId === defuseAssetId);
    return { assetId: defuseAssetId, decimals: (match?.decimals as number) ?? 6 };
  }

  // Fallback: resolve from symbol + blockchain
  if (!symbol || !blockchain) return null;

  const tokens = await getCachedTokens();
  
  // Find matching token — prefer exact blockchain match
  const match = tokens.find(t => {
    const tSymbol = (t.symbol as string || '').toUpperCase();
    const tBlockchain = (t.blockchain as string || '').toLowerCase();
    return tSymbol === symbol.toUpperCase() && tBlockchain === blockchain.toLowerCase();
  });

  if (match) {
    return { assetId: match.assetId as string, decimals: (match.decimals as number) ?? 6 };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sourceChain,
      sourceToken,
      sourceAssetId,   // defuseAssetId from frame builder
      destChain,
      destToken,
      destAssetId,     // defuseAssetId from frame builder
      sourceDecimals,
      destDecimals,
      amount,
      recipient,
      refundTo,
    } = body;

    if (!amount || !recipient || !refundTo) {
      return NextResponse.json({ error: 'Missing required fields: amount, recipient, refundTo' }, { status: 400 });
    }

    // Resolve origin asset
    const origin = await resolveAssetId(sourceAssetId, sourceToken, sourceChain);
    if (!origin) {
      return NextResponse.json({ error: `Cannot resolve source token: ${sourceToken} on ${sourceChain}` }, { status: 400 });
    }

    // Resolve destination asset
    const dest = await resolveAssetId(destAssetId, destToken, destChain);
    if (!dest) {
      return NextResponse.json({ error: `Cannot resolve destination token: ${destToken} on ${destChain}` }, { status: 400 });
    }

    // Parse amount to atomic units using destination token decimals
    const decimals = destDecimals ?? dest.decimals;
    const atomicAmount = parseAmount(amount, decimals);

    // Calculate fee
    const feeBps = fees.calculateEffectiveFeeBps(undefined);
    const feeRecipient = fees.getFeeRecipient();

    const quoteRequest: QuoteRequest = {
      dry: false,
      originAsset: origin.assetId,
      destinationAsset: dest.assetId,
      amount: atomicAmount,
      recipient,
      refundTo,
      swapType: QuoteRequest.swapType.EXACT_OUTPUT,
      slippageTolerance: 300, // 3% for frames
      deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
      appFees: [{ recipient: feeRecipient, fee: feeBps }],
    };

    const quote = await oneclick.getQuote(quoteRequest);
    const q = quote as Record<string, unknown>;

    const depositAddress = q.depositAddress || (q.quote as Record<string, unknown>)?.depositAddress;
    const amountIn = (q.quote as Record<string, unknown>)?.amountIn || q.amountIn;
    const maxAmountIn = (q.quote as Record<string, unknown>)?.maxAmountIn || q.maxAmountIn;

    if (!depositAddress) {
      return NextResponse.json({ error: 'No deposit address returned from 1Click' }, { status: 502 });
    }

    // The fee is already included via appFees in the quote request —
    // do NOT add it again on top of sendAmount (that would double-charge).
    const sendAmount = maxAmountIn || amountIn;

    return NextResponse.json({
      depositAddress,
      sendAmount,
      originAsset: origin.assetId,
      destinationAsset: dest.assetId,
      sourceDecimals: sourceDecimals ?? origin.decimals,
      destDecimals: decimals,
      feeBps,
    });
  } catch (error: unknown) {
    logger.error('[FRAME_QUOTE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to get quote' }, { status: 500 });
  }
}

function parseAmount(amount: string, decimals: number): string {
  const parts = amount.split('.');
  const whole = parts[0] || '0';
  const fraction = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
  return (BigInt(whole) * (10n ** BigInt(decimals)) + BigInt(fraction)).toString();
}
