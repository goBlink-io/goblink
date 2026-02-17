import { NextRequest, NextResponse } from 'next/server';
import { getTokenBalance, getSupportedChains, type SupportedChain } from '@/lib/server/evm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chain: string; address: string }> }
) {
  try {
    const { chain, address } = await params;
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('tokenAddress');
    const decimals = searchParams.get('decimals');

    if (!tokenAddress) {
      return NextResponse.json({ error: 'tokenAddress is required' }, { status: 400 });
    }
    const supportedChains = getSupportedChains();
    if (!supportedChains.includes(chain)) {
      return NextResponse.json({ error: 'Unsupported chain', supportedChains }, { status: 400 });
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address) || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }
    const result = await getTokenBalance(
      chain as SupportedChain, address, tokenAddress, decimals ? parseInt(decimals) : undefined
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch token balance', message }, { status: 500 });
  }
}
