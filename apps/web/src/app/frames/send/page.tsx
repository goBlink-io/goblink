import { Metadata } from 'next';
import { getBaseUrl, getChainDisplayName, shortAddress } from '../utils/frame-helpers';

/**
 * /frames/send — Unified goBlink Farcaster Frame entry point.
 *
 * Three modes:
 *   - No params → landing with Send/Pay/Tip buttons
 *   - Pre-filled params (from Frame Builder) → jump straight into the wizard
 *   - Each step handled by /frames/send/post
 */

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const base = getBaseUrl();
  const mode = p.mode;
  const step = p.step;

  // Build image URL with all available state
  const imageParams = new URLSearchParams();
  imageParams.set('type', 'send');
  imageParams.set('step', step || 'start');
  for (const [k, v] of Object.entries(p)) {
    if (v && k !== 'step') imageParams.set(k, v);
  }
  const imageUrl = `${base}/frames/image?${imageParams.toString()}`;

  const meta: Record<string, string> = {
    'fc:frame': 'vNext',
    'fc:frame:image': imageUrl,
    'fc:frame:image:aspect_ratio': '1.91:1',
  };

  // Build state passthrough for buttons
  const allParams = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) { if (v) allParams.set(k, v); }

  if (!mode) {
    // ─── Landing — 3 buttons ──────────────────────────────────────
    meta['fc:frame:button:1'] = '🔄 Send';
    meta['fc:frame:button:1:action'] = 'post';
    meta['fc:frame:button:1:target'] = `${base}/frames/send/post?mode=send&step=source-chain`;

    meta['fc:frame:button:2'] = '💸 Pay';
    meta['fc:frame:button:2:action'] = 'post';
    meta['fc:frame:button:2:target'] = `${base}/frames/send/post?mode=pay&step=recipient`;

    meta['fc:frame:button:3'] = '🎁 Tip';
    meta['fc:frame:button:3:action'] = 'post';
    meta['fc:frame:button:3:target'] = `${base}/frames/send/post?mode=tip&step=recipient`;
  } else if (step === 'confirm' && p.amount && p.to) {
    // ─── Pre-filled Pay confirm ───────────────────────────────────
    const txParams = new URLSearchParams(allParams);
    txParams.set('crossChain', 'true');
    const sourceToken = p.sourceToken || '?';
    const destToken = p.destToken || '?';
    const label = mode === 'pay' ? `Pay ${p.amount} ${destToken}` : `Send ${p.amount} ${sourceToken} → ${destToken}`;

    meta['fc:frame:button:1'] = label.length > 36 ? 'Confirm & Send' : label;
    meta['fc:frame:button:1:action'] = 'tx';
    meta['fc:frame:button:1:target'] = `${base}/frames/send/tx?${txParams.toString()}`;

    const editParams = new URLSearchParams(allParams);
    editParams.set('step', 'amount');
    meta['fc:frame:button:2'] = '← Edit';
    meta['fc:frame:button:2:action'] = 'post';
    meta['fc:frame:button:2:target'] = `${base}/frames/send/post?${editParams.toString()}`;

    const successParams = new URLSearchParams(allParams);
    successParams.set('step', 'success');
    meta['fc:frame:post_url'] = `${base}/frames/send/post?${successParams.toString()}`;
  } else if (step === 'tip-presets' && p.to) {
    // ─── Pre-filled Tip presets ───────────────────────────────────
    const tipButton = (amt: string, n: number) => {
      const tp = new URLSearchParams(allParams);
      tp.set('amount', amt);
      tp.set('step', 'confirm');
      meta[`fc:frame:button:${n}`] = `$${amt}`;
      meta[`fc:frame:button:${n}:action`] = 'post';
      meta[`fc:frame:button:${n}:target`] = `${base}/frames/send/post?${tp.toString()}`;
    };
    tipButton('1', 1);
    tipButton('5', 2);
    tipButton('10', 3);
    const customParams = new URLSearchParams(allParams);
    customParams.set('step', 'tip-custom');
    meta['fc:frame:button:4'] = 'Custom';
    meta['fc:frame:button:4:action'] = 'post';
    meta['fc:frame:button:4:target'] = `${base}/frames/send/post?${customParams.toString()}`;
  } else {
    // ─── Mid-wizard with mode set — redirect to post handler ──────
    meta['fc:frame:button:1'] = 'Continue →';
    meta['fc:frame:button:1:action'] = 'post';
    meta['fc:frame:button:1:target'] = `${base}/frames/send/post?${allParams.toString()}`;
  }

  const destToken = p.destToken || '';
  const shortTo = p.to ? shortAddress(p.to) : '';
  const destChainName = p.destChain ? getChainDisplayName(p.destChain) : '';

  let title = 'goBlink · Send crypto anywhere';
  if (mode === 'pay' && p.amount && shortTo) {
    title = `Pay ${p.amount} ${destToken} to ${shortTo} on ${destChainName} · goBlink`;
  } else if (mode === 'tip' && shortTo) {
    title = `Tip ${shortTo} in ${destToken} on ${destChainName} · goBlink`;
  }

  return {
    title,
    openGraph: { title, images: [{ url: imageUrl, width: 1200, height: 630 }] },
    other: meta,
  };
}

export default async function SendFramePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px', padding: '0 20px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>goBlink</h1>
        <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>
          Send, pay, or tip — any token, any chain. Open this link in Farcaster to get started.
        </p>
        <p style={{ color: '#52525b', marginTop: '1.5rem', fontSize: '0.8rem' }}>
          Open this link in Warpcast to use the interactive frame.
        </p>
      </div>
    </div>
  );
}
