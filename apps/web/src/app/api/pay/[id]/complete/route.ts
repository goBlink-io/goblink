import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server/db';
import { decodePaymentRequest } from '@/lib/payment-requests';
import { logAudit, getClientIp } from '@/lib/server/audit';

/**
 * POST /api/pay/[id]/complete
 * Called when the user signs the transaction. Marks link as 'processing'.
 * A second PATCH call (outcome) promotes it to 'paid' once confirmed on-chain.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = decodePaymentRequest(id);

  if (!data) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { sendTxHash, depositAddress, payerAddress, payerChain } = body;

  // Upsert — idempotent if called twice
  const { error } = await supabase
    .from('payment_link_status')
    .upsert({
      link_id: id,
      status: 'processing',
      recipient: data.recipient,
      to_chain: data.toChain,
      to_token: data.toToken,
      amount: data.amount,
      memo: data.memo || null,
      requester_name: data.name || null,
      link_created_at: data.createdAt,
      send_tx_hash: sendTxHash || null,
      deposit_address: depositAddress || null,
      payer_address: payerAddress || null,
      payer_chain: payerChain || null,
    }, { onConflict: 'link_id', ignoreDuplicates: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ip = getClientIp(request.headers);
  logAudit({
    actor: ip,
    action: 'payment_request.completed',
    resourceType: 'payment_request',
    resourceId: id,
    ipAddress: ip,
  });

  return NextResponse.json({ ok: true, status: 'processing' });
}

/**
 * PATCH /api/pay/[id]/complete
 * Called when 1Click confirms the on-chain outcome.
 * Promotes status from 'processing' → 'paid' or 'failed'.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { fulfillmentTxHash, outcome } = body; // outcome: 'paid' | 'failed'

  const status = outcome === 'failed' ? 'failed' : 'paid';

  const { error } = await supabase
    .from('payment_link_status')
    .update({
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      fulfillment_tx_hash: fulfillmentTxHash || null,
    })
    .eq('link_id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}
