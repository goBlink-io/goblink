import { Metadata } from 'next';
import { decodePaymentRequest, shortAddress } from '@/lib/payment-requests';
import { getChainLogo } from '@/lib/chain-logos';
import PayFulfillClient from './PayFulfillClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = decodePaymentRequest(id);

  if (!data) {
    return {
      title: 'Payment Request · goBlink',
      description: 'Pay cross-chain with goBlink',
    };
  }

  const requester = data.name || shortAddress(data.recipient);
  const title = `${requester} requests ${data.amount} ${data.toToken} on ${data.toChain}`;
  const description = data.memo
    ? `"${data.memo}" — Pay with any token from any chain using goBlink.`
    : `Pay ${data.amount} ${data.toToken} to ${requester} on ${data.toChain} — use any token from any chain.`;

  return {
    title: `${title} · goBlink`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'goBlink',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function PayFulfillPage({ params }: PageProps) {
  const { id } = await params;
  const data = decodePaymentRequest(id);
  const toLogo = data ? getChainLogo(data.toChain) : null;

  return <PayFulfillClient data={data} toLogo={toLogo} />;
}
