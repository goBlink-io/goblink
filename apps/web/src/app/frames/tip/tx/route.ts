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
 * POST /frames/tip/tx — Farcaster transaction endpoint for tips.
 * Same logic as pay/tx — routes through 1Click for cross-chain.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const to = searchParams.get('to') || '';
  const amount = searchParams.get('amount') || '0';

  const sourceChain = searchParams.get('sourceChain') || searchParams.get('chain') || 'base';
  const sourceToken = searchParams.get('sourceToken') || searchParams.get('token') || 'USDC';
  const destChain = searchParams.get('destChain') || searchParams.get('chain') || 'base';
  const destToken = searchParams.get('destToken') || searchParams.get('token') || 'USDC';
  const sourceAssetId = searchParams.get('sourceAssetId') || '';
  const destAssetId = searchParams.get('destAssetId') || '';
  const crossChain = searchParams.get('crossChain') === 'true';

  const isCrossChain = crossChain || sourceChain !== destChain || sourceToken !== destToken;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // ─── Cross-chain via 1Click ─────────────────────────────────────
  if (isCrossChain) {
    let refundAddress = '';
    try {
      const body = await request.json();
      refundAddress = body?.untrustedData?.address || '';
    } catch { /* */ }

    if (!refundAddress) {
      return NextResponse.json({ error: 'Could not determine wallet address' }, { status: 400 });
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
      return NextResponse.json({ error: err.error || 'Cross-chain quote failed' }, { status: 502 });
    }

    const quote = await quoteRes.json();
    const { depositAddress, sendAmount } = quote;

    if (!depositAddress || !sendAmount) {
      return NextResponse.json({ error: 'Invalid quote — no deposit address' }, { status: 502 });
    }

    const chainId = getChainId(sourceChain);
    if (!chainId) {
      return NextResponse.json({ error: `Source chain ${sourceChain} not supported in Farcaster Frames (EVM only)` }, { status: 400 });
    }

    const chainIdHex = `eip155:${chainId}`;

    if (isNativeToken(sourceChain, sourceToken)) {
      return NextResponse.json({
        chainId: chainIdHex,
        method: 'eth_sendTransaction',
        params: { abi: [], to: depositAddress, value: `0x${BigInt(sendAmount).toString(16)}` },
      });
    }

    const tokenInfo = TOKEN_ADDRESSES[sourceChain]?.[sourceToken.toUpperCase()];
    if (!tokenInfo) {
      return NextResponse.json({ error: `Token ${sourceToken} address unknown on ${sourceChain}` }, { status: 400 });
    }

    const data = encodeErc20Transfer(depositAddress, BigInt(sendAmount));
    return NextResponse.json({
      chainId: chainIdHex,
      method: 'eth_sendTransaction',
      params: {
        abi: [{ type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' }],
        to: tokenInfo.address, data, value: '0x0',
      },
    });
  }

  // ─── Same-chain direct transfer ─────────────────────────────────
  if (!to || !to.startsWith('0x')) {
    return NextResponse.json({ error: 'Invalid recipient address' }, { status: 400 });
  }

  const chainId = getChainId(sourceChain);
  if (!chainId) {
    return NextResponse.json({ error: `Unsupported chain: ${sourceChain}` }, { status: 400 });
  }

  const chainIdHex = `eip155:${chainId}`;

  if (isNativeToken(sourceChain, sourceToken)) {
    const native = getNativeToken(sourceChain)!;
    const value = parseAmount(amount, native.decimals);
    return NextResponse.json({
      chainId: chainIdHex,
      method: 'eth_sendTransaction',
      params: { abi: [], to, value: `0x${value.toString(16)}` },
    });
  }

  const tokenInfo = getTokenInfo(sourceChain, sourceToken);
  if (!tokenInfo) {
    return NextResponse.json({ error: `Token ${sourceToken} not supported on ${sourceChain}` }, { status: 400 });
  }

  const atomicAmount = parseAmount(amount, tokenInfo.decimals);
  const data = encodeErc20Transfer(to, atomicAmount);

  return NextResponse.json({
    chainId: chainIdHex,
    method: 'eth_sendTransaction',
    params: {
      abi: [{ type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' }],
      to: tokenInfo.address, data, value: '0x0',
    },
  });
}
