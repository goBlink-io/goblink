import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getChainDisplayName } from '../../utils/frame-helpers';

/**
 * POST /frames/send/post — Multi-step wizard handler for Send frame.
 *
 * Steps: source-chain → source-token → dest-chain → dest-token → amount → recipient → confirm → success
 */

// 3 chains per page + More→
const CHAIN_PAGES = [
  ['base', 'ethereum', 'solana'],
  ['arbitrum', 'near', 'sui'],
  ['optimism', 'polygon', 'bsc'],
  ['tron', 'aptos', 'starknet'],
];

// Top tokens per chain for button display
const CHAIN_TOKENS: Record<string, string[]> = {
  base:      ['USDC', 'ETH', 'USDT'],
  ethereum:  ['USDC', 'ETH', 'USDT'],
  arbitrum:  ['USDC', 'ETH', 'USDT'],
  optimism:  ['USDC', 'ETH', 'USDT'],
  polygon:   ['USDC', 'POL', 'USDT'],
  bsc:       ['USDC', 'BNB', 'USDT'],
  solana:    ['USDC', 'SOL', 'USDT'],
  near:      ['NEAR', 'USDC', 'USDT'],
  sui:       ['SUI', 'USDC'],
  aptos:     ['APT', 'USDC'],
  tron:      ['USDT', 'TRX'],
  starknet:  ['ETH', 'USDC'],
};

function buildFrameHtml(opts: {
  imageUrl: string;
  buttons: Array<{ label: string; action: 'post' | 'tx' | 'link'; target: string }>;
  inputText?: string;
  postUrl?: string;
}): string {
  let html = `<!DOCTYPE html><html><head>
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="${opts.imageUrl}" />
<meta property="fc:frame:image:aspect_ratio" content="1.91:1" />`;

  if (opts.inputText) {
    html += `\n<meta property="fc:frame:input:text" content="${opts.inputText}" />`;
  }

  opts.buttons.forEach((btn, i) => {
    const n = i + 1;
    html += `\n<meta property="fc:frame:button:${n}" content="${btn.label}" />`;
    html += `\n<meta property="fc:frame:button:${n}:action" content="${btn.action}" />`;
    html += `\n<meta property="fc:frame:button:${n}:target" content="${btn.target}" />`;
  });

  if (opts.postUrl) {
    html += `\n<meta property="fc:frame:post_url" content="${opts.postUrl}" />`;
  }

  html += '\n</head></html>';
  return html;
}

function buildImageUrl(base: string, params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  sp.set('type', 'send');
  for (const [k, v] of Object.entries(params)) { if (v) sp.set(k, v); }
  return `${base}/frames/image?${sp.toString()}`;
}

