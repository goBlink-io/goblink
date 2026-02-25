import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { PayFrameImage, TipFrameImage, SendFrameImage } from '../components/FrameImage';
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

  let element;

  if (type === 'tip') {
    element = <TipFrameImage to={to} token={token} chain={chainName} />;
  } else if (type === 'send') {
    const step = searchParams.get('step') || 'source-chain';
    const sourceChain = searchParams.get('sourceChain') || '';
    const sourceToken = searchParams.get('sourceToken') || '';
    const destChain = searchParams.get('destChain') || '';
    const destToken = searchParams.get('destToken') || '';
    const sendAmount = searchParams.get('amount') || '';
    const sendTo = searchParams.get('to') || '';

    element = (
      <SendFrameImage
        step={step}
        sourceChain={sourceChain ? getChainDisplayName(sourceChain) : ''}
        sourceToken={sourceToken}
        destChain={destChain ? getChainDisplayName(destChain) : ''}
        destToken={destToken}
        amount={sendAmount}
        to={sendTo}
      />
    );
  } else {
    element = <PayFrameImage to={to} amount={amount} token={token} chain={chainName} />;
  }

  return new ImageResponse(element, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
