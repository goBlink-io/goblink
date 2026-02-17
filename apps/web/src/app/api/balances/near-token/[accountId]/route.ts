import { NextRequest, NextResponse } from 'next/server';
import { providers } from 'near-api-js';

const NEAR_RPC_URL = process.env.NEAR_RPC_URL || 'https://rpc.fastnear.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');
    const decimals = searchParams.get('decimals');

    if (!contractAddress || !decimals) {
      return NextResponse.json({ error: 'contractAddress and decimals are required' }, { status: 400 });
    }

    // Skip non-NEAR addresses
    if (contractAddress.startsWith('0x') || contractAddress.includes('::') ||
        /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contractAddress)) {
      return NextResponse.json({ balance: '0.00', balanceRaw: '0', accountId, contractAddress });
    }

    const isValidNear = contractAddress.endsWith('.near') || contractAddress.endsWith('.testnet') ||
      /^[a-f0-9]{64}$/.test(contractAddress);
    if (!isValidNear) {
      return NextResponse.json({ balance: '0.00', balanceRaw: '0', accountId, contractAddress });
    }

    const provider = new providers.JsonRpcProvider({ url: NEAR_RPC_URL });
    const result = await provider.query({
      request_type: 'call_function', finality: 'final',
      account_id: contractAddress,
      method_name: 'ft_balance_of',
      args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
    }) as unknown as { result: number[] };

    const balance = JSON.parse(Buffer.from(result.result).toString());
    const decimalsNum = parseInt(decimals);
    const balanceInTokens = (Number(balance) / Math.pow(10, decimalsNum)).toFixed(4);

    return NextResponse.json({ balance: balanceInTokens, balanceRaw: balance, accountId, contractAddress });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch token balance', message }, { status: 500 });
  }
}
