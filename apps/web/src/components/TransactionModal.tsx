'use client';

import { useState, useEffect } from 'react';
import { getExplorerTxUrl, EVM_CHAINS } from '@goblink/shared';

interface TransactionData {
  depositAddress: string;
  status: string;
  originAsset: string;
  destinationAsset: string;
  amountIn: string;
  amountOut: string | null;
  recipient: string;
  refundTo: string;
  depositTxHash: string | null;
  fulfillmentTxHash: string | null;
  refundTxHash: string | null;
  createdAt: string;
  updatedAt: string;
  referral: string | null;
  affiliate: string | null;
}

interface TransactionModalProps {
  depositAddress: string;
  onClose: () => void;
}

export default function TransactionModal({ depositAddress, onClose }: TransactionModalProps) {
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Poll for status updates every 6 seconds (avoid rate limiting)
    const fetchStatus = async () => {
      if (!depositAddress) return;

      try {
        const response = await fetch(`/api/status/${depositAddress}`);

        if (!response.ok) {
          // Handle 404 and 429 silently - don't stress users with error messages
          if (response.status === 404 || response.status === 429) {
            // Keep showing last known state, just log for debugging
            console.log(`Status ${response.status}: Transaction not yet available or rate limited, will retry...`);
            return false;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch transaction status');
        }

        const data = await response.json();
        setTransaction(data);
        setError(null);

        // Stop polling if transaction is completed or failed
        if (data.status === 'COMPLETED' || data.status === 'SUCCESS' || data.status === 'FAILED' || data.status === 'REFUNDED') {
          return true; // Signal to stop polling
        }

        return false;
      } catch (err: any) {
        // Only show critical errors, not rate limiting or temporary issues
        if (!err.message?.includes('429') && !err.message?.includes('rate limit')) {
          console.error('Status fetch error:', err);
          setError(err.message || 'Failed to fetch transaction status');
        } else {
          console.log('Rate limited, will retry...');
        }
        return false;
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling interval (6 seconds to avoid rate limiting)
    const interval = setInterval(async () => {
      const shouldStop = await fetchStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [depositAddress]);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING_DEPOSIT':
      case 'PENDING_QUOTE':
        return { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning)' };
      case 'PROCESSING':
      case 'DEPOSIT_RECEIVED':
        return { color: 'var(--brand)', bg: 'var(--info-bg)', border: 'var(--brand)' };
      case 'SUCCESS':
      case 'COMPLETED':
        return { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success)' };
      case 'FAILED':
      case 'REFUNDED':
        return { color: 'var(--error)', bg: 'var(--error-bg)', border: 'var(--error)' };
      default:
        return { color: 'var(--text-muted)', bg: 'var(--elevated)', border: 'var(--border)' };
    }
  };

  const getStatusIcon = (status: string) => {
    const statusColors = getStatusColor(status);
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
      case 'COMPLETED':
        return (
          <svg className="h-12 w-12" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'FAILED':
      case 'REFUNDED':
        return (
          <svg className="h-12 w-12" style={{ color: 'var(--error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'PROCESSING':
      case 'DEPOSIT_RECEIVED':
        return (
          <svg className="h-12 w-12 animate-spin" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      default:
        return (
          <svg className="h-12 w-12 animate-pulse" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING_QUOTE':
        return 'Preparing quote...';
      case 'PENDING_DEPOSIT':
        return 'Waiting for your deposit';
      case 'DEPOSIT_RECEIVED':
        return 'Deposit received, processing...';
      case 'PROCESSING':
        return 'Swap in progress...';
      case 'SUCCESS':
      case 'COMPLETED':
        return 'Swap completed successfully!';
      case 'FAILED':
        return 'Swap failed';
      case 'REFUNDED':
        return 'Swap refunded';
      default:
        return 'Checking status...';
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getExplorerLink = (txHash: string, assetId: string) => {
    // Try to determine chain from asset ID
    const asset = assetId?.toLowerCase() || '';

    // Check EVM chains first (using chain config for comprehensive matching)
    for (const [chainName, config] of Object.entries(EVM_CHAINS)) {
      if (asset.includes(chainName) || asset.includes(config.displayName.toLowerCase())) {
        return getExplorerTxUrl(chainName, txHash);
      }
    }

    // Additional keyword matching for common aliases
    if (asset.includes('eth') || asset.includes('ethereum')) {
      return getExplorerTxUrl('ethereum', txHash);
    } else if (asset.includes('bnb') || asset.includes('bsc')) {
      return getExplorerTxUrl('bsc', txHash);
    } else if (asset.includes('bera')) {
      return getExplorerTxUrl('berachain', txHash);
    } else if (asset.includes('monad') || asset.includes('mon')) {
      return getExplorerTxUrl('monad', txHash);
    }

    // Non-EVM chains
    if (asset.includes('sol') || asset.includes('solana')) {
      return `https://solscan.io/tx/${txHash}`;
    } else if (asset.includes('near')) {
      return `https://nearblocks.io/txns/${txHash}`;
    } else if (asset.includes('sui')) {
      return `https://suiscan.xyz/mainnet/tx/${txHash}`;
    }

    // Default to generic explorer
    return `https://explorer.near-intents.org/`;
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 sm:p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="sticky top-0 border-b px-6 py-4 flex items-center justify-between rounded-t-2xl" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Transaction Status</h2>
          <button
            onClick={onClose}
            className="transition-colors hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
            title="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && !transaction ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="h-16 w-16 mb-4" style={{ color: 'var(--error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-center" style={{ color: 'var(--error)' }}>{error}</p>
              <button
                onClick={onClose}
                className="mt-4 btn btn-secondary"
              >
                Close
              </button>
            </div>
          ) : !transaction ? (
            <div className="flex flex-col items-center justify-center py-12">
              {/* Pulsing circles animation */}
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 animate-ping" style={{ borderColor: 'var(--brand-muted, rgba(37,99,235,0.3))' }}></div>
                <div className="absolute inset-2 rounded-full border-4 animate-pulse" style={{ borderColor: 'var(--brand)' }}></div>
                <div className="absolute inset-4 rounded-full animate-pulse" style={{ background: 'var(--brand)' }}></div>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Transaction Being Submitted</h3>
              <p className="text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
                Your transaction is being processed on the blockchain. This may take a few moments...
              </p>
              {loading && (
                <div className="mt-4 flex items-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'var(--brand)' }}></div>
                  Checking status...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Display */}
              <div className="flex flex-col items-center text-center py-6">
                <div className="mb-4">
                  {getStatusIcon(transaction.status)}
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {getStatusMessage(transaction.status)}
                </h3>
                {(() => {
                  const sc = getStatusColor(transaction.status);
                  return (
                    <div className="inline-flex items-center px-4 py-2 rounded-full border font-semibold"
                      style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
                      {transaction.status}
                    </div>
                  );
                })()}
              </div>

              {/* Swap Details */}
              <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--elevated)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>From</span>
                  <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{transaction.originAsset}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>To</span>
                  <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{transaction.destinationAsset}</span>
                </div>
                <div className="my-2" style={{ borderTop: '1px solid var(--border)' }}></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Amount In</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{transaction.amountIn}</span>
                </div>
                {transaction.amountOut && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Amount Out</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>{transaction.amountOut}</span>
                  </div>
                )}
              </div>

              {/* Deposit Address */}
              <div className="rounded-lg p-4 border" style={{ background: 'var(--info-bg)', borderColor: 'var(--brand)' }}>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--brand)' }}>
                  Deposit Address
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs px-3 py-2 rounded border break-all font-mono" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    {depositAddress}
                  </code>
                  <button
                    onClick={() => copyToClipboard(depositAddress)}
                    className="btn btn-secondary px-3 py-2 text-sm"
                    title="Copy to clipboard"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Transaction Hashes */}
              {(transaction.depositTxHash || transaction.fulfillmentTxHash) && (
                <div className="space-y-3">
                  <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Transaction Hashes</h4>

                  {transaction.depositTxHash && (
                    <div className="rounded-lg p-3" style={{ background: 'var(--elevated)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Deposit Transaction</span>
                        <a
                          href={getExplorerLink(transaction.depositTxHash, transaction.originAsset)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--brand)' }}
                        >
                          View
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <code className="text-xs break-all font-mono" style={{ color: 'var(--text-secondary)' }}>{formatAddress(transaction.depositTxHash)}</code>
                    </div>
                  )}

                  {transaction.fulfillmentTxHash && (
                    <div className="rounded-lg p-3" style={{ background: 'var(--success-bg)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>Fulfillment Transaction</span>
                        <a
                          href={getExplorerLink(transaction.fulfillmentTxHash, transaction.destinationAsset)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--success)' }}
                        >
                          View
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <code className="text-xs break-all font-mono" style={{ color: 'var(--success)' }}>{formatAddress(transaction.fulfillmentTxHash)}</code>
                    </div>
                  )}
                </div>
              )}

              {/* Recipient Info */}
              <div className="rounded-lg p-4 space-y-2" style={{ background: 'var(--elevated)' }}>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Recipient</span>
                  <code className="text-xs break-all text-right max-w-xs font-mono" style={{ color: 'var(--text-primary)' }}>{formatAddress(transaction.recipient)}</code>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Refund Address</span>
                  <code className="text-xs break-all text-right max-w-xs font-mono" style={{ color: 'var(--text-primary)' }}>{formatAddress(transaction.refundTo)}</code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {(transaction.status === 'SUCCESS' || transaction.status === 'COMPLETED') ? (
                  <button
                    onClick={onClose}
                    className="btn btn-primary w-full py-3"
                  >
                    Start New Swap
                  </button>
                ) : (transaction.status === 'FAILED' || transaction.status === 'REFUNDED') ? (
                  <button
                    onClick={onClose}
                    className="btn btn-secondary w-full py-3"
                  >
                    Try Again
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="btn btn-secondary w-full py-3"
                  >
                    Close
                  </button>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-center text-xs pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                Created: {new Date(transaction.createdAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
