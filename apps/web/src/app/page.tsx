'use client';

import { useState } from 'react';
import SwapForm from '@/components/SwapForm';
import TransferModal from '@/components/TransferModal';
import RecentTransfers from '@/components/RecentTransfers';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { getChainsByType } from '@/lib/chain-logos';
import { Zap, Shield, TrendingUp } from 'lucide-react';

export default function Home() {
  const [quoteData, setQuoteData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [, setTrackingAddress] = useState<string>('');
  const { history, addEntry } = useTransactionHistory();

  const handleQuoteReceived = (quote: any) => {
    setQuoteData(quote);
    setShowModal(true);
  };

  const handleTransferComplete = (depositAddress: string, txHash?: string) => {
    setTrackingAddress(depositAddress);

    if (quoteData) {
      addEntry({
        fromChain: quoteData.fromChain || '?',
        toChain: quoteData.toChain || '?',
        fromToken: quoteData.originTokenMetadata?.symbol || '?',
        toToken: quoteData.destinationTokenMetadata?.symbol || '?',
        amount: quoteData.quote?.amountInFormatted || '',
        depositAddress,
        status: 'PENDING_DEPOSIT',
      });
    }

    if (txHash) {
      fetch('/api/deposit/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, depositAddress }),
      }).catch(err => console.error('Error submitting tx:', err));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => { setQuoteData(null); setTrackingAddress(''); }, 300);
  };

  const handleHistorySelect = (addr: string) => {
    setTrackingAddress(addr);
    // For history items, we create a minimal quote to open tracking
    setQuoteData(null);
    setShowModal(false);
    // TODO: Open a tracking-only modal
  };

  const chainGroups = getChainsByType();

  return (
    <div className="mx-auto max-w-2xl">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Send Across Any Chain, Instantly
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Transfer tokens between 29 blockchains in seconds. No bridges, no complexity.
        </p>
      </div>

      <div className="space-y-6">
        {/* Swap Form */}
        <SwapForm
          onQuoteReceived={handleQuoteReceived}
          onSwapInitiated={() => {}}
        />

        {/* Recent Transfers */}
        <RecentTransfers history={history} onSelect={handleHistorySelect} />

        {/* Supported Chains */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Supported Chains</h3>
          
          {/* Wallet-connected chains */}
          <div className="flex flex-wrap gap-2 mb-3">
            {chainGroups.wallet.map(chain => (
              <div key={chain.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 transition-colors hover:border-gray-300 dark:hover:border-gray-600"
                title={chain.name}>
                <img src={chain.icon} alt={chain.name} className="w-5 h-5 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{chain.name}</span>
              </div>
            ))}
          </div>

          {/* Destination-only */}
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">+ receive on</div>
          <div className="flex flex-wrap gap-2">
            {chainGroups.destinationOnly.map(chain => (
              <div key={chain.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 opacity-75"
                title={`${chain.name} (receive only)`}>
                <img src={chain.icon} alt={chain.name} className="w-5 h-5 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{chain.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showModal && quoteData && (
        <TransferModal
          quote={quoteData}
          onClose={handleCloseModal}
          onComplete={handleTransferComplete}
        />
      )}

      {/* Features */}
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
