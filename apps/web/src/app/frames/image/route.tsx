import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { PayFrameImage, TipFrameImage } from '../components/FrameImage';
import { getChainDisplayName } from '../utils/frame-helpers';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') || 'pay';
  const to = searchParams.get('to') || '';
  const amount = searchParams.get('amount') || '0';
  const token = (searchParams.get('token') || 'USDC').toUpperCase();
  const chain = searchParams.get('chain') || 'base';
  const chainName = getChainDisplayName(chain);

  const element =
    type === 'tip' ? (
      <TipFrameImage to={to} token={token} chain={chainName} />
    ) : (
      <PayFrameImage to={to} amount={amount} token={token} chain={chainName} />
    );

  return new ImageResponse(element, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
