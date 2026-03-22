'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Clock, DollarSign, Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { TransferLinkData, formatElapsed } from '@/lib/transfer-links';
import { ChainLogo } from '@/lib/chain-logos';

interface Props {
  data: TransferLinkData | null;
  fromLogo: ChainLogo | null;
  toLogo: ChainLogo | null;
}

function ChainBadge({ logo, chainId, animate }: { logo: ChainLogo | null; chainId: string; animate?: boolean }) {
  const name = logo?.name ?? (chainId.charAt(0).toUpperCase() + chainId.slice(1));
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shadow-lg ${animate ? 'animate-pulse-slow' : ''}`}
        style={{ background: logo?.bgColor ?? 'var(--elevated)', border: `3px solid ${logo?.color ?? 'var(--border)'}` }}
      >
        {logo?.icon ? (
          <img
            src={logo.icon}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-xl font-bold" style={{ color: logo?.color ?? 'var(--text-primary)' }}>
            {chainId[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{name}</span>
    </div>
  );
}

function InvalidReceipt() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="card p-10 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>Invalid Link</h1>
        <p className="text-body-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          This transfer receipt link appears to be invalid or expired.
        </p>
        <Link href="/app" className="btn btn-primary inline-flex items-center gap-2">
          Try goBlink <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function TransferReceiptClient({ data, fromLogo, toLogo }: Props) {
  const [copied, setCopied] = useState(false);

  if (!data) return <InvalidReceipt />;

  const elapsed = data.elapsedSeconds ? formatElapsed(data.elapsedSeconds) : null;
  const savings = data.feeUsd ? `~$${(data.feeUsd * 3).toFixed(2)}` : null;
  const date = new Date(data.timestamp).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Animated gradient background blob */}
      <style>{`
        @keyframes pulse-slow { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        @keyframes slide-arrow { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(6px); } }
        .animate-slide-arrow { animation: slide-arrow 1.5s ease-in-out infinite; }
      `}</style>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-gradient font-black text-2xl">goBlink</span>
            <Zap className="h-5 w-5" style={{ color: 'var(--brand)' }} />
          </Link>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--success)' }} />
            Transfer Completed
          </div>
          <p className="text-tiny" style={{ color: 'var(--text-muted)' }}>{date}</p>
        </div>

        {/* Receipt Card */}
        <div
          className="card p-6 mb-4 relative overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(37,99,235,0.1), 0 2px 8px rgba(0,0,0,0.06)' }}
        >
          {/* Gradient decoration */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'var(--brand)' }}
          />

          {/* Amount hero */}
          <div className="text-center mb-6">
            <div className="text-tiny font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Transferred</div>
            <div className="text-h2 font-black text-gradient">
              {data.amountIn} {data.fromToken}
            </div>
            {data.amountInUsd && (
              <div className="text-body-sm mt-1" style={{ color: 'var(--text-muted)' }}>(${data.amountInUsd})</div>
            )}
          </div>

          {/* Chain route */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <ChainBadge logo={fromLogo} chainId={data.fromChain} animate />
            <div className="flex flex-col items-center gap-1">
              <div
                className="animate-slide-arrow px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'var(--brand)', color: 'white' }}
              >
                ⚡ instant
              </div>
              <ArrowRight className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <ChainBadge logo={toLogo} chainId={data.toChain} animate />
          </div>

          {/* Received amount */}
          <div
            className="text-center p-3 rounded-xl mb-5"
            style={{ background: 'var(--success-bg)', border: '1px solid var(--success)' }}
          >
            <div className="text-tiny font-medium mb-0.5" style={{ color: 'var(--success)' }}>Received</div>
            <div className="text-h4 font-bold" style={{ color: 'var(--success)' }}>
              {data.amountOut} {data.toToken}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {elapsed && (
              <div
                className="p-3 rounded-xl text-center"
                style={{ background: 'var(--elevated)' }}
              >
                <Clock className="h-4 w-4 mx-auto mb-1" style={{ color: 'var(--brand)' }} />
                <div className="text-body-sm font-bold" style={{ color: 'var(--text-primary)' }}>{elapsed}</div>
                <div className="text-tiny" style={{ color: 'var(--text-muted)' }}>Time</div>
              </div>
            )}
            {data.feeUsd && (
              <div
                className="p-3 rounded-xl text-center"
                style={{ background: 'var(--elevated)' }}
              >
                <DollarSign className="h-4 w-4 mx-auto mb-1" style={{ color: 'var(--brand)' }} />
                <div className="text-body-sm font-bold" style={{ color: 'var(--text-primary)' }}>${data.feeUsd.toFixed(2)}</div>
                <div className="text-tiny" style={{ color: 'var(--text-muted)' }}>Fee</div>
              </div>
            )}
            {savings && (
              <div
                className="p-3 rounded-xl text-center"
                style={{ background: 'var(--success-bg)' }}
              >
                <span className="text-base">🏆</span>
                <div className="text-body-sm font-bold" style={{ color: 'var(--success)' }}>{savings}</div>
                <div className="text-tiny" style={{ color: 'var(--text-muted)' }}>Saved</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-80"
            style={{ background: 'var(--elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {copied ? <Check className="h-4 w-4" style={{ color: 'var(--success)' }} /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <Link
            href="/app"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all btn-primary text-white"
            style={{ background: 'var(--brand)' }}
          >
            Try goBlink <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Footer tagline */}
        <p className="text-center text-tiny" style={{ color: 'var(--text-faint)' }}>
          Cross-chain transfers in seconds · 26 chains · No bridges
        </p>
      </div>
    </div>
  );
}