// Carry forward all state params
function getState(sp: URLSearchParams): URLSearchParams {
  const state = new URLSearchParams();
  const keys = ['sourceChain', 'sourceToken', 'sourceAssetId', 'destChain', 'destToken', 'destAssetId', 'amount', 'to', 'sourceDecimals', 'destDecimals'];
  keys.forEach(k => { const v = sp.get(k); if (v) state.set(k, v); });
  return state;
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const step = searchParams.get('step') || 'source-chain';
  const page = parseInt(searchParams.get('page') || '0', 10);
  const base = getBaseUrl();

  // Parse body for input text
  let inputText = '';
  try {
    const body = await request.json();
    inputText = body?.untrustedData?.inputText || '';
  } catch { /* */ }

  const state = getState(searchParams);

  // ─── SOURCE CHAIN ───────────────────────────────────────────────
  if (step === 'source-chain') {
    const chains = CHAIN_PAGES[page] || CHAIN_PAGES[0];
    const imageUrl = buildImageUrl(base, { step: 'source-chain' });

    const buttons = chains.map(chain => {
      const p = new URLSearchParams(state);
      p.set('sourceChain', chain);
      p.set('step', 'source-token');
      return { label: getChainDisplayName(chain), action: 'post' as const, target: `${base}/frames/send/post?${p.toString()}` };
    });

    const nextPage = (page + 1) % CHAIN_PAGES.length;
    const moreParams = new URLSearchParams(state);
    moreParams.set('step', 'source-chain');
    moreParams.set('page', String(nextPage));
    buttons.push({ label: 'More →', action: 'post', target: `${base}/frames/send/post?${moreParams.toString()}` });

    return html(buildFrameHtml({ imageUrl, buttons }));
  }

  // ─── SOURCE TOKEN ───────────────────────────────────────────────
  if (step === 'source-token') {
    const chain = searchParams.get('sourceChain') || state.get('sourceChain') || 'base';
    state.set('sourceChain', chain);
    const tokens = CHAIN_TOKENS[chain] || ['USDC'];
    const imageUrl = buildImageUrl(base, { step: 'source-token', sourceChain: chain, ...stateToObj(state) });

    const buttons = tokens.slice(0, 3).map(token => {
      const p = new URLSearchParams(state);
      p.set('sourceToken', token);
      p.set('step', 'dest-chain');
      return { label: token, action: 'post' as const, target: `${base}/frames/send/post?${p.toString()}` };
    });

    // Back button
    const backParams = new URLSearchParams(state);
    backParams.delete('sourceChain');
    backParams.set('step', 'source-chain');
    buttons.push({ label: '← Back', action: 'post', target: `${base}/frames/send/post?${backParams.toString()}` });

    return html(buildFrameHtml({ imageUrl, buttons }));
  }

  // ─── DEST CHAIN ─────────────────────────────────────────────────
  if (step === 'dest-chain') {
    const chains = CHAIN_PAGES[page] || CHAIN_PAGES[0];
    const imageUrl = buildImageUrl(base, { step: 'dest-chain', ...stateToObj(state) });

    const buttons = chains.map(chain => {
      const p = new URLSearchParams(state);
      p.set('destChain', chain);
      p.set('step', 'dest-token');
      return { label: getChainDisplayName(chain), action: 'post' as const, target: `${base}/frames/send/post?${p.toString()}` };
    });

    const nextPage = (page + 1) % CHAIN_PAGES.length;
    const moreParams = new URLSearchParams(state);
    moreParams.set('step', 'dest-chain');
    moreParams.set('page', String(nextPage));
    buttons.push({ label: 'More →', action: 'post', target: `${base}/frames/send/post?${moreParams.toString()}` });

    // Replace last button with More→ (max 4)
    if (buttons.length > 4) buttons.splice(3, buttons.length - 3, buttons[buttons.length - 1]);

    return html(buildFrameHtml({ imageUrl, buttons }));
  }

  // ─── DEST TOKEN ─────────────────────────────────────────────────
  if (step === 'dest-token') {
    const chain = searchParams.get('destChain') || state.get('destChain') || 'base';
    state.set('destChain', chain);
    const tokens = CHAIN_TOKENS[chain] || ['USDC'];
    const imageUrl = buildImageUrl(base, { step: 'dest-token', ...stateToObj(state) });

    const buttons = tokens.slice(0, 3).map(token => {
      const p = new URLSearchParams(state);
      p.set('destToken', token);
      p.set('step', 'amount');
      return { label: token, action: 'post' as const, target: `${base}/frames/send/post?${p.toString()}` };
    });

    const backParams = new URLSearchParams(state);
    backParams.delete('destChain');
    backParams.set('step', 'dest-chain');
    buttons.push({ label: '← Back', action: 'post', target: `${base}/frames/send/post?${backParams.toString()}` });

    return html(buildFrameHtml({ imageUrl, buttons }));
  }

  // ─── AMOUNT ─────────────────────────────────────────────────────
  if (step === 'amount') {
    const imageUrl = buildImageUrl(base, { step: 'amount', ...stateToObj(state) });

    // If user typed an amount, move to recipient
    if (inputText && !isNaN(Number(inputText)) && Number(inputText) > 0) {
      state.set('amount', inputText);
      const nextParams = new URLSearchParams(state);
      nextParams.set('step', 'recipient');

      const recipientImageUrl = buildImageUrl(base, { step: 'recipient', ...stateToObj(state), amount: inputText });
      return html(buildFrameHtml({
        imageUrl: recipientImageUrl,
        inputText: 'Recipient wallet address',
        buttons: [
          { label: 'Review →', action: 'post', target: `${base}/frames/send/post?${nextParams.toString()}` },
          { label: '← Back', action: 'post', target: `${base}/frames/send/post?${new URLSearchParams(state).toString().replace(/&?step=[^&]*/g, '')}&step=amount` },
        ],
        postUrl: `${base}/frames/send/post?${nextParams.toString()}`,
      }));
    }

    const destToken = state.get('destToken') || 'tokens';

    const submitParams = new URLSearchParams(state);
    submitParams.set('step', 'amount');

    const backParams = new URLSearchParams(state);
    backParams.delete('destToken');
    backParams.set('step', 'dest-token');

    return html(buildFrameHtml({
      imageUrl,
      inputText: `How much ${destToken} do you want to send?`,
      buttons: [
        { label: 'Next →', action: 'post', target: `${base}/frames/send/post?${submitParams.toString()}` },
        { label: '← Back', action: 'post', target: `${base}/frames/send/post?${backParams.toString()}` },
      ],
      postUrl: `${base}/frames/send/post?${submitParams.toString()}`,
    }));
  }

  // ─── RECIPIENT ──────────────────────────────────────────────────
  if (step === 'recipient') {
    // If user typed an address, move to confirm
    if (inputText && inputText.length > 5) {
      state.set('to', inputText);
      const confirmParams = new URLSearchParams(state);
      confirmParams.set('step', 'confirm');

      const confirmImageUrl = buildImageUrl(base, { step: 'confirm', ...stateToObj(state), to: inputText });
      const txParams = new URLSearchParams(state);
      txParams.set('crossChain', 'true');

      const sourceToken = state.get('sourceToken') || '?';
      const destToken = state.get('destToken') || '?';
      const amount = state.get('amount') || '?';
      const label = `Send ${amount} ${sourceToken} → ${destToken}`;

      return html(buildFrameHtml({
        imageUrl: confirmImageUrl,
        buttons: [
          { label: label.length > 36 ? 'Confirm & Send' : label, action: 'tx', target: `${base}/frames/send/tx?${txParams.toString()}` },
          { label: '← Edit', action: 'post', target: `${base}/frames/send/post?${new URLSearchParams(state).toString()}&step=amount` },
        ],
        postUrl: `${base}/frames/send/post?${confirmParams.toString()}&step=success`,
      }));
    }

    const imageUrl = buildImageUrl(base, { step: 'recipient', ...stateToObj(state) });

    const submitParams = new URLSearchParams(state);
    submitParams.set('step', 'recipient');

    const backParams = new URLSearchParams(state);
    backParams.delete('amount');
    backParams.set('step', 'amount');

    return html(buildFrameHtml({
      imageUrl,
      inputText: 'Recipient wallet address',
      buttons: [
        { label: 'Review →', action: 'post', target: `${base}/frames/send/post?${submitParams.toString()}` },
        { label: '← Back', action: 'post', target: `${base}/frames/send/post?${backParams.toString()}` },
      ],
      postUrl: `${base}/frames/send/post?${submitParams.toString()}`,
    }));
  }

  // ─── CONFIRM ────────────────────────────────────────────────────
  if (step === 'confirm') {
    const imageUrl = buildImageUrl(base, { step: 'confirm', ...stateToObj(state) });
    const txParams = new URLSearchParams(state);
    txParams.set('crossChain', 'true');

    const sourceToken = state.get('sourceToken') || '?';
    const destToken = state.get('destToken') || '?';
    const amount = state.get('amount') || '?';
    const label = `Send ${amount} ${sourceToken} → ${destToken}`;

    return html(buildFrameHtml({
      imageUrl,
      buttons: [
        { label: label.length > 36 ? 'Confirm & Send' : label, action: 'tx', target: `${base}/frames/send/tx?${txParams.toString()}` },
        { label: '← Edit', action: 'post', target: `${base}/frames/send/post?${new URLSearchParams(state).toString()}&step=amount` },
      ],
      postUrl: `${base}/frames/send/post?${new URLSearchParams(state).toString()}&step=success`,
    }));
  }

  // ─── SUCCESS ────────────────────────────────────────────────────
  if (step === 'success') {
    const imageUrl = buildImageUrl(base, { step: 'success', ...stateToObj(state) });
    return html(buildFrameHtml({
      imageUrl,
      buttons: [
        { label: 'Transaction sent! ✓', action: 'link', target: base },
        { label: 'Send another', action: 'post', target: `${base}/frames/send/post?step=source-chain` },
      ],
    }));
  }

  // Fallback → step 1
  const imageUrl = buildImageUrl(base, { step: 'source-chain' });
  const chains = CHAIN_PAGES[0];
  const buttons = chains.map(chain => {
    const p = new URLSearchParams();
    p.set('sourceChain', chain);
    p.set('step', 'source-token');
    return { label: getChainDisplayName(chain), action: 'post' as const, target: `${base}/frames/send/post?${p.toString()}` };
  });
  const moreParams = new URLSearchParams();
  moreParams.set('step', 'source-chain');
  moreParams.set('page', '1');
  buttons.push({ label: 'More →', action: 'post', target: `${base}/frames/send/post?${moreParams.toString()}` });

  return html(buildFrameHtml({ imageUrl, buttons }));
}

function html(body: string) {
  return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'text/html' } });
}

function stateToObj(state: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  state.forEach((v, k) => { obj[k] = v; });
  return obj;
}
