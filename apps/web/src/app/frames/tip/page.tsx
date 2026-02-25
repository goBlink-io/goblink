import { Metadata } from 'next';
import { getBaseUrl, getChainDisplayName, shortAddress } from '../utils/frame-helpers';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const to = p.to || '';
  const base = getBaseUrl();

  const sourceChain = p.sourceChain || p.chain || 'base';
  const sourceToken = p.sourceToken || p.token || 'USDC';
  const destChain = p.destChain || p.chain || 'base';
  const destToken = p.destToken || p.token || 'USDC';
  const isCrossChain = p.crossChain === 'true';

  const destChainName = getChainDisplayName(destChain);
  const shortTo = shortAddress(to);

  const imageUrl = `${base}/frames/image?type=tip&to=${encodeURIComponent(to)}&token=${destToken}&chain=${destChain}${isCrossChain ? `&sourceChain=${sourceChain}&sourceToken=${sourceToken}` : ''}`;

  // Build shared params for all buttons
  const sharedParams = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) { if (v) sharedParams.set(k, v); }

  const txTarget = (amt: string) => {
    const params = new URLSearchParams(sharedParams);
    params.set('amount', amt);
    return `${base}/frames/tip/tx?${params.toString()}`;
  };

  const postUrl = `${base}/frames/tip/post?${sharedParams.toString()}`;
  const customParams = new URLSearchParams(sharedParams);
  customParams.set('step', 'custom');

  const title = `Tip ${shortTo} in ${destToken} on ${destChainName}`;

  return {
    title,
    openGraph: { title, images: [{ url: imageUrl, width: 1200, height: 630 }] },
    other: {
      'fc:frame': 'vNext',
      'fc:frame:image': imageUrl,
      'fc:frame:image:aspect_ratio': '1.91:1',
      'fc:frame:button:1': '$1',
      'fc:frame:button:1:action': 'tx',
      'fc:frame:button:1:target': txTarget('1'),
      'fc:frame:button:2': '$5',
      'fc:frame:button:2:action': 'tx',
      'fc:frame:button:2:target': txTarget('5'),
      'fc:frame:button:3': '$10',
      'fc:frame:button:3:action': 'tx',
      'fc:frame:button:3:target': txTarget('10'),
      'fc:frame:button:4': 'Custom',
      'fc:frame:button:4:action': 'post',
      'fc:frame:button:4:target': `${base}/frames/tip/post?${customParams.toString()}`,
      'fc:frame:input:text': '',
      'fc:frame:post_url': postUrl,
    },
  };
}

export default async function TipFramePage({ searchParams }: Props) {
  const p = await searchParams;
  const to = p.to || '';
  const destChain = p.destChain || p.chain || 'base';
  const destToken = p.destToken || p.token || 'USDC';
  const sourceChain = p.sourceChain || destChain;
  const sourceToken = p.sourceToken || destToken;
  const isCrossChain = p.crossChain === 'true';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Tip {shortAddress(to)}</h1>
        <p style={{ color: '#a1a1aa' }}>{destToken} on {getChainDisplayName(destChain)} &mdash; $1, $5, $10, or custom</p>
        {isCrossChain && (
          <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Paid with {sourceToken} on {getChainDisplayName(sourceChain)} · Cross-chain via goBlink
          </p>
        )}
        <p style={{ color: '#a1a1aa', marginTop: '1rem', fontSize: '0.875rem' }}>Open this link in Farcaster to tip via Frame.</p>
      </div>
    </div>
  );
}
