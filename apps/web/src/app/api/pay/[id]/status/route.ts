import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server/db';
import { decodePaymentRequest } from '@/lib/payment-requests';
import * as oneclick from '@/lib/server/oneclick';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { addRateLimitHeaders } from '@/lib/api-response';

const LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const TERMINAL_STATUSES = ['SUCCESS', 'COMPLETED', 'REFUNDED', 'FAILED'];
const SUCCESS_STATUSES   = ['SUCCESS', 'COMPLETED'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, RateLimitConfigs.tokens);

  const { id } = await params;

  // Decode to check expiry (no DB hit needed)
  const data = decodePaymentRequest(id);
  if (!data) {
    return addRateLimitHeaders(
      NextResponse.json({ status: 'invalid' }, { status: 404 }),
      rateLimit
    );
  }

  const ageMs = Date.now() - data.createdAt;
  if (ageMs > LINK_TTL_MS) {
    return addRateLimitHeaders(
      NextResponse.json({ status: 'expired', expiredAt: new Date(data.createdAt + LINK_TTL_MS).toISOString() }),
      rateLimit
    );
  }

  // Check DB for paid/processing status
  const { data: row } = await supabase
    .from('payment_link_status')
    .select('status, paid_at, send_tx_hash, fulfillment_tx_hash, payer_address, payer_chain, deposit_address')
    .eq('link_id', id)
    .maybeSingle();

  if (!row) {
    return addRateLimitHeaders(
      NextResponse.json({ status: 'active', expiresAt: new Date(data.createdAt + LINK_TTL_MS).toISOString() }),
      rateLimit
    );
  }

  // ── Self-healing: if still processing, check 1Click directly ──────────────
  // This means the page heals on every poll — no client callback required.
  if (row.status === 'processing' && row.deposit_address) {
    try {
      const execution = await oneclick.getExecutionStatus(row.deposit_address);
      const rawStatus = (execution.status as string).toUpperCase();

      if (TERMINAL_STATUSES.includes(rawStatus)) {
        const isSuccess = SUCCESS_STATUSES.includes(rawStatus);
        const newStatus = isSuccess ? 'paid' : 'failed';
        const fulfillmentTxHash =
          (execution as Record<string, unknown>).fulfillmentTxHash as string | undefined ||
          (execution as Record<string, unknown>).destinationTxHash as string | undefined ||
          null;

        // Promote in DB
        await supabase
          .from('payment_link_status')
          .update({
            status: newStatus,
            ...(isSuccess && { paid_at: new Date().toISOString() }),
            ...(fulfillmentTxHash && { fulfillment_tx_hash: fulfillmentTxHash }),
          })
          .eq('link_id', id);

        return addRateLimitHeaders(
          NextResponse.json({
            ...row,
            status: newStatus,
            paid_at: isSuccess ? new Date().toISOString() : null,
            fulfillment_tx_hash: fulfillmentTxHash,
          }),
          rateLimit
        );
      }
    } catch {
      // 1Click unavailable — return current DB state, client will retry
    }
  }

  return addRateLimitHeaders(
    NextResponse.json(row),
    rateLimit
  );
}
