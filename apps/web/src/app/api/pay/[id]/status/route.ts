import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server/db';
import { decodePaymentRequest } from '@/lib/payment-requests';
import { checkRateLimit, getClientIdentifier, RateLimitConfigs } from '@/lib/rate-limit';
import { addRateLimitHeaders } from '@/lib/api-response';

const LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

  if (row) {
    return addRateLimitHeaders(
      NextResponse.json(row),
      rateLimit
    );
  }

  return addRateLimitHeaders(
    NextResponse.json({ status: 'active', expiresAt: new Date(data.createdAt + LINK_TTL_MS).toISOString() }),
    rateLimit
  );
}
