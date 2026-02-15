'use client';

import { useState, useEffect } from 'react';

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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/status/${depositAddress}`);
        
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
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'PROCESSING':
      case 'DEPOSIT_RECEIVED':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'SUCCESS':
      case 'COMPLETED':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'FAILED':
      case 'REFUNDED':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
      case 'COMPLETED':
        return (
          <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'FAILED':
      case 'REFUNDED':
        return (
          <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'PROCESSING':
      case 'DEPOSIT_RECEIVED':
        return (
          <svg className="h-12 w-12 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      default:
        return (
          <svg className="h-12 w-12 text-gray-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    
    if (asset.includes('eth') || asset.includes('ethereum')) {
      return `https://etherscan.io/tx/${txHash}`;
    } else if (asset.includes('sol') || asset.includes('solana')) {
      return `https://solscan.io/tx/${txHash}`;
    } else if (asset.includes('near')) {
      return `https://nearblocks.io/txns/${txHash}`;
    } else if (asset.includes('base')) {
      return `https://basescan.org/tx/${txHash}`;
    } else if (asset.includes('arb') || asset.includes('arbitrum')) {
      return `https://arbiscan.io/tx/${txHash}`;
    } else if (asset.includes('polygon') || asset.includes('matic')) {
      return `https://polygonscan.com/tx/${txHash}`;
    }
    
    // Default to generic explorer
    return `https://explorer.near-intents.org/`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Transaction Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!transaction ? (
            <div className="flex flex-col items-center justify-center py-12">
              {/* Pulsing circles animation */}
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping"></div>
                <div className="absolute inset-2 rounded-full border-4 border-blue-400 animate-pulse"></div>
                <div className="absolute inset-4 rounded-full bg-blue-600 animate-pulse"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Transaction Being Submitted</h3>
              <p className="text-gray-600 text-center max-w-md">
                Your transaction is being processed on the blockchain. This may take a few moments...
              </p>
              {loading && (
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Checking status...
                </div>
              )}
            </div>
          ) : error && !transaction ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-600 text-center">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 btn btn-secondary"
              >
                Close
              </button>
            </div>
          ) : transaction ? (
            <div className="space-y-6">
              {/* Status Display */}
              <div className="flex flex-col items-center text-center py-6">
                <div className="mb-4">
                  {getStatusIcon(transaction.status)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {getStatusMessage(transaction.status)}
                </h3>
                <div className={`inline-flex items-center px-4 py-2 rounded-full border font-semibold ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </div>
              </div>

              {/* Swap Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">From</span>
                  <span className="text-sm font-mono text-gray-900">{transaction.originAsset}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">To</span>
                  <span className="text-sm font-mono text-gray-900">{transaction.destinationAsset}</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Amount In</span>
                  <span className="text-sm font-semibold text-gray-900">{transaction.amountIn}</span>
                </div>
                {transaction.amountOut && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Amount Out</span>
                    <span className="text-sm font-semibold text-green-600">{transaction.amountOut}</span>
                  </div>
                )}
              </div>

              {/* Deposit Address */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Deposit Address
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white px-3 py-2 rounded border border-blue-200 break-all font-mono">
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
                  <h4 className="font-semibold text-gray-900">Transaction Hashes</h4>
                  
                  {transaction.depositTxHash && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Deposit Transaction</span>
                        <a
                          href={getExplorerLink(transaction.depositTxHash, transaction.originAsset)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          View
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <code className="text-xs text-gray-700 break-all font-mono">{formatAddress(transaction.depositTxHash)}</code>
                    </div>
                  )}
                  
                  {transaction.fulfillmentTxHash && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-green-700">Fulfillment Transaction</span>
                        <a
                          href={getExplorerLink(transaction.fulfillmentTxHash, transaction.destinationAsset)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                        >
                          View
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <code className="text-xs text-green-700 break-all font-mono">{formatAddress(transaction.fulfillmentTxHash)}</code>
                    </div>
                  )}
                </div>
              )}

              {/* Recipient Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">Recipient</span>
                  <code className="text-xs text-gray-900 break-all text-right max-w-xs font-mono">{formatAddress(transaction.recipient)}</code>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">Refund Address</span>
                  <code className="text-xs text-gray-900 break-all text-right max-w-xs font-mono">{formatAddress(transaction.refundTo)}</code>
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
              <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                Created: {new Date(transaction.createdAt).toLocaleString()}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
