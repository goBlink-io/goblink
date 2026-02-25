import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '../../utils/frame-helpers';

/**
 * POST /frames/tip/post — Farcaster frame post_url handler.
 * Handles custom amount input flow and success confirmation.
 * Passes through ALL URL params to preserve cross-chain context.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const to = searchParams.get('to') || '';
  const token = searchParams.get('destToken') || searchParams.get('token') || 'USDC';
  const chain = searchParams.get('destChain') || searchParams.get('chain') || 'base';
  const step = searchParams.get('step') || '';
  const base = getBaseUrl();

  // Preserve all params for pass-through
  const allParams = new URLSearchParams();
  searchParams.forEach((v, k) => { if (k !== 'step' && k !== 'amount') allParams.set(k, v); });
  const paramStr = allParams.toString();

  const imageUrl = `${base}/frames/image?type=tip&to=${encodeURIComponent(to)}&token=${token}&chain=${chain}`;

  if (step === 'custom') {
    let inputText = '';
    try {
      const body = await request.json();
      inputText = body?.untrustedData?.inputText || '';
    } catch { /* */ }

    if (inputText && !isNaN(Number(inputText)) && Number(inputText) > 0) {
      const txParams = new URLSearchParams(allParams);
      txParams.set('amount', inputText);
      const txTarget = `${base}/frames/tip/tx?${txParams.toString()}`;

      const html = `<!DOCTYPE html>
<html><head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="Send $${inputText} ${token}" />
  <meta property="fc:frame:button:1:action" content="tx" />
  <meta property="fc:frame:button:1:target" content="${txTarget}" />
  <meta property="fc:frame:post_url" content="${base}/frames/tip/post?${paramStr}" />
</head></html>`;
      return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    const customPostUrl = `${base}/frames/tip/post?${paramStr}&step=custom`;
    const html = `<!DOCTYPE html>
<html><head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:input:text" content="Enter amount in ${token}" />
  <meta property="fc:frame:button:1" content="Send Tip" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:1:target" content="${customPostUrl}" />
  <meta property="fc:frame:post_url" content="${customPostUrl}" />
</head></html>`;
    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
  }

  // Success confirmation
  const html = `<!DOCTYPE html>
<html><head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="Tip sent!" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${base}" />
</head></html>`;
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}
