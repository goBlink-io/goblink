import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, getChainDisplayName } from '../../utils/frame-helpers';
import { errorFrame } from '../../utils/error-frame';
import { extractVerifiedInputText } from '../../utils/verify-frame';

/**
 * POST /frames/send/post — Unified multi-step wizard for Send, Pay, and Tip frames.
 *
 * Modes:
 *   send — source-chain → source-token → dest-chain → dest-token → amount → recipient → confirm
 *   pay  — recipient → dest-chain → dest-token → source-chain → source-token → amount → confirm
 *   tip  — recipient → dest-chain → dest-token → source-chain → source-token → presets/custom → confirm
 */

// ─── Constants ────────────────────────────────────────────────────────────────

// Source chains: EVM only (Farcaster Frames v1 = eth_sendTransaction)
const SOURCE_CHAIN_PAGES = [
  ['base', 'ethereum', 'arbitrum'],
  ['optimism', 'polygon', 'bsc'],
];

// Dest chains: anything goBlink supports (1Click handles delivery)
const DEST_CHAIN_PAGES = [
  ['base', 'ethereum', 'solana'],
  ['arbitrum', 'near', 'sui'],
  ['optimism', 'polygon', 'bsc'],
  ['tron', 'aptos', 'starknet'],
];

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function htmlEncode(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function html(body: string) {
  return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'text/html' } });
}

function stateToObj(state: URLSearchParams): Record<string, string> {
  const obj: Record<string, string> = {};
  state.forEach((v, k) => { obj[k] = v; });
  return obj;
}

function buildImageUrl(base: string, params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  sp.set('type', 'send');
  for (const [k, v] of Object.entries(params)) { if (v) sp.set(k, v); }
  return `${base}/frames/image?${sp.toString()}`;
}

function getState(sp: URLSearchParams): URLSearchParams {
  const state = new URLSearchParams();
  const keys = ['mode', 'sourceChain', 'sourceToken', 'sourceAssetId', 'destChain', 'destToken', 'destAssetId', 'amount', 'to', 'sourceDecimals', 'destDecimals'];
  keys.forEach(k => { const v = sp.get(k); if (v) state.set(k, v); });
  return state;
}

function buildFrameHtml(opts: {
  imageUrl: string;
  buttons: Array<{ label: string; action: 'post' | 'tx' | 'link'; target: string }>;
  inputText?: string;
  postUrl?: string;
}): string {
  let h = `<!DOCTYPE html><html><head>
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="${htmlEncode(opts.imageUrl)}" />
<meta property="fc:frame:image:aspect_ratio" content="1.91:1" />`;
  if (opts.inputText) h += `\n<meta property="fc:frame:input:text" content="${htmlEncode(opts.inputText)}" />`;
  opts.buttons.forEach((btn, i) => {
    const n = i + 1;
    h += `\n<meta property="fc:frame:button:${n}" content="${htmlEncode(btn.label)}" />`;
    h += `\n<meta property="fc:frame:button:${n}:action" content="${htmlEncode(btn.action)}" />`;
    h += `\n<meta property="fc:frame:button:${n}:target" content="${htmlEncode(btn.target)}" />`;
  });
  if (opts.postUrl) h += `\n<meta property="fc:frame:post_url" content="${htmlEncode(opts.postUrl)}" />`;
  h += '\n</head></html>';
  return h;
}

// Chain picker: 3 buttons + More→
function chainPickerFrame(base: string, state: URLSearchParams, step: string, paramKey: string, nextStep: string, page: number, pages: string[][]): string {
  const chains = pages[page] || pages[0];
  const imageUrl = buildImageUrl(base, { step, ...stateToObj(state) });

  const buttons = chains.map(chain => {
    const p = new URLSearchParams(state);
    p.set(paramKey, chain);
    p.set('step', nextStep);
    return { label: getChainDisplayName(chain), action: 'post' as const, target: `${base}/frames/send/post?${p.toString()}` };
  });

  // Only show More→ if there are multiple pages
  if (pages.length > 1) {
    const nextPage = (page + 1) % pages.length;
    const moreParams = new URLSearchParams(state);
    moreParams.set('step', step);
    moreParams.set('page', String(nextPage));
    buttons.push({ label: 'More →', action: 'post', target: `${base}/frames/send/post?${moreParams.toString()}` });
  }

  return buildFrameHtml({ imageUrl, buttons });
}

