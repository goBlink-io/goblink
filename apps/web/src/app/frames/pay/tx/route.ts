import { NextRequest, NextResponse } from 'next/server';
import {
  getChainId,
  getTokenInfo,
  isNativeToken,
  getNativeToken,
  encodeErc20Transfer,
  parseAmount,
  TOKEN_ADDRESSES,
} from '../../utils/frame-helpers';

/**
 * POST /frames/pay/tx — Farcaster transaction endpoint.
 * 
 * Two modes:
 * 1. Same-chain EVM: direct transfer (native or ERC20)
 * 2. Cross-chain via 1Click: get deposit address, send to it
 * 
 * Cross-chain is triggered when destChain differs from sourceChain,
 * or when destChain is non-EVM (solana, near, sui, etc.)
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const to = searchParams.get('to') || '';
  const amount = searchParams.get('amount') || '0';
  const token = (searchParams.get('token') || 'USDC').toUpperCase();
  const chain = searchParams.get('chain') || 'base';

  // Cross-chain params (optional — if present, use 1Click)
  const sourceChain = searchParams.get('sourceChain') || 'base';
  const sourceToken = (searchParams.get('sourceToken') || token).toUpperCase();
  const destChain = searchParams.get('destChain') || chain;
  const destToken = (searchParams.get('destToken') || token).toUpperCase();
  const crossChain = searchParams.get('crossChain') === 'true';

  // Determine if this is a cross-chain transfer
  const isCrossChain = crossChain || sourceChain !== destChain || sourceToken !== destToken;

  if (isCrossChain) {
    return handleCrossChain(request, { sourceChain, sourceToken, destChain, destToken, amount, to });
  }

  // ─── Same-chain direct transfer ───────────────────────────────────
  if (!to || !to.startsWith('0x')) {
    return NextResponse.json({ error: 'Invalid recipient address' }, { status: 400 });
  }

  const chainId = getChainId(chain);
  if (!chainId) {
    return NextResponse.json({ error: `Unsupported chain: ${chain}` }, { status: 400 });
  }

  const chainIdHex = `eip155:${chainId}`;

  if (isNativeToken(chain, token)) {
    const native = getNativeToken(chain)!;
    const value = parseAmount(amount, native.decimals);
    return NextResponse.json({
      chainId: chainIdHex,
      method: 'eth_sendTransaction',
      params: { abi: [], to, value: `0x${value.toString(16)}` },
    });
  }

  const tokenInfo = getTokenInfo(chain, token);
  if (!tokenInfo) {
    return NextResponse.json({ error: `Token ${token} not supported on ${chain}` }, { status: 400 });
  }

  const atomicAmount = parseAmount(amount, tokenInfo.decimals);
  const data = encodeErc20Transfer(to, atomicAmount);

  return NextResponse.json({
    chainId: chainIdHex,
    method: 'eth_sendTransaction',
    params: {
      abi: [{
        type: 'function', name: 'transfer',
        inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
      }],
      to: tokenInfo.address,
      data,
      value: '0x0',
    },
  });
}

// ─── Cross-chain via 1Click ─────────────────────────────────────────────────

interface CrossChainParams {
  sourceChain: string;
  sourceToken: string;
  destChain: string;
  destToken: string;
  amount: string;
  to: string;
}

async function handleCrossChain(request: NextRequest, params: CrossChainParams) {
  const { sourceChain, sourceToken, destChain, destToken, amount, to } = params;

  // Parse the Farcaster frame message to get the user's address for refund
  let refundAddress = '';
  try {
    const body = await request.json();
    refundAddress = body?.untrustedData?.address || '';
  } catch {
    // no body
  }

  if (!refundAddress) {
    // Fallback: we can't do cross-chain without a refund address
    return NextResponse.json({ error: 'Could not determine wallet address for refund' }, { status: 400 });
  }

  // Call our internal API to get a 1Click quote with deposit address
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://goblink.io';
  const quoteRes = await fetch(`${baseUrl}/api/frames/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceChain,
      sourceToken,
      destChain,
      destToken,
      amount,
      recipient: to,
      refundTo: refundAddress,
    }),
  });

  if (!quoteRes.ok) {
    const err = await quoteRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.error || 'Failed to get cross-chain quote' },
      { status: 502 },
    );
  }

  const quote = await quoteRes.json();
  const { depositAddress, sendAmount, sourceChainId } = quote;

  if (!depositAddress || !sendAmount) {
    return NextResponse.json({ error: 'Invalid quote response' }, { status: 502 });
  }

  const chainIdHex = `eip155:${sourceChainId}`;

  // Is the source token native (ETH, BNB, etc.)?
  const isNative = isNativeToken(sourceChain, sourceToken);

  if (isNative) {
    return NextResponse.json({
      chainId: chainIdHex,
      method: 'eth_sendTransaction',
      params: {
        abi: [],
        to: depositAddress,
        value: `0x${BigInt(sendAmount).toString(16)}`,
      },
    });
  }

  // ERC20 transfer to deposit address
  const sourceTokenInfo = TOKEN_ADDRESSES[sourceChain]?.[sourceToken];
  if (!sourceTokenInfo) {
    return NextResponse.json({ error: `Token ${sourceToken} not found on ${sourceChain}` }, { status: 400 });
  }

  const data = encodeErc20Transfer(depositAddress, BigInt(sendAmount));

  return NextResponse.json({
    chainId: chainIdHex,
    method: 'eth_sendTransaction',
    params: {
      abi: [{
        type: 'function', name: 'transfer',
        inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
      }],
      to: sourceTokenInfo.address,
      data,
      value: '0x0',
    },
  });
}
