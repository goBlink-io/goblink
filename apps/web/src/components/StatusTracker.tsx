'use client';

import { useState, useEffect } from 'react';
import { SwapStatus } from '@sapphire/shared';

interface StatusTrackerProps {
  depositAddress: string;
  onReset: () => void;
}

export default function StatusTracker({ depositAddress, onReset }: StatusTrackerProps) {
  const [status, setStatus] = useState<SwapStatus>('PENDING_DEPOSIT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (depositAddress) {
      // Poll for status updates every 5 seconds
      const interval = setInterval(() => {
        fetchStatus();
      }, 5000);

      // Initial fetch
      fetchStatus();

      return () => clearInterval(interval);
    }
  }, [depositAddress]);

  const fetchStatus = async () => {
    if (!depositAddress) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/status/${depositAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Swap not found. Please check the deposit address.');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch status');
        }
        return;
      }

      const data = await response.json();
      setStatus(data.status);
      setError(null);
    } catch (err: any) {
      console.error('Status fetch error:', err);
      setError(err.message || 'Failed to fetch status. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (currentStatus: SwapStatus) => {
    switch (currentStatus) {
      case 'PENDING_DEPOSIT':
      case 'PENDING_QUOTE':
        return 'text-yellow-600 bg-yellow-100';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-100';
      case 'SUCCESS':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
      case 'REFUNDED':
        return 'text-red-600 bg-red-100';
      case 'INCOMPLETE_DEPOSIT':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (currentStatus: SwapStatus) => {
    switch (currentStatus) {
      case 'SUCCESS':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'FAILED':
      case 'REFUNDED':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'PROCESSING':
        return (
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusMessage = (currentStatus: SwapStatus) => {
    switch (currentStatus) {
      case 'PENDING_QUOTE':
        return 'Preparing quote...';
      case 'PENDING_DEPOSIT':
        return 'Waiting for deposit...';
      case 'PROCESSING':
        return 'Swap in progress...';
      case 'SUCCESS':
        return 'Swap completed successfully!';
      case 'FAILED':
        return 'Swap failed';
      case 'REFUNDED':
        return 'Swap refunded';
      case 'INCOMPLETE_DEPOSIT':
        return 'Incomplete deposit';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Swap Status</h3>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
      </div>

      {/* Status Display */}
      <div className="flex flex-col items-center py-8">
        <div className={`rounded-full p-4 ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
        </div>
        <h4 className="mt-4 text-2xl font-bold text-gray-900">
          {getStatusMessage(status)}
        </h4>
        <p className="mt-2 text-gray-600">
          {loading && 'Checking status...'}
          {error && <span className="text-red-600">{error}</span>}
        </p>
      </div>

      {/* Deposit Address */}
      {depositAddress && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deposit Address
          </label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-sm bg-white p-2 rounded border break-all">
              {depositAddress}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(depositAddress)}
              className="btn btn-secondary px-3 py-2"
              title="Copy to clipboard"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <div className="space-y-4">
        <h5 className="font-semibold text-gray-900">Timeline</h5>
        
        {/* Quote Received */}
        <div className="flex items-start">
          <div className={`mt-1 rounded-full p-1 ${status === 'PENDING_QUOTE' || status === 'PENDING_DEPOSIT' || status === 'PROCESSING' || status === 'SUCCESS' ? 'bg-green-500' : 'bg-gray-300'}`}>
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Quote received</p>
            <p className="text-xs text-gray-500">Deposit address generated</p>
          </div>
        </div>

        {/* Deposit Pending */}
        <div className="flex items-start">
          <div className={`mt-1 rounded-full p-1 ${status === 'PROCESSING' || status === 'SUCCESS' ? 'bg-green-500' : status === 'PENDING_DEPOSIT' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'}`}>
            {status === 'PROCESSING' || status === 'SUCCESS' ? (
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="h-4 w-4" />
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Awaiting deposit</p>
            <p className="text-xs text-gray-500">Send funds to the deposit address</p>
          </div>
        </div>

        {/* Processing */}
        <div className="flex items-start">
          <div className={`mt-1 rounded-full p-1 ${status === 'SUCCESS' ? 'bg-green-500' : status === 'PROCESSING' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}>
            {status === 'SUCCESS' ? (
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="h-4 w-4" />
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Processing swap</p>
            <p className="text-xs text-gray-500">Executing cross-chain transfer</p>
          </div>
        </div>

        {/* Complete */}
        <div className="flex items-start">
          <div className={`mt-1 rounded-full p-1 ${status === 'SUCCESS' ? 'bg-green-500' : 'bg-gray-300'}`}>
            {status === 'SUCCESS' && (
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Complete</p>
            <p className="text-xs text-gray-500">Tokens received</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {status === 'SUCCESS' && (
        <button
          onClick={onReset}
          className="btn btn-primary w-full mt-6 py-3"
        >
          Start New Swap
        </button>
      )}

      {(status === 'FAILED' || status === 'REFUNDED') && (
        <button
          onClick={onReset}
          className="btn btn-secondary w-full mt-6 py-3"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
