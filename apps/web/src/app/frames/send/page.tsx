import { Metadata } from 'next';
import { getBaseUrl, getChainDisplayName } from '../utils/frame-helpers';

/**
 * /frames/send — Full swap frame. Multi-step wizard inside Farcaster.
 *
 * Step flow:
 * 1. Pick source chain  (4 buttons per page, "More→" cycles)
 * 2. Pick source token   (top tokens for chain)
 * 3. Pick dest chain     (same as step 1)
 * 4. Pick dest token     (top tokens for dest chain)
 * 5. Enter amount        (text input)
 * 6. Enter recipient     (text input)
 * 7. Confirm → tx        (review + sign)
 *
 * If opened with pre-filled params, skip completed steps.
 */

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

// Chain pages for the wizard buttons (3 chains + More→ per page)
const CHAIN_PAGES = [
  ['base', 'ethereum', 'solana'],
  ['arbitrum', 'near', 'sui'],
  ['optimism', 'polygon', 'bsc'],
  ['tron', 'aptos', 'starknet'],
];

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const base = getBaseUrl();
  const step = p.step || 'source-chain';
  const page = parseInt(p.page || '0', 10);

  const imageParams = new URLSearchParams();
  imageParams.set('type', 'send');
  imageParams.set('step', step);
  if (p.sourceChain) imageParams.set('sourceChain', p.sourceChain);
  if (p.sourceToken) imageParams.set('sourceToken', p.sourceToken);
  if (p.destChain) imageParams.set('destChain', p.destChain);
  if (p.destToken) imageParams.set('destToken', p.destToken);
  if (p.amount) imageParams.set('amount', p.amount);
  if (p.to) imageParams.set('to', p.to);

  const imageUrl = `${base}/frames/image?${imageParams.toString()}`;

  // Build state params to carry forward
  const state = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v && k !== 'step' && k !== 'page') state.set(k, v);
  }

  const meta: Record<string, string> = {
    'fc:frame': 'vNext',
    'fc:frame:image': imageUrl,
    'fc:frame:image:aspect_ratio': '1.91:1',
  };

  if (step === 'source-chain' || step === 'dest-chain') {
    const chains = CHAIN_PAGES[page] || CHAIN_PAGES[0];
    const nextStep = step === 'source-chain' ? 'source-token' : 'dest-token';
    const paramKey = step === 'source-chain' ? 'sourceChain' : 'destChain';

    chains.forEach((chain, i) => {
      const btnNum = i + 1;
      const postParams = new URLSearchParams(state);
      postParams.set(paramKey, chain);
      postParams.set('step', nextStep);
      meta[`fc:frame:button:${btnNum}`] = getChainDisplayName(chain);
      meta[`fc:frame:button:${btnNum}:action`] = 'post';
      meta[`fc:frame:button:${btnNum}:target`] = `${base}/frames/send/post?${postParams.toString()}`;
    });

    // More→ button
    const nextPage = (page + 1) % CHAIN_PAGES.length;
    const moreParams = new URLSearchParams(state);
    moreParams.set('step', step);
    moreParams.set('page', String(nextPage));
    meta['fc:frame:button:4'] = 'More →';
    meta['fc:frame:button:4:action'] = 'post';
    meta['fc:frame:button:4:target'] = `${base}/frames/send/post?${moreParams.toString()}`;
  } else if (step === 'source-token' || step === 'dest-token') {
    // Show top tokens for the selected chain — handled by post route dynamically
    // Initial render shouldn't hit this (post route returns frame HTML)
    meta['fc:frame:button:1'] = 'Loading...';
    meta['fc:frame:button:1:action'] = 'post';
    meta['fc:frame:button:1:target'] = `${base}/frames/send/post?${state.toString()}&step=${step}`;
  } else if (step === 'amount') {
    const postParams = new URLSearchParams(state);
    postParams.set('step', 'recipient');
    meta['fc:frame:input:text'] = `Amount in ${p.destToken || 'tokens'} to send`;
    meta['fc:frame:button:1'] = 'Next →';
    meta['fc:frame:button:1:action'] = 'post';
    meta['fc:frame:button:1:target'] = `${base}/frames/send/post?${postParams.toString()}`;
    meta['fc:frame:post_url'] = `${base}/frames/send/post?${postParams.toString()}`;
  } else if (step === 'recipient') {
    const postParams = new URLSearchParams(state);
    postParams.set('step', 'confirm');
    meta['fc:frame:input:text'] = 'Recipient wallet address';
    meta['fc:frame:button:1'] = 'Review →';
    meta['fc:frame:button:1:action'] = 'post';
    meta['fc:frame:button:1:target'] = `${base}/frames/send/post?${postParams.toString()}`;
    meta['fc:frame:post_url'] = `${base}/frames/send/post?${postParams.toString()}`;
  } else if (step === 'confirm') {
    const txParams = new URLSearchParams(state);
    if (p.amount) txParams.set('amount', p.amount);
    if (p.to) txParams.set('to', p.to);
    txParams.set('crossChain', 'true');
    const label = `Send ${p.amount || '?'} ${p.sourceToken || '?'} → ${p.destToken || '?'}`;
    meta['fc:frame:button:1'] = label.length > 36 ? 'Confirm & Send' : label;
    meta['fc:frame:button:1:action'] = 'tx';
    meta['fc:frame:button:1:target'] = `${base}/frames/send/tx?${txParams.toString()}`;
    meta['fc:frame:post_url'] = `${base}/frames/send/post?${new URLSearchParams(state).toString()}&step=success`;
  }

  const title = 'Send crypto · goBlink';
  return {
    title,
    openGraph: { title, images: [{ url: imageUrl, width: 1200, height: 630 }] },
    other: meta,
  };
}

export default async function SendFramePage({ searchParams }: Props) {
  const p = await searchParams;
  const sourceChain = p.sourceChain;
  const destChain = p.destChain;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px', padding: '0 20px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Send crypto anywhere</h1>
        <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>
          Pick your token, pick the destination, enter the amount — goBlink handles everything else.
          Works across 12+ chains.
        </p>
        {sourceChain && destChain && (
          <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '1rem' }}>
            {getChainDisplayName(sourceChain)} → {getChainDisplayName(destChain)}
          </p>
        )}
        <p style={{ color: '#52525b', marginTop: '1.5rem', fontSize: '0.8rem' }}>
          Open this link in Farcaster to use the interactive frame.
        </p>
      </div>
    </div>
  );
}
