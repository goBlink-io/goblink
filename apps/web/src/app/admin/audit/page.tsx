'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminFetch, fmtDate } from '@/lib/admin';

interface AuditLog {
  id: string;
  actor: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface AuditData {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AuditPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (action) params.set('action', action);
    const d = await adminFetch<AuditData>(`/api/admin/audit?${params}`);
    if (d) setData(d);
    setLoading(false);
  }, [page, action]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 10000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchData]);

  const ACTIONS = [
    '',
    'quote.requested',
    'deposit.submitted',
    'transfer_link.created',
    'payment_request.completed',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <div
            className={`relative w-8 h-4 rounded-full transition-colors ${autoRefresh ? 'bg-blue-600' : 'bg-zinc-700'}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
          </div>
          Auto-refresh
        </label>
      </div>

      {/* Action filter */}
      <select
        value={action}
        onChange={(e) => {
          setAction(e.target.value);
          setPage(1);
        }}
        className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
      >
        <option value="">All actions</option>
        {ACTIONS.filter(Boolean).map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Meta
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && !data ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : !data?.logs.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-zinc-500"
                  >
                    No audit logs found
                  </td>
                </tr>
              ) : (
                data.logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap text-xs">
                        {fmtDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 font-mono text-xs max-w-[150px] truncate">
                        {log.actor}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {log.resource_type && (
                          <span>
                            {log.resource_type}
                            {log.resource_id && (
                              <span className="text-zinc-600">
                                /{log.resource_id.slice(0, 8)}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {log.metadata &&
                        Object.keys(log.metadata).length > 0 ? (
                          <button
                            onClick={() =>
                              setExpanded(
                                expanded === log.id ? null : log.id,
                              )
                            }
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            {expanded === log.id ? 'Hide' : 'View'}
                          </button>
                        ) : (
                          <span className="text-zinc-600 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr key={`${log.id}-meta`}>
                        <td
                          colSpan={6}
                          className="px-4 py-3 bg-zinc-950"
                        >
                          <pre className="text-xs text-zinc-400 overflow-auto max-h-48 p-3 bg-zinc-900 rounded-lg">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
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