// Token picker: top tokens + ← Back
function tokenPickerFrame(base: string, state: URLSearchParams, step: string, chain: string, paramKey: string, nextStep: string, backStep: string, backDeleteKey: string): string {
  state.set(paramKey === 'sourceToken' ? 'sourceChain' : 'destChain', chain);
  const tokens = CHAIN_TOKENS[chain] || ['USDC'];
  const imageUrl = buildImageUrl(base, { step, ...stateToObj(state) });

  const buttons = tokens.slice(0, 3).map(token => {
    const p = new URLSearchParams(state);
    p.set(paramKey, token);
    p.set('step', nextStep);
    return { label: token, action: 'post' as const, target: `${base}/frames/send/post?${p.toString()}` };
  });

  const backParams = new URLSearchParams(state);
  backParams.delete(backDeleteKey);
  backParams.set('step', backStep);
  buttons.push({ label: '← Back', action: 'post', target: `${base}/frames/send/post?${backParams.toString()}` });

  return buildFrameHtml({ imageUrl, buttons });
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const step = searchParams.get('step') || 'start';
  const page = parseInt(searchParams.get('page') || '0', 10);
  const base = getBaseUrl();
  const mode = searchParams.get('mode') || 'send';

  let inputText = '';
  try {
    const body = await request.json();
    inputText = extractVerifiedInputText(body);
  } catch { /* */ }

  const state = getState(searchParams);
  state.set('mode', mode);

  // ═══════════════════════════════════════════════════════════════════
  // START — Landing with 3 buttons
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'start') {
    const imageUrl = buildImageUrl(base, { step: 'start' });
    return html(buildFrameHtml({
      imageUrl,
      buttons: [
        { label: '🔄 Send', action: 'post', target: `${base}/frames/send/post?mode=send&step=source-chain` },
        { label: '💸 Pay', action: 'post', target: `${base}/frames/send/post?mode=pay&step=recipient` },
        { label: '🎁 Tip', action: 'post', target: `${base}/frames/send/post?mode=tip&step=recipient` },
      ],
    }));
  }

  // ═══════════════════════════════════════════════════════════════════
  // RECIPIENT — text input for Pay & Tip (they need address first)
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'recipient') {
    if (inputText && inputText.trim().length > 5) {
      const addr = inputText.trim();
      // Basic address validation
      if (addr.length < 6 || addr.includes(' ')) {
        const retryParams = new URLSearchParams(state);
        retryParams.set('step', 'recipient');
        return errorFrame("That doesn't look like a valid wallet address. Please try again.", `${base}/frames/send/post?${retryParams.toString()}`);
      }
      state.set('to', addr);
      const nextStep = 'dest-chain';
      const nextParams = new URLSearchParams(state);
      nextParams.set('step', nextStep);
      // Move to dest chain picker
      return html(chainPickerFrame(base, nextParams, nextStep, 'destChain', 'dest-token', 0, DEST_CHAIN_PAGES));
    }

    const imageUrl = buildImageUrl(base, { step: 'recipient', mode, ...stateToObj(state) });
    const submitParams = new URLSearchParams(state);
    submitParams.set('step', 'recipient');
    const prompt = mode === 'pay' ? 'Paste the wallet address you want to pay' : 'Paste the wallet address you want to tip';

    return html(buildFrameHtml({
      imageUrl,
      inputText: prompt,
      buttons: [
        { label: 'Next →', action: 'post', target: `${base}/frames/send/post?${submitParams.toString()}` },
        { label: '← Start over', action: 'post', target: `${base}/frames/send/post?step=start` },
      ],
      postUrl: `${base}/frames/send/post?${submitParams.toString()}`,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════
  // SOURCE CHAIN — Send mode starts here
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'source-chain') {
    return html(chainPickerFrame(base, state, 'source-chain', 'sourceChain', 'source-token', page, SOURCE_CHAIN_PAGES));
  }

  // ═══════════════════════════════════════════════════════════════════
  // SOURCE TOKEN
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'source-token') {
    const chain = searchParams.get('sourceChain') || state.get('sourceChain') || 'base';
    let nextStep: string;
    if (mode === 'send') nextStep = 'dest-chain';
    else if (mode === 'tip') nextStep = 'tip-presets';
    else nextStep = 'amount'; // pay
    return html(tokenPickerFrame(base, state, 'source-token', chain, 'sourceToken', nextStep, 'source-chain', 'sourceChain'));
  }

  // ═══════════════════════════════════════════════════════════════════
  // DEST CHAIN
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'dest-chain') {
    return html(chainPickerFrame(base, state, 'dest-chain', 'destChain', 'dest-token', page, DEST_CHAIN_PAGES));
  }

  // ═══════════════════════════════════════════════════════════════════
  // DEST TOKEN
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'dest-token') {
    const chain = searchParams.get('destChain') || state.get('destChain') || 'base';
    // For pay/tip: next is source-chain (what the payer sends from)
    // For send: next is amount
    const nextStep = mode === 'send' ? 'amount' : 'source-chain';
    return html(tokenPickerFrame(base, state, 'dest-token', chain, 'destToken', nextStep, 'dest-chain', 'destChain'));
  }

  // ═══════════════════════════════════════════════════════════════════
  // AMOUNT — text input (Send & Pay)
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'amount') {
    if (inputText && inputText.trim()) {
      const num = Number(inputText.trim());
      if (isNaN(num) || num <= 0) {
        const retryParams = new URLSearchParams(state);
        retryParams.set('step', 'amount');
        return errorFrame('Please enter a valid amount greater than 0.', `${base}/frames/send/post?${retryParams.toString()}`);
      }
    }
    if (inputText && !isNaN(Number(inputText.trim())) && Number(inputText.trim()) > 0) {
      state.set('amount', inputText);

      // Send mode: next is recipient. Pay mode: next is confirm.
      if (mode === 'send') {
        const nextParams = new URLSearchParams(state);
        nextParams.set('step', 'send-recipient');
        const imageUrl = buildImageUrl(base, { step: 'send-recipient', ...stateToObj(state), amount: inputText });
        return html(buildFrameHtml({
          imageUrl,
          inputText: 'Recipient wallet address',
          buttons: [
            { label: 'Review →', action: 'post', target: `${base}/frames/send/post?${nextParams.toString()}` },
            { label: '← Back', action: 'post', target: `${base}/frames/send/post?${new URLSearchParams(state).toString()}&step=amount` },
          ],
          postUrl: `${base}/frames/send/post?${nextParams.toString()}`,
        }));
      }

      // Pay mode → confirm
      const confirmParams = new URLSearchParams(state);
      confirmParams.set('step', 'confirm');
      return html(confirmFrame(base, confirmParams));
    }

    const destToken = state.get('destToken') || state.get('sourceToken') || 'tokens';
    const imageUrl = buildImageUrl(base, { step: 'amount', ...stateToObj(state) });
    const submitParams = new URLSearchParams(state);
    submitParams.set('step', 'amount');

    const backStep = mode === 'send' ? 'dest-token' : 'source-token';
    const backParams = new URLSearchParams(state);
    backParams.set('step', backStep);

    return html(buildFrameHtml({
      imageUrl,
      inputText: `How much ${destToken}?`,
      buttons: [
        { label: 'Next →', action: 'post', target: `${base}/frames/send/post?${submitParams.toString()}` },
        { label: '← Back', action: 'post', target: `${base}/frames/send/post?${backParams.toString()}` },
      ],
      postUrl: `${base}/frames/send/post?${submitParams.toString()}`,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════
  // SEND-RECIPIENT — recipient for Send mode (after amount)
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'send-recipient') {
    if (inputText && inputText.trim().length > 5) {
      const addr = inputText.trim();
      if (addr.length < 6 || addr.includes(' ')) {
        const retryParams = new URLSearchParams(state);
        retryParams.set('step', 'send-recipient');
        return errorFrame("That doesn't look like a valid wallet address. Please try again.", `${base}/frames/send/post?${retryParams.toString()}`);
      }
      state.set('to', addr);
      const confirmParams = new URLSearchParams(state);
      confirmParams.set('step', 'confirm');
      return html(confirmFrame(base, confirmParams));
    }

    const imageUrl = buildImageUrl(base, { step: 'send-recipient', ...stateToObj(state) });
    const submitParams = new URLSearchParams(state);
    submitParams.set('step', 'send-recipient');
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

  // ═══════════════════════════════════════════════════════════════════
  // TIP PRESETS — $1, $5, $10, Custom (Tip mode instead of amount)
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'tip-presets') {
    const imageUrl = buildImageUrl(base, { step: 'tip-presets', ...stateToObj(state) });

    const tipButton = (amt: string) => {
      const p = new URLSearchParams(state);
      p.set('amount', amt);
      p.set('step', 'confirm');
      return { label: `$${amt}`, action: 'post' as const, target: `${base}/frames/send/post?${p.toString()}` };
    };

    const customParams = new URLSearchParams(state);
    customParams.set('step', 'tip-custom');

    return html(buildFrameHtml({
      imageUrl,
      buttons: [
        tipButton('1'),
        tipButton('5'),
        tipButton('10'),
        { label: 'Custom', action: 'post', target: `${base}/frames/send/post?${customParams.toString()}` },
      ],
    }));
  }

  // ═══════════════════════════════════════════════════════════════════
  // TIP CUSTOM — text input for custom tip amount
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'tip-custom') {
    if (inputText && inputText.trim()) {
      const num = Number(inputText.trim());
      if (isNaN(num) || num <= 0) {
        const retryParams = new URLSearchParams(state);
        retryParams.set('step', 'tip-custom');
        return errorFrame('Please enter a valid tip amount greater than 0.', `${base}/frames/send/post?${retryParams.toString()}`);
      }
    }
    if (inputText && !isNaN(Number(inputText.trim())) && Number(inputText.trim()) > 0) {
      state.set('amount', inputText);
      const confirmParams = new URLSearchParams(state);
      confirmParams.set('step', 'confirm');
      return html(confirmFrame(base, confirmParams));
    }

    const destToken = state.get('destToken') || 'USDC';
    const imageUrl = buildImageUrl(base, { step: 'tip-custom', ...stateToObj(state) });
    const submitParams = new URLSearchParams(state);
    submitParams.set('step', 'tip-custom');
    const backParams = new URLSearchParams(state);
    backParams.set('step', 'tip-presets');

    return html(buildFrameHtml({
      imageUrl,
      inputText: `How much ${destToken} to tip?`,
      buttons: [
        { label: 'Next →', action: 'post', target: `${base}/frames/send/post?${submitParams.toString()}` },
        { label: '← Back', action: 'post', target: `${base}/frames/send/post?${backParams.toString()}` },
      ],
      postUrl: `${base}/frames/send/post?${submitParams.toString()}`,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════
  // CONFIRM — review & sign
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'confirm') {
    return html(confirmFrame(base, state));
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUCCESS
  // ═══════════════════════════════════════════════════════════════════
  if (step === 'success') {
    const imageUrl = buildImageUrl(base, { step: 'success', ...stateToObj(state) });
    return html(buildFrameHtml({
      imageUrl,
      buttons: [
        { label: '✓ Transaction sent!', action: 'link', target: base },
        { label: 'Start over', action: 'post', target: `${base}/frames/send/post?step=start` },
      ],
    }));
  }

  // Fallback → start
  return html(buildFrameHtml({
    imageUrl: buildImageUrl(base, { step: 'start' }),
    buttons: [
      { label: '🔄 Send', action: 'post', target: `${base}/frames/send/post?mode=send&step=source-chain` },
      { label: '💸 Pay', action: 'post', target: `${base}/frames/send/post?mode=pay&step=recipient` },
      { label: '🎁 Tip', action: 'post', target: `${base}/frames/send/post?mode=tip&step=recipient` },
    ],
  }));
}

// ─── Confirm frame builder ────────────────────────────────────────────────────

function confirmFrame(base: string, state: URLSearchParams): string {
  const mode = state.get('mode') || 'send';
  const sourceToken = state.get('sourceToken') || '?';
  const destToken = state.get('destToken') || '?';
  const amount = state.get('amount') || '?';

  const imageUrl = buildImageUrl(base, { step: 'confirm', ...stateToObj(state) });

  const txParams = new URLSearchParams(state);
  txParams.set('crossChain', 'true');
  const txTarget = `${base}/frames/send/tx?${txParams.toString()}`;

  const isCrossChain = state.get('sourceChain') !== state.get('destChain') || sourceToken !== destToken;

  let label: string;
  if (mode === 'tip') {
    label = `Tip ${amount} ${destToken}`;
  } else if (mode === 'pay') {
    label = `Pay ${amount} ${destToken}`;
  } else {
    label = isCrossChain ? `Send ${amount} ${sourceToken} → ${destToken}` : `Send ${amount} ${sourceToken}`;
  }
  if (label.length > 36) label = 'Confirm & Send';

  // Edit goes back to amount step
  const editParams = new URLSearchParams(state);
  editParams.set('step', mode === 'tip' ? 'tip-presets' : 'amount');

  const successParams = new URLSearchParams(state);
  successParams.set('step', 'success');

  return buildFrameHtml({
    imageUrl,
    buttons: [
      { label, action: 'tx', target: txTarget },
      { label: '← Edit', action: 'post', target: `${base}/frames/send/post?${editParams.toString()}` },
    ],
    postUrl: `${base}/frames/send/post?${successParams.toString()}`,
  });
}
