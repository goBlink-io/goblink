'use client';

import { useState } from 'react';
import SwapForm from '@/components/SwapForm';
import QuotePreview from '@/components/QuotePreview';
import TransactionModal from '@/components/TransactionModal';
import RecentTransfers from '@/components/RecentTransfers';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { Zap, Shield, TrendingUp } from 'lucide-react';

export default function Home() {
  const [quoteData, setQuoteData] = useState<any>(null);
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { history, addEntry } = useTransactionHistory();

  const handleQuoteReceived = (quote: any) => {
    setQuoteData(quote);
    setError(null);
  };

  const handleSwapInitiated = (address: string, txHash?: string) => {
    setDepositAddress(address);
    setShowModal(true);
    setError(null);

    // Save to history
    if (quoteData) {
      addEntry({
        fromChain: quoteData.fromChain || '?',
        toChain: quoteData.toChain || '?',
        fromToken: quoteData.originTokenMetadata?.symbol || '?',
        toToken: quoteData.destinationTokenMetadata?.symbol || '?',
        amount: quoteData.quote?.amountInFormatted || '',
        depositAddress: address,
        status: 'PENDING_DEPOSIT',
      });
    }

    if (txHash) submitDepositTransaction(txHash, address);
  };

  const submitDepositTransaction = async (txHash: string, depAddr: string) => {
    try {
      const response = await fetch('/api/deposit/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, depositAddress: depAddr }),
      });
      if (!response.ok) console.error('Failed to submit transaction hash to API');
    } catch (err) {
      console.error('Error submitting transaction:', err);
    }
  };

  const handleReset = () => {
    setQuoteData(null);
    setDepositAddress('');
    setShowModal(false);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => {
      setQuoteData(null);
      setDepositAddress('');
    }, 300);
  };

  const handleHistorySelect = (addr: string) => {
    setDepositAddress(addr);
    setShowModal(true);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Send Across Any Chain, Instantly
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Transfer tokens between 20+ blockchains in seconds. No bridges, no complexity.
        </p>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="card p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p>
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
            onSwapInitiated={handleSwapInitiated}
          />
        )}

        {/* Recent Transfers */}
        <RecentTransfers history={history} onSelect={handleHistorySelect} />
      </div>

      {/* Transaction Modal */}
      {showModal && depositAddress && (
        <TransactionModal
          depositAddress={depositAddress}
          onClose={handleCloseModal}
        />
      )}

      {/* Features Section */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
          <p className="text-gray-600 dark:text-gray-400">Transfers complete in seconds, not minutes. Real-time status updates.</p>
        </div>

        <div className="card p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
            <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure</h3>
          <p className="text-gray-600 dark:text-gray-400">Non-custodial and transparent. Your keys, your tokens, always.</p>
        </div>

        <div className="card p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Best Rates</h3>
          <p className="text-gray-600 dark:text-gray-400">Competitive pricing with transparent fees. No hidden costs.</p>
        </div>
      </div>
    </div>
  );
}
