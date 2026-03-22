import { Metadata } from 'next';
import { getBaseUrl, getChainDisplayName, shortAddress } from '../utils/frame-helpers';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const to = p.to || '';
  const amount = p.amount || '0';
  const base = getBaseUrl();

  const sourceChain = p.sourceChain || p.chain || 'base';
  const sourceToken = p.sourceToken || p.token || 'USDC';
  const destChain = p.destChain || p.chain || 'base';
  const destToken = p.destToken || p.token || 'USDC';
  const isCrossChain = p.crossChain === 'true';

  const destChainName = getChainDisplayName(destChain);
  const sourceChainName = getChainDisplayName(sourceChain);
  const shortTo = shortAddress(to);

  const imageUrl = `${base}/frames/image?type=pay&to=${encodeURIComponent(to)}&amount=${amount}&token=${destToken}&chain=${destChain}${isCrossChain ? `&sourceChain=${sourceChain}&sourceToken=${sourceToken}` : ''}`;

  // Pass ALL params through to tx endpoint
  const allParams = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) { if (v) allParams.set(k, v); }
  const txTarget = `${base}/frames/pay/tx?${allParams.toString()}`;
  const postUrl = `${base}/frames/pay/post?${allParams.toString()}`;

  const buttonLabel = isCrossChain
    ? `Pay ${amount} ${destToken} (via ${sourceToken})`
    : `Pay ${amount} ${destToken}`;

  const title = isCrossChain
    ? `Pay ${amount} ${destToken} to ${shortTo} on ${destChainName} (from ${sourceChainName})`
    : `Pay ${amount} ${destToken} to ${shortTo} on ${destChainName}`;

  return {
    title,
    openGraph: { title, images: [{ url: imageUrl, width: 1200, height: 630 }] },
    other: {
      'fc:frame': 'vNext',
      'fc:frame:image': imageUrl,
      'fc:frame:image:aspect_ratio': '1.91:1',
      'fc:frame:button:1': buttonLabel,
      'fc:frame:button:1:action': 'tx',
      'fc:frame:button:1:target': txTarget,
      'fc:frame:post_url': postUrl,
    },
  };
}

export default async function PayFramePage({ searchParams }: Props) {
  const p = await searchParams;
  const to = p.to || '';
  const amount = p.amount || '0';
  const destChain = p.destChain || p.chain || 'base';
  const destToken = p.destToken || p.token || 'USDC';
  const sourceChain = p.sourceChain || destChain;
  const sourceToken = p.sourceToken || destToken;
  const isCrossChain = p.crossChain === 'true';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Pay {amount} {destToken}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>to {shortAddress(to)} on {getChainDisplayName(destChain)}</p>
        {isCrossChain && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Paid with {sourceToken} on {getChainDisplayName(sourceChain)} · Cross-chain via goBlink
          </p>
        )}
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.875rem' }}>Open this link in Farcaster to pay via Frame.</p>
      </div>
    </div>
  );
}
