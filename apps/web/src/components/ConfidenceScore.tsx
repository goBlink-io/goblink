'use client';

import { useMemo } from 'react';
import { Shield, Clock, Zap, TrendingUp } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ConfidenceScoreProps {
  timeEstimate: number | null;     // seconds from quote
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amountUsd?: number | null;
  quoteAvailable: boolean;         // Did we get a valid quote?
}

interface ScoreResult {
  score: number;        // 0–100
  label: string;        // "Excellent" | "Good" | "Fair"
  color: string;        // CSS color
  bgColor: string;      // Background
  signals: Signal[];
}

interface Signal {
  icon: React.ReactNode;
  text: string;
  positive: boolean;
}

// ── Scoring logic ──────────────────────────────────────────────────────────────

// Well-established routes with high liquidity
const HIGH_LIQUIDITY_PAIRS = new Set([
  'ethereum-near', 'near-ethereum',
  'ethereum-solana', 'solana-ethereum',
  'ethereum-base', 'base-ethereum',
  'ethereum-arbitrum', 'arbitrum-ethereum',
  'ethereum-polygon', 'polygon-ethereum',
  'ethereum-bsc', 'bsc-ethereum',
  'near-solana', 'solana-near',
  'near-base', 'base-near',
  'near-arbitrum', 'arbitrum-near',
]);

// Stablecoins are the most reliable routes
const STABLECOINS = new Set(['USDC', 'USDT', 'DAI', 'USDC.e', 'BUSD']);

function calculateScore(props: ConfidenceScoreProps): ScoreResult | null {
  if (!props.quoteAvailable) return null;

  let score = 0;
  const signals: Signal[] = [];

  // 1. Quote availability (base score)
  score += 40;
  signals.push({
    icon: <Zap className="h-3.5 w-3.5" />,
    text: 'Route is active and available',
    positive: true,
  });

  // 2. Time estimate quality
  if (props.timeEstimate !== null) {
    if (props.timeEstimate <= 30) {
      score += 25;
      signals.push({
        icon: <Clock className="h-3.5 w-3.5" />,
        text: `Estimated ${props.timeEstimate}s — lightning fast`,
        positive: true,
      });
    } else if (props.timeEstimate <= 60) {
      score += 20;
      signals.push({
        icon: <Clock className="h-3.5 w-3.5" />,
        text: `Estimated ${props.timeEstimate}s — normal speed`,
        positive: true,
      });
    } else if (props.timeEstimate <= 180) {
      score += 10;
      signals.push({
        icon: <Clock className="h-3.5 w-3.5" />,
        text: `Estimated ${Math.round(props.timeEstimate / 60)}min — may take a moment`,
        positive: true,
      });
    } else {
      score += 5;
      signals.push({
        icon: <Clock className="h-3.5 w-3.5" />,
        text: `Estimated ${Math.round(props.timeEstimate / 60)}min — longer route`,
        positive: false,
      });
    }
  }

  // 3. Route liquidity (known high-volume pairs)
  const pairKey = `${props.fromChain}-${props.toChain}`;
  if (HIGH_LIQUIDITY_PAIRS.has(pairKey)) {
    score += 20;
    signals.push({
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      text: 'High-volume route',
      positive: true,
    });
  } else {
    score += 10;
  }

  // 4. Stablecoin bonus
  if (STABLECOINS.has(props.fromToken) || STABLECOINS.has(props.toToken)) {
    score += 15;
    signals.push({
      icon: <Shield className="h-3.5 w-3.5" />,
      text: 'Stablecoin pair — minimal price movement',
      positive: true,
    });
  } else {
    score += 5;
  }

  // Cap at 100
  score = Math.min(100, score);

  // Label + colors
  let label: string;
  let color: string;
  let bgColor: string;

  if (score >= 85) {
    label = 'Excellent';
    color = 'var(--success, #22c55e)';
    bgColor = 'var(--success-bg, rgba(34,197,94,0.08))';
  } else if (score >= 65) {
    label = 'Good';
    color = 'var(--brand, #2563eb)';
    bgColor = 'var(--info-bg, rgba(37,99,235,0.08))';
  } else {
    label = 'Fair';
    color = 'var(--warning, #eab308)';
    bgColor = 'var(--warning-bg, rgba(234,179,8,0.08))';
  }

  return { score, label, color, bgColor, signals };
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ConfidenceScore(props: ConfidenceScoreProps) {
  const result = useMemo(() => calculateScore(props), [
    props.timeEstimate,
    props.fromChain,
    props.toChain,
    props.fromToken,
    props.toToken,
    props.quoteAvailable,
  ]);

  if (!result) return null;

  return (
    <div className="rounded-xl p-3.5 mb-4" style={{ background: result.bgColor, borderLeft: `3px solid ${result.color}` }}>
      {/* Score header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: result.color }} />
          <span className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Route Confidence
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-body-sm font-bold" style={{ color: result.color }}>
            {result.score}
          </span>
          <span className="text-caption font-medium" style={{ color: result.color }}>
            {result.label}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(0,0,0,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${result.score}%`,
            background: result.color,
          }}
        />
      </div>

      {/* Signals */}
      <div className="space-y-1.5">
        {result.signals.map((signal, i) => (
          <div key={i} className="flex items-center gap-2">
            <span style={{ color: signal.positive ? result.color : 'var(--text-muted)' }}>
              {signal.icon}
            </span>
            <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>
              {signal.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
