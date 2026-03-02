'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@goblink/connect/react';
import { Clock, ExternalLink, ChevronDown, Wallet, Search, ArrowRight, Download } from 'lucide-react';

interface Transaction {
  id: string;
  wallet_address: string;
  wallet_chain: string;
  deposit_address: string;
  from_chain: string;
  from_token: string;
  to_chain: string;
  to_token: string;
  amount_in: string;
  amount_out: string | null;
  amount_usd: number | null;
  recipient: string;
  refund_to: string | null;
  status: string;
  deposit_tx_hash: string | null;
  fulfillment_tx_hash: string | null;
  refund_tx_hash: string | null;
  fee_bps: number | null;
  fee_amount: string | null;
  created_at: string;
  updated_at: string;
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const { wallets } = useWallet();

  const allWalletAddresses = wallets.map(w => w.address);

  const limit = 20;

  useEffect(() => {
    if (allWalletAddresses.length === 0) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const walletsParam = allWalletAddresses.join(',');
        const response = await fetch(`/api/transactions?wallet=${encodeURIComponent(walletsParam)}&page=${page}&limit=${limit}`);
        
        if (!response.ok) throw new Error('Failed to fetch transaction history');

        const data = await response.json();
        
        if (data.success) {
          setTransactions(data.data.transactions || []);
          setTotal(data.data.total || 0);
        } else {
          throw new Error('Failed to load transactions');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [allWalletAddresses.join(','), page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh real status for non-terminal transactions from 1Click API
  useEffect(() => {
    if (loading || transactions.length === 0) return;

    const TERMINAL = new Set(['completed', 'refunded', 'failed']);
    const pending = transactions.filter(
      tx => !TERMINAL.has(tx.status?.toLowerCase()) && tx.deposit_address
    );
    if (pending.length === 0) return;

    pending.forEach((tx, i) => {
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/status/${tx.deposit_address}`);
          if (!res.ok) return;

          const data = await res.json();
          const newStatus: string = data.status;
          if (!newStatus || newStatus === tx.status) return;

          setTransactions(prev =>
            prev.map(t => t.id === tx.id ? { ...t, status: newStatus } : t)
          );

          fetch(`/api/transactions/${tx.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              depositAddress: tx.deposit_address,
              status: newStatus,
              ...(data.amountOut && { amountOut: data.amountOut }),
              ...(data.fulfillmentTxHash && { fulfillmentTxHash: data.fulfillmentTxHash }),
              ...(data.refundTxHash && { refundTxHash: data.refundTxHash }),
            }),
          }).catch(() => {});
        } catch {
          // Network error — skip silently
        }
      }, i * 300);
    });
  }, [loading, transactions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadCSV = () => {
    const escapeCSV = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const formatDateUTC = (dateString: string) => {
      const d = new Date(dateString);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
    };

    const headers = ['Date', 'From Chain', 'From Token', 'To Chain', 'To Token', 'Amount In', 'Amount Out', 'USD Value', 'Status', 'Recipient', 'Deposit TX', 'Fulfillment TX'];
    const rows = transactions.map(tx => [
      formatDateUTC(tx.created_at),
      tx.from_chain,
      tx.from_token,
      tx.to_chain,
      tx.to_token,
      tx.amount_in,
      tx.amount_out ?? '',
      tx.amount_usd != null ? tx.amount_usd.toFixed(2) : '',
      tx.status,
      tx.recipient,
      tx.deposit_tx_hash ?? '',
      tx.fulfillment_tx_hash ?? '',
    ].map(v => escapeCSV(String(v))));

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `goblink-history-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Status badge using design system tokens ---
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let bg: string, color: string, label: string;

    if (s === 'completed' || s === 'success') {
      bg = 'var(--success-bg)'; color = 'var(--success-text)'; label = 'Completed';
    } else if (s === 'processing') {
      bg = 'var(--info-bg)'; color = 'var(--info-text)'; label = 'Processing';
    } else if (s === 'pending' || s === 'pending_deposit') {
      bg = 'var(--warning-bg)'; color = 'var(--warning-text)'; label = 'Pending';
    } else if (s === 'failed') {
      bg = 'var(--error-bg)'; color = 'var(--error-text)'; label = 'Failed';
    } else if (s === 'refunded') {
      bg = 'var(--info-bg)'; color = 'var(--info-text)'; label = 'Refunded';
    } else {
      bg = 'var(--elevated)'; color = 'var(--text-secondary)'; label = status;
    }

    return (
      <span
        className="badge text-tiny font-medium"
        style={{ background: bg, color }}
      >
        {label}
      </span>
    );
  };

  const getExplorerUrl = (chain: string, txHash: string) => {
    const c = chain.toLowerCase();
    if (c === 'ethereum') return `https://etherscan.io/tx/${txHash}`;
    if (c === 'polygon') return `https://polygonscan.com/tx/${txHash}`;
    if (c === 'bsc' || c === 'binance') return `https://bscscan.com/tx/${txHash}`;
    if (c === 'arbitrum') return `https://arbiscan.io/tx/${txHash}`;
    if (c === 'optimism') return `https://optimistic.etherscan.io/tx/${txHash}`;
    if (c === 'base') return `https://basescan.org/tx/${txHash}`;
    if (c === 'avalanche' || c === 'avax') return `https://snowtrace.io/tx/${txHash}`;
    if (c === 'solana') return `https://solscan.io/tx/${txHash}`;
    if (c === 'near') return `https://nearblocks.io/txns/${txHash}`;
    if (c === 'sui') return `https://suiscan.xyz/mainnet/tx/${txHash}`;
    return `https://explorer.near-intents.org/`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    try {
      const num = parseFloat(amount) / Math.pow(10, decimals);
      if (num === 0) return '0';
      if (num < 0.000001) return '<0.000001';
      if (num < 1) return num.toFixed(6);
      if (num < 1000) return num.toFixed(4);
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } catch {
      return amount;
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // --- No wallet connected ---
  if (allWalletAddresses.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--elevated)' }}
          >
            <Wallet className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h1 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>Connect Your Wallet</h1>
          <p className="text-body mb-6" style={{ color: 'var(--text-secondary)' }}>
            Connect a wallet to view your cross-chain transfer history across all connected chains.
          </p>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>Loading your transactions...</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <div
            className="p-4 rounded-xl"
            style={{ background: 'var(--error-bg)', color: 'var(--error-text)' }}
          >
            <p className="text-body">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-h2 mb-1" style={{ color: 'var(--text-primary)' }}>Transaction History</h1>
          <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            {total > 0 ? `${total} transaction${total === 1 ? '' : 's'} found` : 'No transactions yet'}
          </p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={transactions.length === 0}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'rgb(39 39 42)', color: 'rgb(161 161 170)' }}
          onMouseEnter={e => { if (transactions.length > 0) (e.currentTarget.style.background = 'rgb(63 63 70)'); }}
          onMouseLeave={e => { (e.currentTarget.style.background = 'rgb(39 39 42)'); }}
        >
          <Download className="h-4 w-4" />
          Download CSV
        </button>
      </div>

      {transactions.length === 0 ? (
        /* --- Empty state --- */
        <div
          className="text-center py-16 rounded-xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--elevated)' }}
          >
            <Search className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 className="text-h4 mb-2" style={{ color: 'var(--text-primary)' }}>No transactions yet</h3>
          <p className="text-body-sm max-w-sm mx-auto mb-6" style={{ color: 'var(--text-secondary)' }}>
            Once you make your first cross-chain transfer, it&apos;ll show up here with full status tracking.
          </p>
          <a
            href="/app"
            className="btn btn-primary inline-flex items-center gap-2 px-6 py-3"
          >
            Make Your First Transfer
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <>
          {/* --- Transaction Cards --- */}
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isExpanded = expandedId === tx.id;

              return (
                <div
                  key={tx.id}
                  className="rounded-xl overflow-hidden transition-shadow"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  {/* Card header — responsive: stacked on mobile, row on desktop */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                    className="w-full p-4 text-left transition-colors"
                    style={{ background: isExpanded ? 'var(--elevated)' : 'transparent' }}
                  >
                    {/* Desktop layout (hidden on mobile) */}
                    <div className="hidden sm:flex items-center gap-4">
                      {/* Date */}
                      <div className="flex items-center gap-1.5 min-w-[90px]">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
                        <span className="text-tiny" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(tx.created_at)}
                        </span>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {capitalize(tx.from_chain)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
                        <span className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {capitalize(tx.to_chain)}
                        </span>
                      </div>

                      {/* Amount — right-aligned, monospaced for scanability */}
                      <div className="text-right min-w-[140px]">
                        <div className="text-body-sm font-semibold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {formatAmount(tx.amount_in)} {tx.from_token}
                        </div>
                        {tx.amount_usd && (
                          <div className="text-tiny font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            ${tx.amount_usd.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="min-w-[90px] flex justify-end">
                        {getStatusBadge(tx.status)}
                      </div>

                      {/* Expand */}
                      <ChevronDown
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        style={{ color: 'var(--text-faint)' }}
                      />
                    </div>

                    {/* Mobile layout (hidden on desktop) — stacked card */}
                    <div className="sm:hidden space-y-2.5">
                      {/* Top row: route + status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {capitalize(tx.from_chain)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--text-faint)' }} />
                          <span className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {capitalize(tx.to_chain)}
                          </span>
                        </div>
                        {getStatusBadge(tx.status)}
                      </div>

                      {/* Bottom row: amount + date */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-body-sm font-semibold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                            {formatAmount(tx.amount_in)} {tx.from_token}
                          </span>
                          {tx.amount_usd && (
                            <span className="text-tiny font-mono ml-1.5" style={{ color: 'var(--text-muted)' }}>
                              (${tx.amount_usd.toFixed(2)})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" style={{ color: 'var(--text-faint)' }} />
                          <span className="text-tiny" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(tx.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div
                      className="border-t px-4 py-4 space-y-3"
                      style={{ borderColor: 'var(--border)', background: 'var(--elevated)' }}
                    >
                      {/* Detail rows */}
                      <DetailRow label="Recipient" value={tx.recipient} mono />

                      {tx.deposit_address && (
                        <DetailRow label="Deposit Address" value={tx.deposit_address} mono />
                      )}

                      {tx.amount_out && (
                        <DetailRow
                          label="Amount Received"
                          value={`${formatAmount(tx.amount_out)} ${tx.to_token}`}
                          bold
                        />
                      )}

                      {tx.fee_bps && (
                        <DetailRow
                          label="Fee"
                          value={
                            tx.amount_usd
                              ? `~$${(tx.amount_usd * tx.fee_bps / 10000).toFixed(2)}`
                              : tx.fee_amount
                                ? formatAmount(tx.fee_amount)
                                : `${(Math.min(tx.fee_bps, 75) / 100).toFixed(2)}%`
                          }
                        />
                      )}

                      {tx.deposit_tx_hash && (
                        <TxHashRow
                          label="Deposit Tx"
                          hash={tx.deposit_tx_hash}
                          url={getExplorerUrl(tx.from_chain, tx.deposit_tx_hash)}
                        />
                      )}

                      {tx.fulfillment_tx_hash && (
                        <TxHashRow
                          label="Fulfillment Tx"
                          hash={tx.fulfillment_tx_hash}
                          url={getExplorerUrl(tx.to_chain, tx.fulfillment_tx_hash)}
                        />
                      )}

                      {tx.refund_tx_hash && (
                        <TxHashRow
                          label="Refund Tx"
                          hash={tx.refund_tx_hash}
                          url={getExplorerUrl(tx.from_chain, tx.refund_tx_hash)}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn btn-secondary px-4 py-2 text-body-sm"
              >
                Previous
              </button>
              <span className="text-body-sm px-4" style={{ color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary px-4 py-2 text-body-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Reusable sub-components ---

function DetailRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0.5 sm:gap-4">
      <span className="text-tiny font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        className={`text-body-sm text-right break-all ${mono ? 'font-mono' : ''} ${bold ? 'font-semibold' : ''}`}
        style={{ color: bold ? 'var(--text-primary)' : 'var(--text-secondary)' }}
      >
        {value}
      </span>
    </div>
  );
}

function TxHashRow({ label, hash, url }: { label: string; hash: string; url: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0.5 sm:gap-4">
      <span className="text-tiny font-medium flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-body-sm font-mono transition-opacity hover:opacity-70"
        style={{ color: 'var(--brand)' }}
      >
        {hash.substring(0, 8)}...{hash.substring(hash.length - 6)}
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
