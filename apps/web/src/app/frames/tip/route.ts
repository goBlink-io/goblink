import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '../utils/frame-helpers';

/**
 * POST /frames/tip — Farcaster frame post_url handler.
 * Handles two flows:
 * 1. step=custom — show text input for custom amount, then redirect to tx
 * 2. default — post-transaction success confirmation
 */
export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const to = searchParams.get('to') || '';
  const token = (searchParams.get('token') || 'USDC').toUpperCase();
  const chain = searchParams.get('chain') || 'base';
  const step = searchParams.get('step') || '';
  const base = getBaseUrl();

  const imageUrl = `${base}/frames/image?type=tip&to=${encodeURIComponent(to)}&token=${token}&chain=${chain}`;

  // Custom amount flow: show input field, then send tx
  if (step === 'custom') {
    // Parse the frame message to get input text
    let inputText = '';
    try {
      const body = await request.json();
      inputText = body?.untrustedData?.inputText || '';
    } catch {
      // no body or invalid JSON
    }

    if (inputText && !isNaN(Number(inputText)) && Number(inputText) > 0) {
      // User entered a valid amount — redirect to tx endpoint
      const txTarget = `${base}/frames/tip/tx?to=${encodeURIComponent(to)}&amount=${inputText}&token=${token}&chain=${chain}`;

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${imageUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="Send $${inputText} ${token}" />
  <meta property="fc:frame:button:1:action" content="tx" />
  <meta property="fc:frame:button:1:target" content="${txTarget}" />
  <meta property="fc:frame:post_url" content="${base}/frames/tip?to=${encodeURIComponent(to)}&token=${token}&chain=${chain}" />
</head>
</html>`;

      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // No amount yet — show input prompt
    const customPostUrl = `${base}/frames/tip?to=${encodeURIComponent(to)}&token=${token}&chain=${chain}&step=custom`;

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

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Default: post-transaction success
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

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
