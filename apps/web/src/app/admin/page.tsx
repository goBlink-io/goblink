'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { adminFetch, fmtUsd, fmtNumber } from '@/lib/admin';

interface Stats {
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  successRate: number;
  activePaymentLinks: number;
  todayTransactions: number;
  todayVolume: number;
  todayFees: number;
  dailyVolume: { date: string; volume: number; count: number }[];
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch<Stats>('/api/admin/stats')
      .then((d) => d && setStats(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse h-24"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={fmtNumber(stats.totalTransactions)}
        />
        <StatCard label="Total Volume" value={fmtUsd(stats.totalVolume)} />
        <StatCard
          label="Total Fees Earned"
          value={fmtUsd(stats.totalFees)}
        />
        <StatCard
          label="Success Rate"
          value={`${stats.successRate}%`}
          sub={`${fmtNumber(stats.totalTransactions)} total`}
        />
        <StatCard
          label="Payment Links"
          value={fmtNumber(stats.activePaymentLinks)}
          sub="Active"
        />
        <StatCard
          label="Today's Transactions"
          value={fmtNumber(stats.todayTransactions)}
        />
        <StatCard
          label="Today's Volume"
          value={fmtUsd(stats.todayVolume)}
        />
        <StatCard
          label="Today's Fees"
          value={fmtUsd(stats.todayFees)}
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">
          Daily Volume — Last 30 Days
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.dailyVolume}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickFormatter={(d) => d.slice(5)}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickFormatter={(v) => `$${fmtNumber(v)}`}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
                labelStyle={{ color: '#a1a1aa' }}
                itemStyle={{ color: '#3b82f6' }}
                formatter={(v) => [
                  `$${Number(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                  'Volume',
                ]}
              />
              <Bar dataKey="volume" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
