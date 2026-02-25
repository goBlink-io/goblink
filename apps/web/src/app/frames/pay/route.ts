import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '../utils/frame-helpers';

/**
 * POST /frames/pay — Farcaster frame post_url handler.
 * Called after the user completes the transaction.
 * Returns a success frame image.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const to = searchParams.get('to') || '';
  const amount = searchParams.get('amount') || '0';
  const token = (searchParams.get('token') || 'USDC').toUpperCase();
  const chain = searchParams.get('chain') || 'base';
  const base = getBaseUrl();

  const imageUrl = `${base}/frames/image?type=pay&to=${encodeURIComponent(to)}&amount=${amount}&token=${token}&chain=${chain}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="Transaction sent!" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${base}" />
</head>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
