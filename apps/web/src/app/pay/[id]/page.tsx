import { Metadata } from 'next';
import { decodePaymentRequest, shortAddress, PaymentRequestData } from '@/lib/payment-requests';
import { getChainLogo } from '@/lib/chain-logos';
import { supabase } from '@/lib/server/db';
import PayFulfillClient from './PayFulfillClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Resolve a payment link ID — try short ID (DB) first, fall back to base64 decode.
 * Returns the PaymentRequestData and the canonical link_id (base64) for status tracking.
 */
async function resolvePaymentLink(id: string): Promise<{ data: PaymentRequestData | null; linkId: string }> {
  // Short IDs are 8 chars alphanumeric/dash/underscore — base64 payloads are much longer
  if (id.length <= 12) {
    const { data: row } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', id)
      .single();

    if (row) {
      const paymentData: PaymentRequestData = {
        recipient: row.recipient,
        toChain: row.to_chain,
        toToken: row.to_token,
        amount: row.amount,
        memo: row.memo || undefined,
        name: row.requester_name || undefined,
        createdAt: new Date(row.created_at).getTime(),
      };
      return { data: paymentData, linkId: id };
    }
  }

  // Fall back to legacy base64 decode
  return { data: decodePaymentRequest(id), linkId: id };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await resolvePaymentLink(id);

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
  const { data, linkId } = await resolvePaymentLink(id);
  const toLogo = data ? getChainLogo(data.toChain) : null;

  return <PayFulfillClient data={data} toLogo={toLogo} linkId={linkId} />;
}
