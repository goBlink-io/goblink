import { Metadata } from 'next';
import { getBaseUrl } from '../utils/frame-helpers';

/**
 * /frames/send — Unified goBlink Farcaster Frame entry point.
 *
 * Landing frame presents three paths:
 *   Send — full swap wizard (pick chains, tokens, amount, recipient)
 *   Pay  — payment wizard (recipient → chain/token → amount → confirm)
 *   Tip  — tip wizard (recipient → chain/token → preset/$1/$5/$10/custom)
 *
 * Each path is a multi-step wizard handled by /frames/send/post
 */

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const base = getBaseUrl();
  const mode = p.mode; // send | pay | tip — if set, we're mid-wizard

  const imageUrl = `${base}/frames/image?type=send&step=start`;

  const meta: Record<string, string> = {
    'fc:frame': 'vNext',
    'fc:frame:image': imageUrl,
    'fc:frame:image:aspect_ratio': '1.91:1',
  };

  if (!mode) {
    // Landing — 3 buttons
    meta['fc:frame:button:1'] = '🔄 Send';
    meta['fc:frame:button:1:action'] = 'post';
    meta['fc:frame:button:1:target'] = `${base}/frames/send/post?mode=send&step=source-chain`;

    meta['fc:frame:button:2'] = '💸 Pay';
    meta['fc:frame:button:2:action'] = 'post';
    meta['fc:frame:button:2:target'] = `${base}/frames/send/post?mode=pay&step=recipient`;

    meta['fc:frame:button:3'] = '🎁 Tip';
    meta['fc:frame:button:3:action'] = 'post';
    meta['fc:frame:button:3:target'] = `${base}/frames/send/post?mode=tip&step=recipient`;
  }

  const title = 'goBlink · Send crypto anywhere';
  return {
    title,
    openGraph: { title, images: [{ url: imageUrl, width: 1200, height: 630 }] },
    other: meta,
  };
}

export default async function SendFramePage({ searchParams: _searchParams }: Props) {

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
