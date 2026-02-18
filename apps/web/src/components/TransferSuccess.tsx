'use client';

import { useState, useEffect } from 'react';
import { Trophy, Share2, Check } from 'lucide-react';

interface TransferSuccessProps {
  amountOut: string;
  toToken: string;
  toChain: string;
  elapsedSeconds: number;
  feeUsd?: number | null;
}

export default function TransferSuccess({
  amountOut,
  toToken,
  toChain,
  elapsedSeconds,
  feeUsd,
}: TransferSuccessProps) {
  const [shared, setShared] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; color: string; delay: number; size: number }>
  >([]);

  useEffect(() => {
    const colors = ['#2563EB', '#7C3AED', '#22C55E', '#EAB308', '#F97316', '#EC4899'];
    setParticles(
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 1.2,
        size: 6 + Math.random() * 6,
      }))
    );
  }, []);

  const estimatedSavings = feeUsd ? (feeUsd * 3).toFixed(2) : null;
  const chainName = toChain.charAt(0).toUpperCase() + toChain.slice(1);

  const handleShare = () => {
    const text = [
      `Just transferred ${amountOut} ${toToken} to ${chainName} in ${elapsedSeconds}s using goBlink ⚡`,
      `No bridges. No waiting. Just instant transfers.`,
      `https://goblink.xyz`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    });
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl py-8 px-6 text-center"
      style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
    >
      {/* CSS Confetti */}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg) scale(1);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(130px) rotate(720deg) scale(0.6); opacity: 0; }
        }
      `}</style>

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-12px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            animation: `confetti-fall 1.8s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}

      {/* Checkmark circle */}
      <div
        className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full"
        style={{ background: 'rgba(34,197,94,0.15)' }}
      >
        <Check className="h-8 w-8" style={{ color: 'var(--success, #22c55e)' }} />
      </div>

      <div className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        🎉 Done!
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        {amountOut} {toToken} arrived on {chainName} in {elapsedSeconds}s
      </p>

      {estimatedSavings && (
        <div
          className="flex items-center justify-center gap-2 mb-5 px-4 py-2.5 rounded-lg"
          style={{ background: 'rgba(34,197,94,0.12)' }}
        >
          <Trophy className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--success, #22c55e)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--success, #22c55e)' }}>
            You saved ~${estimatedSavings} vs manual bridging
          </span>
        </div>
      )}

      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
        style={{
          background: 'var(--elevated)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        {shared ? (
          <Check className="h-4 w-4" style={{ color: 'var(--success)' }} />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {shared ? 'Copied to clipboard!' : 'Share this transfer →'}
      </button>
    </div>
  );
}
