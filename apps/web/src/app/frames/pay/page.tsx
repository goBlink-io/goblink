import { Metadata } from 'next';
import { getBaseUrl, getChainDisplayName, shortAddress } from '../utils/frame-helpers';

type Props = {
  searchParams: Promise<{
    to?: string; amount?: string; token?: string; chain?: string;
    sourceChain?: string; sourceToken?: string;
    destChain?: string; destToken?: string;
    crossChain?: string;
  }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const to = params.to || '';
  const amount = params.amount || '0';
  const base = getBaseUrl();

  // Cross-chain params
  const sourceChain = params.sourceChain || params.chain || 'base';
  const sourceToken = (params.sourceToken || params.token || 'USDC').toUpperCase();
  const destChain = params.destChain || params.chain || 'base';
  const destToken = (params.destToken || params.token || 'USDC').toUpperCase();
  const isCrossChain = params.crossChain === 'true' || sourceChain !== destChain || sourceToken !== destToken;

  const destChainName = getChainDisplayName(destChain);
  const sourceChainName = getChainDisplayName(sourceChain);
  const shortTo = shortAddress(to);

  const imageUrl = `${base}/frames/image?type=pay&to=${encodeURIComponent(to)}&amount=${amount}&token=${destToken}&chain=${destChain}${isCrossChain ? `&sourceChain=${sourceChain}&sourceToken=${sourceToken}` : ''}`;

  // Build tx target with all params
  const txParams = new URLSearchParams({
    to, amount, token: destToken, chain: destChain,
    sourceChain, sourceToken, destChain, destToken,
    ...(isCrossChain ? { crossChain: 'true' } : {}),
  });
  const txTarget = `${base}/frames/pay/tx?${txParams.toString()}`;

  const postParams = new URLSearchParams({
    to, amount, token: destToken, chain: destChain,
    ...(isCrossChain ? { sourceChain, sourceToken, destChain, destToken, crossChain: 'true' } : {}),
  });
  const postUrl = `${base}/frames/pay/post?${postParams.toString()}`;

  const buttonLabel = isCrossChain
    ? `Pay ${amount} ${destToken} (${sourceToken} on ${sourceChainName})`
    : `Pay ${amount} ${destToken}`;

  const title = isCrossChain
    ? `Pay ${amount} ${destToken} to ${shortTo} on ${destChainName} (from ${sourceChainName})`
    : `Pay ${amount} ${destToken} to ${shortTo} on ${destChainName}`;

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
      'fc:frame:button:1': buttonLabel,
      'fc:frame:button:1:action': 'tx',
      'fc:frame:button:1:target': txTarget,
      'fc:frame:post_url': postUrl,
    },
  };
}

export default async function PayFramePage({ searchParams }: Props) {
  const params = await searchParams;
  const to = params.to || '';
  const amount = params.amount || '0';
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
          Pay {amount} {destToken}
        </h1>
        <p style={{ color: '#a1a1aa' }}>
          to {shortAddress(to)} on {destChainName}
        </p>
        {isCrossChain && (
          <p style={{ color: '#71717a', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Paid with {sourceToken} on {sourceChainName} · Cross-chain via goBlink
          </p>
        )}
        <p style={{ color: '#a1a1aa', marginTop: '1rem', fontSize: '0.875rem' }}>
          Open this link in Farcaster to pay via Frame.
        </p>
      </div>
    </div>
  );
}
