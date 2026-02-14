'use client';

import { useState } from 'react';
import SwapForm from '@/components/SwapForm';
import QuotePreview from '@/components/QuotePreview';
import StatusTracker from '@/components/StatusTracker';

export default function Home() {
  const [quoteData, setQuoteData] = useState<any>(null);
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [showStatus, setShowStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuoteReceived = (quote: any) => {
    setQuoteData(quote);
    setError(null);
  };

  const handleConfirmSwap = async (quoteRequest: any) => {
    try {
      // Get actual quote with deposit address
      const response = await fetch('http://localhost:3001/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quoteRequest,
          dry: false, // Get actual deposit address
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get deposit address');
      }

      const actualQuote = await response.json();
      
      if (!actualQuote.depositAddress) {
        throw new Error('No deposit address received');
      }

      handleSwapInitiated(actualQuote.depositAddress);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm swap');
      console.error('Confirm swap error:', err);
    }
  };

  const handleSwapInitiated = (address: string) => {
    setDepositAddress(address);
    setShowStatus(true);
    setError(null);
  };

  const handleReset = () => {
    setQuoteData(null);
    setDepositAddress('');
    setShowStatus(false);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Cross-Chain Swaps Made Simple
        </h1>
        <p className="text-lg text-gray-600">
          Swap between 20+ blockchains in seconds. No bridges, no complexity.
        </p>
      </div>

      {!showStatus ? (
        <div className="space-y-6">
          {error && (
            <div className="card p-4 bg-red-50 border border-red-200">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-900">{error}</p>
                </div>
              </div>
            </div>
          )}

          <SwapForm
            onQuoteReceived={handleQuoteReceived}
            onSwapInitiated={handleSwapInitiated}
          />
          
          {quoteData && (
            <QuotePreview
              quote={quoteData}
              onReset={handleReset}
              onConfirmSwap={handleConfirmSwap}
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <StatusTracker 
            depositAddress={depositAddress}
            onReset={handleReset}
          />
        </div>
      )}

      {/* Features Section */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
          <p className="text-gray-600">Swaps complete in seconds, not minutes. Real-time status updates.</p>
        </div>

        <div className="card p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure</h3>
          <p className="text-gray-600">Powered by NEAR Intents protocol. Non-custodial and transparent.</p>
        </div>

        <div className="card p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Rates</h3>
          <p className="text-gray-600">Competitive pricing with transparent fees. No hidden costs.</p>
        </div>
      </div>
    </div>
  );
}
