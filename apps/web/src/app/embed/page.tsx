'use client';

import { Suspense } from 'react';
import SwapForm from '@/components/SwapForm';
import TransferModal from '@/components/TransferModal';
import { useState } from 'react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import Link from 'next/link';
import { Zap } from 'lucide-react';

function EmbedInner() {
  const [quoteData, setQuoteData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const { addEntry } = useTransactionHistory();

  const handleQuoteReceived = (quote: any) => {
    setQuoteData(quote);
    setShowModal(true);
  };

  const handleTransferComplete = (depositAddress: string, txHash?: string) => {
    if (quoteData) {
      addEntry({
        fromChain: quoteData.fromChain ?? '?',
        toChain: quoteData.toChain ?? '?',
        fromToken: quoteData.originTokenMetadata?.symbol ?? '?',
        toToken: quoteData.destinationTokenMetadata?.symbol ?? '?',
        amount: quoteData.quote?.amountInFormatted ?? '',
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
    setTimeout(() => { setQuoteData(null); }, 300);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Swap card */}
      <div className="w-full max-w-[480px]">
        <SwapForm
          onQuoteReceived={handleQuoteReceived}
          onSwapInitiated={() => {}}
        />
      </div>

      {/* Minimal branding */}
      <div className="mt-4 flex items-center gap-1.5">
        <span className="text-tiny" style={{ color: 'var(--text-faint)' }}>Powered by</span>
        <Link
          href="https://goblink.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <span className="text-tiny font-bold text-gradient">goBlink</span>
          <Zap className="h-3 w-3" style={{ color: 'var(--brand)' }} />
        </Link>
      </div>

      {/* Transfer Modal */}
      {showModal && quoteData && (
        <TransferModal
          quote={quoteData}
          onClose={handleCloseModal}
          onComplete={handleTransferComplete}
          onOutcome={() => {}}
        />
      )}
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="animate-pulse text-gradient font-bold">goBlink</div>
      </div>
    }>
      <EmbedInner />
    </Suspense>
  );
}
