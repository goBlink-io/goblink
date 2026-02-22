'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import SwapForm from './SwapForm';
import TransferModal from './TransferModal';
import { PaymentRequestData } from '@/lib/payment-requests';
import { ChainLogo } from '@/lib/chain-logos';

interface PaymentModalProps {
  data: PaymentRequestData;
  toLogo: ChainLogo | null;
  onClose: () => void;
}

export default function PaymentModal({ data, toLogo, onClose }: PaymentModalProps) {
  const [quoteData, setQuoteData] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const chainName = toLogo?.name ?? (data.toChain.charAt(0).toUpperCase() + data.toChain.slice(1));
  const requester = data.name || `${data.recipient.slice(0, 8)}...${data.recipient.slice(-6)}`;

  const initialValues = {
    toChain: data.toChain,
    toToken: data.toToken,
    recipient: data.recipient,
    lockDest: true,
  };

  return (
    <>
      {/* Modal overlay */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <div
          className="relative w-full sm:max-w-md max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              {toLogo?.icon && (
                <img
                  src={toLogo.icon}
                  alt={chainName}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div>
                <div className="text-tiny font-medium" style={{ color: 'var(--text-muted)' }}>
                  {requester} requests
                </div>
                <div className="font-bold text-body-sm" style={{ color: 'var(--text-primary)' }}>
                  {data.amount} {data.toToken}
                  <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>on {chainName}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-opacity hover:opacity-70"
              aria-label="Close"
            >
              <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* ── Body — scrollable ── */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Payment context pill */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
              style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}
            >
              <Zap className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
              <p className="text-tiny" style={{ color: 'var(--text-secondary)' }}>
                Pay with <strong>any token from any chain.</strong> goBlink converts it — the recipient gets
                exactly <strong>{data.amount} {data.toToken}</strong> on {chainName}.
              </p>
            </div>

            <SwapForm
              onQuoteReceived={setQuoteData}
              onSwapInitiated={() => {}}
              refreshKey={refreshKey}
              initialValues={initialValues}
            />
          </div>
        </div>
      </div>

      {/* TransferModal mounts above the payment modal */}
      {quoteData && (
        <TransferModal
          quote={quoteData}
          onClose={() => setQuoteData(null)}
          onComplete={() => {
            setQuoteData(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}
