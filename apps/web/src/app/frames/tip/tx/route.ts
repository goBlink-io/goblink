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
 * Supports same-chain and cross-chain (via 1Click) transfers.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const to = searchParams.get('to') || '';
  const amount = searchParams.get('amount') || '0';
  const token = (searchParams.get('token') || 'USDC').toUpperCase();
  const chain = searchParams.get('chain') || 'base';

  const sourceChain = searchParams.get('sourceChain') || 'base';
  const sourceToken = (searchParams.get('sourceToken') || token).toUpperCase();
  const destChain = searchParams.get('destChain') || chain;
  const destToken = (searchParams.get('destToken') || token).toUpperCase();
  const crossChain = searchParams.get('crossChain') === 'true';

  const isCrossChain = crossChain || sourceChain !== destChain || sourceToken !== destToken;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  if (isCrossChain) {
    // Parse refund address from Farcaster frame message
    let refundAddress = '';
    try {
      const body = await request.json();
      refundAddress = body?.untrustedData?.address || '';
    } catch { /* */ }

    if (!refundAddress) {
      return NextResponse.json({ error: 'Could not determine wallet address for refund' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://goblink.io';
    const quoteRes = await fetch(`${baseUrl}/api/frames/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceChain, sourceToken, destChain, destToken,
        amount, recipient: to, refundTo: refundAddress,
      }),
    });

    if (!quoteRes.ok) {
      const err = await quoteRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.error || 'Failed to get cross-chain quote' }, { status: 502 });
    }

    const quote = await quoteRes.json();
    const { depositAddress, sendAmount, sourceChainId } = quote;

    if (!depositAddress || !sendAmount) {
      return NextResponse.json({ error: 'Invalid quote response' }, { status: 502 });
    }

    const chainIdHex = `eip155:${sourceChainId}`;

    if (isNativeToken(sourceChain, sourceToken)) {
      return NextResponse.json({
        chainId: chainIdHex,
        method: 'eth_sendTransaction',
        params: { abi: [], to: depositAddress, value: `0x${BigInt(sendAmount).toString(16)}` },
      });
    }

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
        to: sourceTokenInfo.address, data, value: '0x0',
      },
    });
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
      to: tokenInfo.address, data, value: '0x0',
    },
  });
}
