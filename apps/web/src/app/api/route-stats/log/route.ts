import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server/db';

/**
 * POST /api/route-stats/log
 * Log a completed swap for route confidence aggregation.
 * Called client-side when TransactionModal detects SUCCESS/FAILED/REFUNDED.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromChain, toChain, fromToken, toToken, success, durationSecs, amountUsd } = body;

    if (!fromChain || !toChain || !fromToken || !toToken || typeof success !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase.from('route_stats').insert({
      from_chain: fromChain,
      to_chain: toChain,
      from_token: fromToken,
      to_token: toToken,
      success,
      duration_secs: durationSecs ?? null,
      amount_usd: amountUsd ?? null,
    });

    if (error) {
      console.error('Failed to log route stat:', error);
      // Don't fail the user experience — this is analytics
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    // Refresh materialized view in background (best-effort)
    void Promise.resolve(supabase.rpc('refresh_route_confidence')).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
