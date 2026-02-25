import { NextRequest, NextResponse } from 'next/server';
import {
  getChainId,
  getTokenInfo,
  isNativeToken,
  getNativeToken,
  encodeErc20Transfer,
  parseAmount,
} from '../../utils/frame-helpers';

/**
 * POST /frames/pay/tx — Farcaster transaction endpoint.
 * Returns EVM calldata for the wallet to sign.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const to = searchParams.get('to') || '';
  const amount = searchParams.get('amount') || '0';
  const token = (searchParams.get('token') || 'USDC').toUpperCase();
  const chain = searchParams.get('chain') || 'base';

  if (!to || !to.startsWith('0x')) {
    return NextResponse.json({ error: 'Invalid recipient address' }, { status: 400 });
  }

  const chainId = getChainId(chain);
  if (!chainId) {
    return NextResponse.json({ error: `Unsupported chain: ${chain}` }, { status: 400 });
  }

  const chainIdHex = `eip155:${chainId}`;

  // Native token transfer (ETH, BNB, etc.)
  if (isNativeToken(chain, token)) {
    const native = getNativeToken(chain)!;
    const value = parseAmount(amount, native.decimals);

    return NextResponse.json({
      chainId: chainIdHex,
      method: 'eth_sendTransaction',
      params: {
        abi: [],
        to,
        value: `0x${value.toString(16)}`,
      },
    });
  }

  // ERC20 transfer
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
      abi: [
        {
          type: 'function',
          name: 'transfer',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
        },
      ],
      to: tokenInfo.address,
      data,
      value: '0x0',
    },
  });
}
