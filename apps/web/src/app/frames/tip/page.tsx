import { Metadata } from 'next';
import { getBaseUrl, getChainDisplayName, shortAddress } from '../utils/frame-helpers';

type Props = {
  searchParams: Promise<{ to?: string; token?: string; chain?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const to = params.to || '';
  const token = (params.token || 'USDC').toUpperCase();
  const chain = params.chain || 'base';
  const base = getBaseUrl();
  const chainName = getChainDisplayName(chain);
  const shortTo = shortAddress(to);

  const imageUrl = `${base}/frames/image?type=tip&to=${encodeURIComponent(to)}&token=${token}&chain=${chain}`;
  const txTarget = (amt: string) =>
    `${base}/frames/tip/tx?to=${encodeURIComponent(to)}&amount=${amt}&token=${token}&chain=${chain}`;
  const postUrl = `${base}/frames/tip/post?to=${encodeURIComponent(to)}&token=${token}&chain=${chain}`;

  const title = `Tip ${shortTo} in ${token} on ${chainName}`;

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
      'fc:frame:button:4:target': `${base}/frames/tip/post?to=${encodeURIComponent(to)}&token=${token}&chain=${chain}&step=custom`,
      'fc:frame:input:text': '',
      'fc:frame:post_url': postUrl,
    },
  };
}

export default async function TipFramePage({ searchParams }: Props) {
  const params = await searchParams;
  const to = params.to || '';
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
          Tip {shortAddress(to)}
        </h1>
        <p style={{ color: '#a1a1aa' }}>
          {token} on {chainName} &mdash; $1, $5, $10, or custom amount
        </p>
        <p style={{ color: '#a1a1aa', marginTop: '1rem', fontSize: '0.875rem' }}>
          Open this link in Farcaster to tip via Frame.
        </p>
      </div>
    </div>
  );
}
