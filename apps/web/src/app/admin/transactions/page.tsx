'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminFetch, shortAddr, fmtDate } from '@/lib/admin';

interface Transaction {
  id: string;
  created_at: string;
  from_chain: string;
  from_token: string;
  to_chain: string;
  to_token: string;
  amount_in: string;
  amount_out: string;
  amount_usd: string;
  status: string;
  recipient: string;
  wallet_address: string;
  deposit_tx_hash: string;
  fulfillment_tx_hash: string;
}

interface TxData {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUSES = ['', 'pending', 'processing', 'success', 'failed', 'refunded'];

const STATUS_BADGE: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-blue-500/10 text-blue-400',
  processing: 'bg-amber-500/10 text-amber-400',
  failed: 'bg-red-500/10 text-red-400',
  refunded: 'bg-amber-500/10 text-amber-400',
};

const EXPLORERS: Record<string, string> = {
  ethereum: 'https://etherscan.io/tx/',
  base: 'https://basescan.org/tx/',
  arbitrum: 'https://arbiscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  optimism: 'https://optimistic.etherscan.io/tx/',
  bsc: 'https://bscscan.com/tx/',
  solana: 'https://solscan.io/tx/',
  near: 'https://nearblocks.io/txns/',
  sui: 'https://suiscan.xyz/mainnet/tx/',
  avalanche: 'https://snowscan.xyz/tx/',
};

export default function TransactionsPage() {
  const [data, setData] = useState<TxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const d = await adminFetch<TxData>(`/api/admin/transactions?${params}`);
      if (d) setData(d);
      else setError('Failed to load transactions');
    } catch {
      setError('Failed to load transactions');
    }
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Transactions</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
        >
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search wallet, recipient, or tx hash..."
            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-red-400 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  From
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  To
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">
                  Amount In
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">
                  Amount Out
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">
                  USD
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  TX Hash
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && !data ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                    Loading...
                  </td>
                </tr>
              ) : !data?.transactions.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                data.transactions.map((tx) => {
                  const hash = tx.fulfillment_tx_hash || tx.deposit_tx_hash;
                  const chain = tx.fulfillment_tx_hash ? tx.to_chain : tx.from_chain;
                  const explorerBase = EXPLORERS[chain?.toLowerCase()];
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap text-xs">
                        {fmtDate(tx.created_at)}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                        <span className="text-zinc-500">{tx.from_chain}</span>{' '}
                        <span className="text-zinc-200">{tx.from_token}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                        <span className="text-zinc-500">{tx.to_chain}</span>{' '}
                        <span className="text-zinc-200">{tx.to_token}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-300 text-right whitespace-nowrap">
                        {tx.amount_in || '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 text-right whitespace-nowrap">
                        {tx.amount_out || '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-200 text-right whitespace-nowrap font-medium">
                        {tx.amount_usd ? `$${parseFloat(tx.amount_usd).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[tx.status] || 'bg-zinc-800 text-zinc-400'}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                        {shortAddr(tx.recipient)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {hash ? (
                          explorerBase ? (
                            <a
                              href={`${explorerBase}${hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              {shortAddr(hash)}
                            </a>
                          ) : (
                            <span className="text-zinc-400">{shortAddr(hash)}</span>
                          )
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
