import { NextRequest, NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import { QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import * as fees from '@/lib/server/fees';
import { logger } from '@/lib/logger';

/**
 * POST /api/frames/quote
 * 
 * Server-side 1Click quote for Farcaster frames.
 * Takes user-friendly params (chain, token, amount, recipient)
 * and resolves them to 1Click asset IDs, gets a live quote with deposit address.
 * 
 * The source is always EVM (Farcaster wallet). The destination can be any chain.
 */

// Map our chain names → 1Click origin asset prefixes for common EVM tokens
// These are the defuseAssetId patterns used by 1Click
const EVM_ORIGIN_ASSETS: Record<string, Record<string, string>> = {
  base: {
    USDC: 'nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near',
    USDT: 'nep141:base-0xfde4c96c8593536e31f229ea8f37b2ada2699bb2.omft.near',
    DAI:  'nep141:base-0x50c5725949a6f0c72e6c4a641f24049a917db0cb.omft.near',
    ETH:  'nep141:base-0x0000000000000000000000000000000000000000.omft.near',
  },
  ethereum: {
    USDC: 'nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near',
    USDT: 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near',
    DAI:  'nep141:eth-0x6b175474e89094c44da98b954eedeac495271d0f.omft.near',
    ETH:  'nep141:eth.omft.near',
  },
  arbitrum: {
    USDC: 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near',
    USDT: 'nep141:arb-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.omft.near',
    DAI:  'nep141:arb-0xda10009cbd5d07dd0cecc66161fc93d7c9000da1.omft.near',
    ETH:  'nep141:arb-0x0000000000000000000000000000000000000000.omft.near',
  },
  optimism: {
    USDC: 'nep141:op-0x0b2c639c533813f4aa9d7837caf62653d097ff85.omft.near',
    USDT: 'nep141:op-0x94b008aa00579c1307b0ef2c499ad98a8ce58e58.omft.near',
    DAI:  'nep141:op-0xda10009cbd5d07dd0cecc66161fc93d7c9000da1.omft.near',
    ETH:  'nep141:op-0x0000000000000000000000000000000000000000.omft.near',
  },
  polygon: {
    USDC: 'nep141:pol-0x3c499c542cef5e3811e1192ce70d8cc03d5c3359.omft.near',
    USDT: 'nep141:pol-0xc2132d05d31c914a87c6611c10748aeb04b58e8f.omft.near',
    DAI:  'nep141:pol-0x8f3cf7ad23cd3cadbd9735aff958023239c6a063.omft.near',
    POL:  'nep141:pol-0x0000000000000000000000000000000000000000.omft.near',
  },
  bsc: {
    USDC: 'nep141:bsc-0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d.omft.near',
    USDT: 'nep141:bsc-0x55d398326f99059ff775485246999027b3197955.omft.near',
    DAI:  'nep141:bsc-0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3.omft.near',
    BNB:  'nep141:bsc-0x0000000000000000000000000000000000000000.omft.near',
  },
};

// Destination assets — maps chain+token to defuseAssetId
// For same-chain EVM, use the same map. For non-EVM, define separately.
const DESTINATION_ASSETS: Record<string, Record<string, string>> = {
  ...EVM_ORIGIN_ASSETS,
  near: {
    NEAR: 'nep141:wrap.near',
    USDC: 'nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near',
    USDT: 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near',
  },
  solana: {
    SOL:  'nep141:sol.omft.near',
    USDC: 'nep141:sol-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.omft.near',
    USDT: 'nep141:sol-Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB.omft.near',
  },
  sui: {
    SUI:  'nep141:sui.omft.near',
    USDC: 'nep141:sui-0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC.omft.near',
  },
  aptos: {
    APT:  'nep141:aptos.omft.near',
  },
  tron: {
    TRX:  'nep141:tron-0x0000000000000000000000000000000000000000.omft.near',
    USDT: 'nep141:tron-TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t.omft.near',
  },
};

// Token decimals for amount conversion
const TOKEN_DECIMALS: Record<string, number> = {
  USDC: 6, USDT: 6, DAI: 18, ETH: 18, BNB: 18, POL: 18,
  NEAR: 24, SOL: 9, SUI: 9, APT: 8, TRX: 6, AVAX: 18,
};

// EVM chain IDs for the source chain
const CHAIN_IDS: Record<string, number> = {
  ethereum: 1, base: 8453, arbitrum: 42161, polygon: 137,
  optimism: 10, bsc: 56,
};

function parseAmount(amount: string, decimals: number): string {
  const parts = amount.split('.');
  const whole = parts[0] || '0';
  const fraction = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
  return (BigInt(whole) * BigInt(10 ** decimals) + BigInt(fraction)).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sourceChain,  // EVM chain the Farcaster user pays from (e.g. "base")
      sourceToken,  // Token they pay with (e.g. "USDC")
      destChain,    // Destination chain (e.g. "solana", "near", "base")
      destToken,    // Destination token (e.g. "SOL", "USDC")
      amount,       // Human-readable amount (e.g. "10")
      recipient,    // Recipient address on destination chain
      refundTo,     // Refund address on source chain (Farcaster wallet)
    } = body;

    if (!sourceChain || !sourceToken || !destChain || !destToken || !amount || !recipient || !refundTo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Resolve 1Click asset IDs
    const originAsset = EVM_ORIGIN_ASSETS[sourceChain]?.[sourceToken.toUpperCase()];
    const destinationAsset = DESTINATION_ASSETS[destChain]?.[destToken.toUpperCase()];

    if (!originAsset) {
      return NextResponse.json({ error: `Unsupported source: ${sourceToken} on ${sourceChain}` }, { status: 400 });
    }
    if (!destinationAsset) {
      return NextResponse.json({ error: `Unsupported destination: ${destToken} on ${destChain}` }, { status: 400 });
    }

    // Parse amount to atomic units using DESTINATION token decimals (EXACT_OUTPUT)
    const destDecimals = TOKEN_DECIMALS[destToken.toUpperCase()] ?? 6;
    const atomicAmount = parseAmount(amount, destDecimals);

    // Calculate fee
    const feeBps = fees.calculateEffectiveFeeBps(undefined); // We don't have USD estimate in frame context
    const feeRecipient = fees.getFeeRecipient();

    const quoteRequest: QuoteRequest = {
      dry: false, // We need a real deposit address
      originAsset,
      destinationAsset,
      amount: atomicAmount,
      recipient,
      refundTo,
      swapType: QuoteRequest.swapType.EXACT_OUTPUT,
      slippageTolerance: 300, // 3% — generous for frames (user can't adjust)
      deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
      appFees: [{ recipient: feeRecipient, fee: feeBps }],
    };

    const quote = await oneclick.getQuote(quoteRequest);
    const q = quote as Record<string, unknown>;

    // Extract deposit address and amount to send
    const depositAddress = q.depositAddress || (q.quote as Record<string, unknown>)?.depositAddress;
    const amountIn = (q.quote as Record<string, unknown>)?.amountIn || q.amountIn;
    const maxAmountIn = (q.quote as Record<string, unknown>)?.maxAmountIn || q.maxAmountIn;

    if (!depositAddress) {
      return NextResponse.json({ error: 'No deposit address returned' }, { status: 502 });
    }

    // For EXACT_OUTPUT: add fee on top of amountIn
    let sendAmount = maxAmountIn || amountIn;
    if (feeBps > 0 && sendAmount) {
      try {
        const base = BigInt(sendAmount as string);
        sendAmount = ((base * BigInt(10000 + feeBps)) / BigInt(10000)).toString();
      } catch {
        // keep original
      }
    }

    // Get source token decimals for the EVM calldata
    const sourceDecimals = TOKEN_DECIMALS[sourceToken.toUpperCase()] ?? 6;
    const sourceChainId = CHAIN_IDS[sourceChain];

    return NextResponse.json({
      depositAddress,
      sendAmount,
      sourceChainId,
      sourceDecimals,
      sourceToken: sourceToken.toUpperCase(),
      originAsset,
      destinationAsset,
      feeBps,
    });
  } catch (error: unknown) {
    logger.error('[FRAME_QUOTE_ERROR]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to get quote', details: message }, { status: 500 });
  }
}
