import { verifyAdmin } from '@/lib/server/admin-auth';
import { supabase } from '@/lib/server/db';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await verifyAdmin())) return errorResponse('Unauthorized', 401);

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();

  const [{ count: totalCount }, { count: linkCount }, { data: txns }] =
    await Promise.all([
      supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('payment_links')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('transactions')
        .select('amount_usd, status, created_at')
        .limit(50000),
    ]);

  const rows = txns || [];
  const totalVolume = rows.reduce(
    (s, r) => s + (parseFloat(r.amount_usd) || 0),
    0,
  );
  const successCount = rows.filter((r) => r.status === 'success').length;
  const successRate =
    rows.length > 0 ? (successCount / rows.length) * 100 : 0;

  const todayRows = rows.filter((r) => r.created_at >= todayStart);
  const todayVolume = todayRows.reduce(
    (s, r) => s + (parseFloat(r.amount_usd) || 0),
    0,
  );

  // Daily volume for last 30 days
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const recentRows = rows.filter((r) => r.created_at >= thirtyDaysAgo);
  const dailyMap: Record<string, { volume: number; count: number }> = {};
  for (const row of recentRows) {
    const day = row.created_at.slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { volume: 0, count: 0 };
    dailyMap[day].volume += parseFloat(row.amount_usd) || 0;
    dailyMap[day].count += 1;
  }

  const dailyVolume = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyVolume.push({
      date: key,
      volume: Math.round((dailyMap[key]?.volume || 0) * 100) / 100,
      count: dailyMap[key]?.count || 0,
    });
  }

  return successResponse({
    totalTransactions: totalCount || 0,
    totalVolume: Math.round(totalVolume * 100) / 100,
    successRate: Math.round(successRate * 10) / 10,
    activePaymentLinks: linkCount || 0,
    todayTransactions: todayRows.length,
    todayVolume: Math.round(todayVolume * 100) / 100,
    dailyVolume,
  });
}
