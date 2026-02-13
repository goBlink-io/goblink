'use client';

import { useState } from 'react';
import SwapForm from '@/components/SwapForm';
import QuotePreview from '@/components/QuotePreview';
import StatusTracker from '@/components/StatusTracker';

export default function Home() {
  const [quoteData, setQuoteData] = useState<any>(null);
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [showStatus, setShowStatus] = useState(false);

  const handleQuoteReceived = (quote: any) => {
    setQuoteData(quote);
  };

  const handleSwapInitiated = (address: string) => {
    setDepositAddress(address);
    setShowStatus(true);
  };

  const handleReset = () => {
    setQuoteData(null);
    setDepositAddress('');
    setShowStatus(false);
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
          <SwapForm 
            onQuoteReceived={handleQuoteReceived}
            onSwapInitiated={handleSwapInitiated}
          />
          
          {quoteData && (
            <QuotePreview 
              quote={quoteData}
              onReset={handleReset}
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
