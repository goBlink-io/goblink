'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { adminFetch, fmtUsd, fmtNumber, shortAddr } from '@/lib/admin';

interface AnalyticsData {
  dailyFees: { date: string; fees: number }[];
  userSegments: { name: string; count: number; volume: number; pct: number }[];
  topWallets: { address: string; volume: number; txCount: number; lastActive: string }[];
  chains: { chain: string; count: number; volume: number }[];
  topRoutes: { route: string; count: number; volume: number }[];
  topTokens: { token: string; count: number; volume: number }[];
  topTokenPairs: { pair: string; count: number; volume: number }[];
  dailyActiveWallets: { date: string; wallets: number }[];
  avgTxSize: { date: string; avg: number }[];
  peakHours: { hour: string; count: number }[];
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#6b7280'];

const tooltipStyle = {
  contentStyle: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '13px' },
  labelStyle: { color: '#a1a1aa' },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch<AnalyticsData>('/api/admin/analytics')
      .then((d) => d && setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      {/* Revenue */}
      <Section title="Revenue">
        <Card>
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Daily Fee Revenue — Last 30 Days</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyFees}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `$${fmtNumber(v)}`} axisLine={false} tickLine={false} width={60} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, 'Fees']} />
                <Bar dataKey="fees" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>

      {/* User Segments */}
      <Section title="User Segments">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Volume by Segment</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.userSegments} dataKey="volume" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {data.userSegments.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v) => [fmtUsd(Number(v ?? 0)), 'Volume']} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Segment Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-left border-b border-zinc-800">
                    <th className="pb-2 font-medium">Segment</th>
                    <th className="pb-2 font-medium text-right">Users</th>
                    <th className="pb-2 font-medium text-right">Volume</th>
                    <th className="pb-2 font-medium text-right">% Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {data.userSegments.map((seg) => (
                    <tr key={seg.name} className="border-b border-zinc-800/50 text-zinc-300">
                      <td className="py-2">{seg.name}</td>
                      <td className="py-2 text-right">{seg.count}</td>
                      <td className="py-2 text-right">{fmtUsd(seg.volume)}</td>
                      <td className="py-2 text-right">{seg.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Top 10 Wallets</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-left border-b border-zinc-800">
                  <th className="pb-2 font-medium">Address</th>
                  <th className="pb-2 font-medium text-right">Volume</th>
                  <th className="pb-2 font-medium text-right">TX Count</th>
                  <th className="pb-2 font-medium text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {data.topWallets.map((w) => (
                  <tr key={w.address} className="border-b border-zinc-800/50 text-zinc-300">
                    <td className="py-2 font-mono text-xs">{shortAddr(w.address)}</td>
                    <td className="py-2 text-right">{fmtUsd(w.volume)}</td>
                    <td className="py-2 text-right">{w.txCount}</td>
                    <td className="py-2 text-right text-zinc-500 text-xs">{new Date(w.lastActive).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* Chain Analytics */}
      <Section title="Chain Analytics">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Transactions by Chain</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chains} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="chain" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [Number(v ?? 0), 'Transactions']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Top 10 Routes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-left border-b border-zinc-800">
                    <th className="pb-2 font-medium">Route</th>
                    <th className="pb-2 font-medium text-right">Volume</th>
                    <th className="pb-2 font-medium text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topRoutes.map((r) => (
                    <tr key={r.route} className="border-b border-zinc-800/50 text-zinc-300">
                      <td className="py-2 font-mono text-xs">{r.route}</td>
                      <td className="py-2 text-right">{fmtUsd(r.volume)}</td>
                      <td className="py-2 text-right">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Section>

      {/* Token Analytics */}
      <Section title="Token Analytics">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Top 10 Tokens by Volume</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-left border-b border-zinc-800">
                    <th className="pb-2 font-medium">Token</th>
                    <th className="pb-2 font-medium text-right">Volume</th>
                    <th className="pb-2 font-medium text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTokens.map((t) => (
                    <tr key={t.token} className="border-b border-zinc-800/50 text-zinc-300">
                      <td className="py-2 font-medium">{t.token}</td>
                      <td className="py-2 text-right">{fmtUsd(t.volume)}</td>
                      <td className="py-2 text-right">{t.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Top 10 Token Pairs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-left border-b border-zinc-800">
                    <th className="pb-2 font-medium">Pair</th>
                    <th className="pb-2 font-medium text-right">Volume</th>
                    <th className="pb-2 font-medium text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTokenPairs.map((p) => (
                    <tr key={p.pair} className="border-b border-zinc-800/50 text-zinc-300">
                      <td className="py-2 font-mono text-xs">{p.pair}</td>
                      <td className="py-2 text-right">{fmtUsd(p.volume)}</td>
                      <td className="py-2 text-right">{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Section>

      {/* Activity Trends */}
      <Section title="Activity Trends">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Daily Active Wallets — Last 30 Days</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyActiveWallets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [Number(v ?? 0), 'Wallets']} />
                  <Line type="monotone" dataKey="wallets" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Avg Transaction Size (USD) — Last 30 Days</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.avgTxSize}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `$${fmtNumber(v)}`} axisLine={false} tickLine={false} width={60} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, 'Avg Size']} />
                  <Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-medium text-zinc-400 mb-4">Peak Hours (UTC)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip {...tooltipStyle} formatter={(v) => [Number(v ?? 0), 'Transactions']} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>
    </div>
  );
}
