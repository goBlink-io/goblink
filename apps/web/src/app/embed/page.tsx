'use client';

import { Suspense } from 'react';
import SwapForm from '@/components/SwapForm';
import TransferModal from '@/components/TransferModal';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Zap } from 'lucide-react';

/**
 * Parse the comma-separated NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS env var.
 * Returns an empty array if not set (restrictive default — no postMessage).
 */
function getAllowedOrigins(): string[] {
  const raw = process.env.NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS;
  if (!raw) return [];
  return raw.split(',').map(o => o.trim()).filter(Boolean);
}

function EmbedInner() {
  const searchParams = useSearchParams();
  const [quoteData, setQuoteData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const { addEntry } = useTransactionHistory();
  const validatedOriginRef = useRef<string | null>(null);
  const allowedOrigins = useRef(getAllowedOrigins());

  /** Post a message to the parent window only if origin is validated */
  const postToParent = useCallback((event: Record<string, unknown>) => {
    try {
      if (window.parent && window.parent !== window && validatedOriginRef.current) {
        window.parent.postMessage(event, validatedOriginRef.current);
      }
    } catch {
      // Cross-origin restriction — silently ignore
    }
  }, []);

  // Listen for init handshake from parent
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type !== 'goblink:init') return;
      const origin = e.origin;
      if (allowedOrigins.current.length === 0) {
        console.warn('[embed] NEXT_PUBLIC_EMBED_ALLOWED_ORIGINS not set — postMessage disabled');
        return;
      }
      if (allowedOrigins.current.includes(origin)) {
        validatedOriginRef.current = origin;
        // Acknowledge the handshake
        try {
          window.parent.postMessage({ type: 'goblink:ready' }, origin);
        } catch { /* ignore */ }
      } else {
        console.warn(`[embed] Origin ${origin} not in allowlist`);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Read URL params for pre-filling the form
  const toChain = searchParams.get('chain') || searchParams.get('toChain') || undefined;
  const toToken = searchParams.get('token') || searchParams.get('toToken') || undefined;
  const recipient = searchParams.get('to') || searchParams.get('toAddress') || undefined;
  const amount = searchParams.get('amount') || undefined;
  const fromChain = searchParams.get('fromChain') || undefined;
  const theme = searchParams.get('theme') || undefined;

  // Build initial values for SwapForm
  const initialValues = (toChain || toToken || recipient || amount) ? {
    toChain: toChain || undefined,
    toToken: toToken || undefined,
    recipient: recipient || undefined,
    amount: amount || undefined,
    fromChain: fromChain || undefined,
    lockDest: !!(recipient && toChain && toToken), // Lock if merchant pre-filled everything
  } : undefined;

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

    // Notify parent window (SDK widget)
    postToParent({
      type: 'goblink:success',
      transfer: {
        depositAddress,
        txHash: txHash || null,
        fromChain: quoteData?.fromChain,
        toChain: quoteData?.toChain,
        fromToken: quoteData?.originTokenMetadata?.symbol,
        toToken: quoteData?.destinationTokenMetadata?.symbol,
        amountIn: quoteData?.quote?.amountInFormatted,
        amountOut: quoteData?.quote?.amountOutFormatted,
      },
    });

    if (txHash) {
      fetch('/api/deposit/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, depositAddress }),
      }).catch(err => console.error('Error submitting tx:', err));
    }
  };

  const handleOutcome = (result: { status: string; fulfillmentTxHash?: string }) => {
    const isPaid = result.status === 'SUCCESS' || result.status === 'COMPLETED' || result.status === 'paid';
    postToParent({
      type: isPaid ? 'goblink:success' : 'goblink:error',
      ...(isPaid
        ? { transfer: { status: 'paid', fulfillmentTxHash: result.fulfillmentTxHash } }
        : { error: { message: 'Transfer failed', code: 'TRANSFER_FAILED' } }),
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => { setQuoteData(null); }, 300);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: theme === 'light' ? '#ffffff' : 'var(--bg-primary)',
        ...(theme === 'light' ? { colorScheme: 'light' as any } : {}),
      }}
    >
      {/* Swap card */}
      <div className="w-full max-w-[480px]">
        <SwapForm
          onQuoteReceived={handleQuoteReceived}
          onSwapInitiated={() => {}}
          initialValues={initialValues}
        />
      </div>

      {/* Minimal branding */}
      <div className="mt-4 flex items-center gap-1.5">
        <span className="text-tiny" style={{ color: 'var(--text-faint)' }}>Powered by</span>
        <Link
          href="https://goblink.io"
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
          onOutcome={handleOutcome}
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
