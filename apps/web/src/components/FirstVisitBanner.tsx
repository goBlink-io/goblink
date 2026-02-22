'use client';

import { useState, useEffect } from 'react';
import { X, Wallet, Eye, Zap } from 'lucide-react';

const STORAGE_KEY = 'goblink_intro_seen';

interface FirstVisitBannerProps {
  /** Call this from page after a transfer completes so the banner auto-dismisses */
  onDismiss?: () => void;
}

export default function FirstVisitBanner({ onDismiss }: FirstVisitBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
    } catch {
      // Private browsing or storage blocked — just hide it
    }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* */ }
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div
      className="mb-4 rounded-2xl overflow-hidden animate-fade-up"
      style={{
        background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)',
        border: '1px solid rgba(124,58,237,0.2)',
      }}
    >
      <div className="px-4 pt-4 pb-3">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-body-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              First time? Here&apos;s how it works.
            </p>
            <p className="text-tiny mt-0.5" style={{ color: 'var(--text-muted)' }}>
              No bridges. No wrapping. Usually under 60 seconds.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg transition-all hover:opacity-70 active:scale-90 flex-shrink-0 ml-3"
            style={{ color: 'var(--text-faint)' }}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 3 steps */}
        <div className="flex items-start gap-2">
          {/* Step 1 */}
          <div className="flex-1 flex flex-col items-center text-center gap-1.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(37,99,235,0.12)' }}
            >
              <Wallet className="h-4 w-4" style={{ color: '#2563EB' }} />
            </div>
            <div>
              <p className="text-tiny font-semibold" style={{ color: 'var(--text-primary)' }}>Connect</p>
              <p className="text-tiny leading-tight" style={{ color: 'var(--text-muted)' }}>
                Wallets on both chains
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="pt-3 flex-shrink-0" style={{ color: 'var(--text-faint)' }}>›</div>

          {/* Step 2 */}
          <div className="flex-1 flex flex-col items-center text-center gap-1.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(124,58,237,0.12)' }}
            >
              <Eye className="h-4 w-4" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <p className="text-tiny font-semibold" style={{ color: 'var(--text-primary)' }}>Preview</p>
              <p className="text-tiny leading-tight" style={{ color: 'var(--text-muted)' }}>
                Pick tokens, see exact fee
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="pt-3 flex-shrink-0" style={{ color: 'var(--text-faint)' }}>›</div>

          {/* Step 3 */}
          <div className="flex-1 flex flex-col items-center text-center gap-1.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.12)' }}
            >
              <Zap className="h-4 w-4" style={{ color: '#16a34a' }} />
            </div>
            <div>
              <p className="text-tiny font-semibold" style={{ color: 'var(--text-primary)' }}>Confirm</p>
              <p className="text-tiny leading-tight" style={{ color: 'var(--text-muted)' }}>
                Approve once — we handle the rest
              </p>
            </div>
          </div>
        </div>

        {/* Dismiss link */}
        <div className="mt-3 text-center">
          <button
            onClick={dismiss}
            className="text-tiny font-medium transition-all hover:opacity-70"
            style={{ color: 'var(--text-faint)' }}
          >
            Got it, don&apos;t show again
          </button>
        </div>
      </div>
    </div>
  );
}

/** Call this from outside (e.g. after first transfer) to permanently dismiss the banner */
export function markIntroDismissed() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* */ }
}
