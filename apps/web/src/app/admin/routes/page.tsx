'use client';

import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/admin';

interface RouteRow {
  from_chain: string;
  to_chain: string;
  from_token: string;
  to_token: string;
  total_swaps: number;
  successful_swaps: number;
  success_rate: number;
  avg_duration_secs: number;
  avg_amount_usd: number;
  last_swap_at: string;
}

function rateColor(rate: number): string {
  if (rate >= 95) return 'text-emerald-400';
  if (rate >= 85) return 'text-amber-400';
  return 'text-red-400';
}

function rateBg(rate: number): string {
  if (rate >= 95) return 'bg-emerald-500/10';
  if (rate >= 85) return 'bg-amber-500/10';
  return 'bg-red-500/10';
}

function fmtDuration(secs: number): string {
  if (!secs) return '-';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function timeAgo(iso: string): string {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<{ routes: RouteRow[] }>('/api/admin/routes')
      .then((d) => {
        if (d) setRoutes(d.routes);
        else setError('Failed to load routes');
      })
      .catch(() => setError('Failed to load routes'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Routes</h1>
      <p className="text-sm text-zinc-400">
        Route confidence data (routes with 3+ swaps)
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-red-400 text-sm">{error}</div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">
                  Total Swaps
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">
                  Success Rate
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">
                  Avg Time
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">
                  Avg USD
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">
                  Last Used
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : !routes.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    No route data yet
                  </td>
                </tr>
              ) : (
                routes.map((r) => (
                  <tr
                    key={`${r.from_chain}/${r.from_token}-${r.to_chain}/${r.to_token}`}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-zinc-300">
                        {r.from_chain}/{r.from_token}
                      </span>
                      <span className="text-zinc-600 mx-1.5">&rarr;</span>
                      <span className="text-zinc-300">
                        {r.to_chain}/{r.to_token}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-200 text-right font-medium">
                      {r.total_swaps}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${rateColor(r.success_rate)} ${rateBg(r.success_rate)}`}
                      >
                        {r.success_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-right">
                      {fmtDuration(r.avg_duration_secs)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-right">
                      ${parseFloat(String(r.avg_amount_usd)).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-right text-xs">
                      {timeAgo(r.last_swap_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
