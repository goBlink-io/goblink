import { Metadata } from 'next';
import { getBaseUrl, getChainDisplayName, shortAddress } from '../utils/frame-helpers';

type Props = {
  searchParams: Promise<{ to?: string; amount?: string; token?: string; chain?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const to = params.to || '';
  const amount = params.amount || '0';
  const token = (params.token || 'USDC').toUpperCase();
  const chain = params.chain || 'base';
  const base = getBaseUrl();
  const chainName = getChainDisplayName(chain);
  const shortTo = shortAddress(to);

  const imageUrl = `${base}/frames/image?type=pay&to=${encodeURIComponent(to)}&amount=${amount}&token=${token}&chain=${chain}`;
  const postUrl = `${base}/frames/pay/post?to=${encodeURIComponent(to)}&amount=${amount}&token=${token}&chain=${chain}`;

  const title = `Pay ${amount} ${token} to ${shortTo} on ${chainName}`;

  return {
    title,
    openGraph: {
      title,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    other: {
      'fc:frame': 'vNext',
      'fc:frame:image': imageUrl,
      'fc:frame:image:aspect_ratio': '1.91:1',
      'fc:frame:button:1': `Pay ${amount} ${token}`,
      'fc:frame:button:1:action': 'tx',
      'fc:frame:button:1:target': `${base}/frames/pay/tx?to=${encodeURIComponent(to)}&amount=${amount}&token=${token}&chain=${chain}`,
      'fc:frame:post_url': postUrl,
    },
  };
}

export default async function PayFramePage({ searchParams }: Props) {
  const params = await searchParams;
  const to = params.to || '';
  const amount = params.amount || '0';
  const token = (params.token || 'USDC').toUpperCase();
  const chain = params.chain || 'base';
  const chainName = getChainDisplayName(chain);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        color: '#fafafa',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Pay {amount} {token}
        </h1>
        <p style={{ color: '#a1a1aa' }}>
          to {shortAddress(to)} on {chainName}
        </p>
        <p style={{ color: '#a1a1aa', marginTop: '1rem', fontSize: '0.875rem' }}>
          Open this link in Farcaster to pay via Frame.
        </p>
      </div>
    </div>
  );
}
