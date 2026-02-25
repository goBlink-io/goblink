import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '../../utils/frame-helpers';

/**
 * POST /frames/tip/post — Farcaster frame post_url handler.
 * Handles two flows:
 * 1. step=custom — show text input for custom amount, then redirect to tx
 * 2. default — post-transaction success confirmation
 * 
 * Supports cross-chain params (sourceChain, sourceToken, destChain, destToken, crossChain).
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const to = searchParams.get('to') || '';
  const token = (searchParams.get('token') || 'USDC').toUpperCase();
  const chain = searchParams.get('chain') || 'base';
  const step = searchParams.get('step') || '';
  const base = getBaseUrl();

  // Cross-chain params (pass-through)
  const sourceChain = searchParams.get('sourceChain') || '';
  const sourceToken = searchParams.get('sourceToken') || '';
  const destChain = searchParams.get('destChain') || '';
  const destToken = searchParams.get('destToken') || '';
  const crossChain = searchParams.get('crossChain') || '';

  // Build cross-chain suffix for URLs
  const ccParams = crossChain === 'true'
    ? `&sourceChain=${sourceChain}&sourceToken=${sourceToken}&destChain=${destChain}&destToken=${destToken}&crossChain=true`
    : '';

  const imageUrl = `${base}/frames/image?type=tip&to=${encodeURIComponent(to)}&token=${token}&chain=${chain}`;

  if (step === 'custom') {
    let inputText = '';
    try {
      const body = await request.json();
      inputText = body?.untrustedData?.inputText || '';
    } catch { /* */ }

    if (inputText && !isNaN(Number(inputText)) && Number(inputText) > 0) {
      const txTarget = `${base}/frames/tip/tx?to=${encodeURIComponent(to)}&amount=${inputText}&token=${token}&chain=${chain}${ccParams}`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="Send $${inputText} ${token}" />
  <meta property="fc:frame:button:1:action" content="tx" />
  <meta property="fc:frame:button:1:target" content="${txTarget}" />
  <meta property="fc:frame:post_url" content="${base}/frames/tip/post?to=${encodeURIComponent(to)}&token=${token}&chain=${chain}${ccParams}" />
</head>
</html>`;
      return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    const customPostUrl = `${base}/frames/tip/post?to=${encodeURIComponent(to)}&token=${token}&chain=${chain}&step=custom${ccParams}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:input:text" content="Enter amount in ${token}" />
  <meta property="fc:frame:button:1" content="Send Tip" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:1:target" content="${customPostUrl}" />
  <meta property="fc:frame:post_url" content="${customPostUrl}" />
</head>
</html>`;
    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
  }

  // Default: success confirmation
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="Tip sent!" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${base}" />
</head>
</html>`;
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}
