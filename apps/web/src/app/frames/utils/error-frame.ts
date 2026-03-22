import { NextResponse } from 'next/server';
import { getBaseUrl } from './frame-helpers';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Return a proper Farcaster frame for error states instead of raw JSON.
 * The user sees a branded error card with a retry/start-over button.
 */
export function errorFrame(message: string, retryTarget?: string): NextResponse {
  const base = getBaseUrl();
  const safeMessage = escapeHtml(message);
  const imageUrl = `${base}/frames/image?type=send&step=error&message=${encodeURIComponent(safeMessage)}`;
  const target = retryTarget || `${base}/frames/send/post?step=start`;

  const html = `<!DOCTYPE html><html><head>
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="${imageUrl}" />
<meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
<meta property="fc:frame:button:1" content="Try again" />
<meta property="fc:frame:button:1:action" content="post" />
<meta property="fc:frame:button:1:target" content="${target}" />
<meta property="fc:frame:button:2" content="Start over" />
<meta property="fc:frame:button:2:action" content="post" />
<meta property="fc:frame:button:2:target" content="${base}/frames/send/post?step=start" />
</head></html>`;

  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}
