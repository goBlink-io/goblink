import { Metadata } from 'next';
import { getBaseUrl, getChainDisplayName, shortAddress } from '../utils/frame-helpers';

type Props = {
  searchParams: Promise<{
    to?: string; token?: string; chain?: string;
    sourceChain?: string; sourceToken?: string;
    destChain?: string; destToken?: string;
    crossChain?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const to = params.to || '';
  const base = getBaseUrl();

  const sourceChain = params.sourceChain || params.chain || 'base';
  const sourceToken = (params.sourceToken || params.token || 'USDC').toUpperCase();
  const destChain = params.destChain || params.chain || 'base';
  const destToken = (params.destToken || params.token || 'USDC').toUpperCase();
  const isCrossChain = params.crossChain === 'true' || sourceChain !== destChain || sourceToken !== destToken;

  const destChainName = getChainDisplayName(destChain);
  const shortTo = shortAddress(to);

  const imageUrl = `${base}/frames/image?type=tip&to=${encodeURIComponent(to)}&token=${destToken}&chain=${destChain}${isCrossChain ? `&sourceChain=${sourceChain}&sourceToken=${sourceToken}` : ''}`;

  const txParams = (amt: string) => {
    const p = new URLSearchParams({
      to, amount: amt, token: destToken, chain: destChain,
      sourceChain, sourceToken, destChain, destToken,
      ...(isCrossChain ? { crossChain: 'true' } : {}),
    });
    return `${base}/frames/tip/tx?${p.toString()}`;
  };

  const postParams = new URLSearchParams({
    to, token: destToken, chain: destChain,
    ...(isCrossChain ? { sourceChain, sourceToken, destChain, destToken, crossChain: 'true' } : {}),
  });
  const postUrl = `${base}/frames/tip/post?${postParams.toString()}`;

  const customParams = new URLSearchParams({
    to, token: destToken, chain: destChain,
    ...(isCrossChain ? { sourceChain, sourceToken, destChain, destToken, crossChain: 'true' } : {}),
    step: 'custom',
  });

  const title = `Tip ${shortTo} in ${destToken} on ${destChainName}`;

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
      'fc:frame:button:1:target': txParams('1'),
      'fc:frame:button:2': '$5',
      'fc:frame:button:2:action': 'tx',
      'fc:frame:button:2:target': txParams('5'),
      'fc:frame:button:3': '$10',
      'fc:frame:button:3:action': 'tx',
      'fc:frame:button:3:target': txParams('10'),
      'fc:frame:button:4': 'Custom',
      'fc:frame:button:4:action': 'post',
      'fc:frame:button:4:target': `${base}/frames/tip/post?${customParams.toString()}`,
      'fc:frame:input:text': '',
      'fc:frame:post_url': postUrl,
    },
  };
}

export default async function TipFramePage({ searchParams }: Props) {
  const params = await searchParams;
  const to = params.to || '';
  const destChain = params.destChain || params.chain || 'base';
  const destToken = (params.destToken || params.token || 'USDC').toUpperCase();
  const sourceChain = params.sourceChain || destChain;
  const sourceToken = (params.sourceToken || destToken).toUpperCase();
  const isCrossChain = sourceChain !== destChain || sourceToken !== destToken;
  const destChainName = getChainDisplayName(destChain);
  const sourceChainName = getChainDisplayName(sourceChain);

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
          {destToken} on {destChainName} &mdash; $1, $5, $10, or custom amount
        </p>
        {isCrossChain && (
          <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Paid with {sourceToken} on {sourceChainName} · Cross-chain via goBlink
          </p>
        )}
        <p style={{ color: '#a1a1aa', marginTop: '1rem', fontSize: '0.875rem' }}>
          Open this link in Farcaster to tip via Frame.
        </p>
      </div>
    </div>
  );
}
