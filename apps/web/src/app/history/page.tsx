'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useAccount } from 'wagmi';
import { Clock, ExternalLink, ChevronRight, Wallet, Search } from 'lucide-react';

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
  
  // Wallet connections
  const { address: evmAddress } = useAccount();
  const suiAccount = useCurrentAccount();
  const { caipAddress } = useAppKitAccount();

  // Determine active wallet
  const walletAddress = evmAddress || suiAccount?.address || (caipAddress?.startsWith('solana:') ? caipAddress.split(':')[2] : null);

  const limit = 20;

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/transactions?wallet=${walletAddress}&page=${page}&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transaction history');
        }

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
  }, [walletAddress, page]);

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'completed' || statusLower === 'success') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
          Completed
        </span>
      );
    }
    
    if (statusLower === 'pending' || statusLower === 'pending_deposit' || statusLower === 'processing') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
          Pending
        </span>
      );
    }
    
    if (statusLower === 'failed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
          Failed
        </span>
      );
    }
    
    if (statusLower === 'refunded') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Refunded
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
        {status}
      </span>
    );
  };

  const getExplorerUrl = (chain: string, txHash: string) => {
    const cleanChain = chain.toLowerCase();
    
    if (cleanChain === 'ethereum') return `https://etherscan.io/tx/${txHash}`;
    if (cleanChain === 'polygon') return `https://polygonscan.com/tx/${txHash}`;
    if (cleanChain === 'bsc' || cleanChain === 'binance') return `https://bscscan.com/tx/${txHash}`;
    if (cleanChain === 'arbitrum') return `https://arbiscan.io/tx/${txHash}`;
    if (cleanChain === 'optimism') return `https://optimistic.etherscan.io/tx/${txHash}`;
    if (cleanChain === 'base') return `https://basescan.org/tx/${txHash}`;
    if (cleanChain === 'avalanche' || cleanChain === 'avax') return `https://snowtrace.io/tx/${txHash}`;
    if (cleanChain === 'solana') return `https://solscan.io/tx/${txHash}`;
    if (cleanChain === 'near') return `https://nearblocks.io/txns/${txHash}`;
    if (cleanChain === 'sui') return `https://suiscan.xyz/mainnet/tx/${txHash}`;
    
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

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (!walletAddress) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
          <h1 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>Connect Your Wallet</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to view your transaction history
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" style={{ color: 'var(--text-muted)' }} />
          <p className="mt-4 text-body" style={{ color: 'var(--text-secondary)' }}>Loading your transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <p className="text-body text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>Transaction History</h1>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          {total > 0 ? `${total} transaction${total === 1 ? '' : 's'} found` : 'No transactions yet'}
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-16 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-h4 mb-2" style={{ color: 'var(--text-primary)' }}>No transactions yet</h3>
          <p className="text-body max-w-sm mx-auto mb-6" style={{ color: 'var(--text-secondary)' }}>
            When you make transfers with goBlink, they'll appear here
          </p>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all" style={{ background: 'var(--gradient)', color: 'white' }}>
            Make Your First Transfer
          </a>
        </div>
      ) : (
        <>
          {/* Transactions List */}
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                {/* Main Row */}
                <button
                  onClick={() => toggleExpanded(tx.id)}
                  className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    {/* Date */}
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(tx.created_at)}
                      </span>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-body font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                        {tx.from_chain}
                      </span>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span className="text-body font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                        {tx.to_chain}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="text-right min-w-[120px]">
                      <div className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatAmount(tx.amount_in)} {tx.from_token}
                      </div>
                      {tx.amount_usd && (
                        <div className="text-caption" style={{ color: 'var(--text-muted)' }}>
                          ${tx.amount_usd.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="min-w-[100px] flex justify-end">
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <ChevronRight 
                    className={`w-5 h-5 ml-4 flex-shrink-0 transition-transform ${expandedId === tx.id ? 'rotate-90' : ''}`} 
                    style={{ color: 'var(--text-muted)' }} 
                  />
                </button>

                {/* Expanded Details */}
                {expandedId === tx.id && (
                  <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface) 95%, var(--text-primary) 5%)' }}>
                    {/* Recipient */}
                    <div className="flex justify-between items-start">
                      <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>Recipient:</span>
                      <span className="text-body-sm font-mono text-right break-all max-w-[60%]" style={{ color: 'var(--text-secondary)' }}>
                        {tx.recipient}
                      </span>
                    </div>

                    {/* Deposit Address */}
                    {tx.deposit_address && (
                      <div className="flex justify-between items-start">
                        <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>Deposit Address:</span>
                        <span className="text-body-sm font-mono text-right break-all max-w-[60%]" style={{ color: 'var(--text-secondary)' }}>
                          {tx.deposit_address}
                        </span>
                      </div>
                    )}

                    {/* Amount Out */}
                    {tx.amount_out && (
                      <div className="flex justify-between items-start">
                        <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>Amount Received:</span>
                        <span className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {formatAmount(tx.amount_out)} {tx.to_token}
                        </span>
                      </div>
                    )}

                    {/* Fee */}
                    {tx.fee_bps && (
                      <div className="flex justify-between items-start">
                        <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>Fee:</span>
                        <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                          {(tx.fee_bps / 100).toFixed(2)}%
                          {tx.fee_amount && ` (${formatAmount(tx.fee_amount)} ${tx.from_token})`}
                        </span>
                      </div>
                    )}

                    {/* Transaction Hashes */}
                    {tx.deposit_tx_hash && (
                      <div className="flex justify-between items-start">
                        <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>Deposit Tx:</span>
                        <a 
                          href={getExplorerUrl(tx.from_chain, tx.deposit_tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-body-sm font-mono hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--accent)' }}
                        >
                          {tx.deposit_tx_hash.substring(0, 8)}...{tx.deposit_tx_hash.substring(tx.deposit_tx_hash.length - 6)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {tx.fulfillment_tx_hash && (
                      <div className="flex justify-between items-start">
                        <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>Fulfillment Tx:</span>
                        <a 
                          href={getExplorerUrl(tx.to_chain, tx.fulfillment_tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-body-sm font-mono hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--accent)' }}
                        >
                          {tx.fulfillment_tx_hash.substring(0, 8)}...{tx.fulfillment_tx_hash.substring(tx.fulfillment_tx_hash.length - 6)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {tx.refund_tx_hash && (
                      <div className="flex justify-between items-start">
                        <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>Refund Tx:</span>
                        <a 
                          href={getExplorerUrl(tx.from_chain, tx.refund_tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-body-sm font-mono hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--accent)' }}
                        >
                          {tx.refund_tx_hash.substring(0, 8)}...{tx.refund_tx_hash.substring(tx.refund_tx_hash.length - 6)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-70 transition-opacity"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                Previous
              </button>
              <span className="text-body-sm px-4" style={{ color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-70 transition-opacity"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
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
