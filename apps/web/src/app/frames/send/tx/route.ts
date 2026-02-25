import { NextRequest, NextResponse } from 'next/server';
import {
  getChainId,
  getTokenInfo,
  isNativeToken,
  getNativeToken,
  encodeErc20Transfer,
  parseAmount,
  TOKEN_ADDRESSES,
  ERC20_TRANSFER_ABI,
} from '../../utils/frame-helpers';

/**
 * POST /frames/send/tx — Transaction endpoint for the Send frame wizard.
 * Always routes through 1Click (full swap = always cross-chain).
 * Falls back to direct transfer only when same chain + same token.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const to = searchParams.get('to') || '';
  const amount = searchParams.get('amount') || '0';
  const sourceChain = searchParams.get('sourceChain') || 'base';
  const sourceToken = (searchParams.get('sourceToken') || 'USDC').toUpperCase();
  const destChain = searchParams.get('destChain') || 'base';
  const destToken = (searchParams.get('destToken') || 'USDC').toUpperCase();
  const sourceAssetId = searchParams.get('sourceAssetId') || '';
  const destAssetId = searchParams.get('destAssetId') || '';

  if (!to || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Missing or invalid amount / recipient' }, { status: 400 });
  }

  const isSameChainToken = sourceChain === destChain && sourceToken === destToken;

  // ─── Same chain + token → direct transfer ────────────────────────
  if (isSameChainToken && to.startsWith('0x')) {
    const chainId = getChainId(sourceChain);
    if (!chainId) {
      return NextResponse.json({ error: `Unsupported EVM chain: ${sourceChain}` }, { status: 400 });
    }
    const chainIdHex = `eip155:${chainId}`;

    if (isNativeToken(sourceChain, sourceToken)) {
      const native = getNativeToken(sourceChain)!;
      const value = parseAmount(amount, native.decimals);
      return NextResponse.json({ chainId: chainIdHex, method: 'eth_sendTransaction', params: { abi: [], to, value: `0x${value.toString(16)}` } });
    }

    const tokenInfo = getTokenInfo(sourceChain, sourceToken);
    if (!tokenInfo) {
      return NextResponse.json({ error: `Token ${sourceToken} not found on ${sourceChain}` }, { status: 400 });
    }
    const atomicAmount = parseAmount(amount, tokenInfo.decimals);
    const data = encodeErc20Transfer(to, atomicAmount);
    return NextResponse.json({ chainId: chainIdHex, method: 'eth_sendTransaction', params: { abi: ERC20_TRANSFER_ABI, to: tokenInfo.address, data, value: '0x0' } });
  }

  // ─── Cross-chain via 1Click ───────────────────────────────────────
  let refundAddress = '';
  try {
    const body = await request.json();
    refundAddress = body?.untrustedData?.address || '';
  } catch { /* */ }

  if (!refundAddress) {
    return NextResponse.json({ error: 'Could not determine payer wallet address' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://goblink.io';
  const quoteRes = await fetch(`${baseUrl}/api/frames/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceChain, sourceToken, sourceAssetId,
      destChain, destToken, destAssetId,
      sourceDecimals: searchParams.get('sourceDecimals'),
      destDecimals: searchParams.get('destDecimals'),
      amount,
      recipient: to,
      refundTo: refundAddress,
    }),
  });

  if (!quoteRes.ok) {
    const err = await quoteRes.json().catch(() => ({}));
    return NextResponse.json({ error: err.error || 'Quote failed' }, { status: 502 });
  }

  const quote = await quoteRes.json();
  const { depositAddress, sendAmount } = quote;

  if (!depositAddress || !sendAmount) {
    return NextResponse.json({ error: 'No deposit address — quote failed' }, { status: 502 });
  }

  const chainId = getChainId(sourceChain);
  if (!chainId) {
    return NextResponse.json({ error: `Source chain ${sourceChain} is not EVM — Farcaster Frames v1 requires EVM signing` }, { status: 400 });
  }
  const chainIdHex = `eip155:${chainId}`;

  if (isNativeToken(sourceChain, sourceToken)) {
    return NextResponse.json({ chainId: chainIdHex, method: 'eth_sendTransaction', params: { abi: [], to: depositAddress, value: `0x${BigInt(sendAmount).toString(16)}` } });
  }

  const tokenInfo = TOKEN_ADDRESSES[sourceChain]?.[sourceToken];
  if (!tokenInfo) {
    return NextResponse.json({ error: `Token ${sourceToken} address unknown on ${sourceChain}` }, { status: 400 });
  }

  const data = encodeErc20Transfer(depositAddress, BigInt(sendAmount));
  return NextResponse.json({ chainId: chainIdHex, method: 'eth_sendTransaction', params: { abi: ERC20_TRANSFER_ABI, to: tokenInfo.address, data, value: '0x0' } });
}
