'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminFetch, shortAddr, fmtDate } from '@/lib/admin';

interface Payment {
  link_id: string;
  status: string;
  recipient: string;
  to_chain: string;
  to_token: string;
  amount: string;
  memo: string | null;
  requester_name: string | null;
  paid_at: string | null;
  payer_address: string | null;
  created_at: string;
}

interface PaymentData {
  payments: Payment[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_BADGE: Record<string, string> = {
  processing: 'bg-amber-500/10 text-amber-400',
  paid: 'bg-emerald-500/10 text-emerald-400',
  failed: 'bg-red-500/10 text-red-400',
};

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (status) params.set('status', status);
      const d = await adminFetch<PaymentData>(`/api/admin/payments?${params}`);
      if (d) setData(d);
      else setError('Failed to load payment links');
    } catch {
      setError('Failed to load payment links');
    }
    setLoading(false);
  }, [page, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Payment Links</h1>

      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
        className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
      >
        <option value="">All statuses</option>
        <option value="processing">Processing</option>
        <option value="paid">Paid</option>
        <option value="failed">Failed</option>
      </select>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-red-400 text-sm">{error}</div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Chain / Token
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">
                  Amount
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Fulfilled
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && !data ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : !data?.payments.length ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    No payment links found
                  </td>
                </tr>
              ) : (
                data.payments.map((p) => (
                  <tr
                    key={p.link_id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {shortAddr(p.link_id)}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 text-xs">
                      {p.requester_name || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {shortAddr(p.recipient)}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      <span className="text-zinc-500">{p.to_chain}</span>{' '}
                      <span className="text-zinc-200">{p.to_token}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-200 text-right font-medium">
                      {p.amount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[p.status] || 'bg-zinc-800 text-zinc-400'}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs">
                      {fmtDate(p.created_at)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs">
                      {p.paid_at ? fmtDate(p.paid_at) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              {(data.page - 1) * 50 + 1}–
              {Math.min(data.page * 50, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 rounded-lg transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
