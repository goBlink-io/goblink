import { Metadata } from 'next';
import { decodeTransferLink, formatElapsed } from '@/lib/transfer-links';
import { getChainLogo } from '@/lib/chain-logos';
import TransferReceiptClient from './TransferReceiptClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = decodeTransferLink(id);

  if (!data) {
    return {
      title: 'Transfer Receipt · goBlink',
      description: 'View cross-chain transfer details on goBlink',
    };
  }

  const elapsed = data.elapsedSeconds ? formatElapsed(data.elapsedSeconds) : '~30s';
  const title = `I transferred ${data.amountIn} ${data.fromToken} → ${data.amountOut} ${data.toToken} in ${elapsed} with goBlink ⚡`;
  const description = `${data.fromToken} on ${data.fromChain} → ${data.toToken} on ${data.toChain}. No bridges. No waiting. Try goBlink for instant cross-chain transfers.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'goBlink',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@goblink_xyz',
    },
  };
}

export default async function TransferReceiptPage({ params }: PageProps) {
  const { id } = await params;
  const data = decodeTransferLink(id);
  const fromLogo = data ? getChainLogo(data.fromChain) : null;
  const toLogo = data ? getChainLogo(data.toChain) : null;

  return (
    <TransferReceiptClient
      data={data}
      fromLogo={fromLogo}
      toLogo={toLogo}
    />
  );
}
