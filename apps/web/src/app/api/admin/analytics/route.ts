import { verifyAdmin } from '@/lib/server/admin-auth';
import { supabase } from '@/lib/server/db';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await verifyAdmin())) return errorResponse('Unauthorized', 401, { code: 'UNAUTHORIZED' });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: txns } = await supabase
    .from('transaction_history')
    .select('wallet_address, from_chain, to_chain, from_token, to_token, amount_usd, fee_amount, created_at')
    .limit(50000);

  const rows = txns || [];

  // --- Revenue: daily fee revenue (last 30 days) ---
  const recentRows = rows.filter((r) => r.created_at >= thirtyDaysAgo);
  const dailyFeeMap: Record<string, number> = {};
  for (const row of recentRows) {
    const day = row.created_at.slice(0, 10);
    dailyFeeMap[day] = (dailyFeeMap[day] || 0) + (parseFloat(row.fee_amount) || 0);
  }
  const dailyFees = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyFees.push({ date: key, fees: Math.round((dailyFeeMap[key] || 0) * 100) / 100 });
  }

  // --- User Segments ---
  const walletVolume: Record<string, { volume: number; count: number; lastActive: string }> = {};
  for (const row of rows) {
    const w = row.wallet_address;
    if (!w) continue;
    if (!walletVolume[w]) walletVolume[w] = { volume: 0, count: 0, lastActive: row.created_at };
    walletVolume[w].volume += parseFloat(row.amount_usd) || 0;
    walletVolume[w].count += 1;
    if (row.created_at > walletVolume[w].lastActive) walletVolume[w].lastActive = row.created_at;
  }

  const segments = { whales: { count: 0, volume: 0 }, dolphins: { count: 0, volume: 0 }, fish: { count: 0, volume: 0 }, minnows: { count: 0, volume: 0 } };
  const totalVolume = Object.values(walletVolume).reduce((s, w) => s + w.volume, 0);

  for (const w of Object.values(walletVolume)) {
    if (w.volume > 10000) { segments.whales.count++; segments.whales.volume += w.volume; }
    else if (w.volume > 1000) { segments.dolphins.count++; segments.dolphins.volume += w.volume; }
    else if (w.volume > 100) { segments.fish.count++; segments.fish.volume += w.volume; }
    else { segments.minnows.count++; segments.minnows.volume += w.volume; }
  }

  const userSegments = [
    { name: 'Whales (>$10K)', ...segments.whales, pct: totalVolume > 0 ? Math.round((segments.whales.volume / totalVolume) * 1000) / 10 : 0 },
    { name: 'Dolphins ($1K-$10K)', ...segments.dolphins, pct: totalVolume > 0 ? Math.round((segments.dolphins.volume / totalVolume) * 1000) / 10 : 0 },
    { name: 'Fish ($100-$1K)', ...segments.fish, pct: totalVolume > 0 ? Math.round((segments.fish.volume / totalVolume) * 1000) / 10 : 0 },
    { name: 'Minnows (<$100)', ...segments.minnows, pct: totalVolume > 0 ? Math.round((segments.minnows.volume / totalVolume) * 1000) / 10 : 0 },
  ];

  // Top 10 wallets
  const topWallets = Object.entries(walletVolume)
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 10)
    .map(([addr, data]) => ({ address: addr, volume: Math.round(data.volume * 100) / 100, txCount: data.count, lastActive: data.lastActive }));

  // --- Chain Analytics ---
  const chainCounts: Record<string, number> = {};
  const chainVolume: Record<string, number> = {};
  for (const row of rows) {
    const usd = parseFloat(row.amount_usd) || 0;
    if (row.from_chain) {
      chainCounts[row.from_chain] = (chainCounts[row.from_chain] || 0) + 1;
      chainVolume[row.from_chain] = (chainVolume[row.from_chain] || 0) + usd;
    }
    if (row.to_chain) {
      chainCounts[row.to_chain] = (chainCounts[row.to_chain] || 0) + 1;
      chainVolume[row.to_chain] = (chainVolume[row.to_chain] || 0) + usd;
    }
  }
  const chains = Object.entries(chainCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([chain, count]) => ({ chain, count, volume: Math.round((chainVolume[chain] || 0) * 100) / 100 }));

  // Top 10 routes
  const routeCounts: Record<string, { count: number; volume: number }> = {};
  for (const row of rows) {
    if (!row.from_chain || !row.to_chain) continue;
    const key = `${row.from_chain}\u2192${row.to_chain}`;
    if (!routeCounts[key]) routeCounts[key] = { count: 0, volume: 0 };
    routeCounts[key].count += 1;
    routeCounts[key].volume += parseFloat(row.amount_usd) || 0;
  }
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 10)
    .map(([route, data]) => ({ route, count: data.count, volume: Math.round(data.volume * 100) / 100 }));

  // --- Token Analytics ---
  const tokenVolume: Record<string, { count: number; volume: number }> = {};
  for (const row of rows) {
    const usd = parseFloat(row.amount_usd) || 0;
    for (const t of [row.from_token, row.to_token]) {
      if (!t) continue;
      if (!tokenVolume[t]) tokenVolume[t] = { count: 0, volume: 0 };
      tokenVolume[t].count += 1;
      tokenVolume[t].volume += usd;
    }
  }
  const topTokens = Object.entries(tokenVolume)
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 10)
    .map(([token, data]) => ({ token, count: data.count, volume: Math.round(data.volume * 100) / 100 }));

  // Top 10 token pairs
  const pairVolume: Record<string, { count: number; volume: number }> = {};
  for (const row of rows) {
    if (!row.from_token || !row.to_token) continue;
    const key = `${row.from_token}\u2192${row.to_token}`;
    if (!pairVolume[key]) pairVolume[key] = { count: 0, volume: 0 };
    pairVolume[key].count += 1;
    pairVolume[key].volume += parseFloat(row.amount_usd) || 0;
  }
  const topTokenPairs = Object.entries(pairVolume)
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 10)
    .map(([pair, data]) => ({ pair, count: data.count, volume: Math.round(data.volume * 100) / 100 }));

  // --- Activity Trends ---
  // Daily active wallets (last 30 days)
  const dailyWalletSets: Record<string, Set<string>> = {};
  for (const row of recentRows) {
    if (!row.wallet_address) continue;
    const day = row.created_at.slice(0, 10);
    if (!dailyWalletSets[day]) dailyWalletSets[day] = new Set();
    dailyWalletSets[day].add(row.wallet_address);
  }
  const dailyActiveWallets = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyActiveWallets.push({ date: key, wallets: dailyWalletSets[key]?.size || 0 });
  }

  // Average tx size (last 30 days)
  const dailyTxSize: Record<string, { total: number; count: number }> = {};
  for (const row of recentRows) {
    const day = row.created_at.slice(0, 10);
    if (!dailyTxSize[day]) dailyTxSize[day] = { total: 0, count: 0 };
    dailyTxSize[day].total += parseFloat(row.amount_usd) || 0;
    dailyTxSize[day].count += 1;
  }
  const avgTxSize = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const entry = dailyTxSize[key];
    avgTxSize.push({ date: key, avg: entry ? Math.round((entry.total / entry.count) * 100) / 100 : 0 });
  }

  // Peak hours (UTC)
  const hourCounts: number[] = Array(24).fill(0);
  for (const row of rows) {
    const h = new Date(row.created_at).getUTCHours();
    hourCounts[h]++;
  }
  const peakHours = hourCounts.map((count, hour) => ({ hour: `${hour.toString().padStart(2, '0')}:00`, count }));

  return successResponse({
    dailyFees,
    userSegments,
    topWallets,
    chains,
    topRoutes,
    topTokens,
    topTokenPairs,
    dailyActiveWallets,
    avgTxSize,
    peakHours,
  });
}
