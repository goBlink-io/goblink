import type { FeeTier } from '@goblink/shared';

// ─── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_FEE_BPS = parseInt(process.env.APP_FEE_BPS || '35', 10);
const MIN_FEE_USD = parseFloat(process.env.APP_MIN_FEE_USD || '0.50');

/**
 * Fee tiers (sorted ascending by maxAmountUsd).
 * Default: 3-tier structure
 *   < $5,000    → 0.35% (35 bps)
 *   $5K–$50K    → 0.10% (10 bps)
 *   > $50,000   → 0.05% (5 bps)
 */
const DEFAULT_TIERS: FeeTier[] = [
  { maxAmountUsd: 5000, bps: 35 },
  { maxAmountUsd: 50000, bps: 10 },
  { maxAmountUsd: null, bps: 5 },
];

let feeTiers: FeeTier[] = DEFAULT_TIERS;
try {
  if (process.env.FEE_TIERS) {
    feeTiers = JSON.parse(process.env.FEE_TIERS);
  }
} catch {
  console.error('Error parsing FEE_TIERS environment variable, using defaults');
}

// ─── Exports ─────────────────────────────────────────────────────────────────

/**
 * Calculate the fee in basis points for a given USD amount.
 * Falls back to DEFAULT_FEE_BPS if no USD estimate is available.
 */
export const calculateFeeBps = (amountUsd?: number): number => {
  if (amountUsd === undefined || amountUsd <= 0) {
    return DEFAULT_FEE_BPS;
  }
  const tier = feeTiers.find(t => t.maxAmountUsd === null || amountUsd <= t.maxAmountUsd);
  return tier ? tier.bps : DEFAULT_FEE_BPS;
};

/**
 * Get the minimum fee in USD ($0.50 floor).
 * The quote route should enforce this: if the calculated percentage fee
 * is below this floor, use a higher bps to meet the minimum.
 */
export const getMinFeeUsd = (): number => MIN_FEE_USD;

/**
 * Maximum fee bps we will ever charge — prevents absurd percentages on
 * tiny transfers when the $0.50 floor is applied.
 * 300 bps = 3%.
 */
const MAX_FEE_BPS = 300;

/**
 * Calculate the effective fee bps, ensuring the $0.50 floor is met.
 * The floor only kicks in for amounts ≥ $10 to avoid charging 25%+ on
 * micro-transfers. The result is always capped at MAX_FEE_BPS (3%).
 */
export const calculateEffectiveFeeBps = (amountUsd?: number): number => {
  if (amountUsd === undefined || amountUsd <= 0) {
    return DEFAULT_FEE_BPS;
  }

  const tierBps = calculateFeeBps(amountUsd);

  // Only apply the $0.50 minimum floor for amounts ≥ $10.
  // Below that, the percentage alone would make the fee unreasonably large.
  if (amountUsd >= 10) {
    const feeUsd = amountUsd * (tierBps / 10000);
    if (feeUsd < MIN_FEE_USD) {
      const floorBps = Math.ceil((MIN_FEE_USD / amountUsd) * 10000);
      return Math.min(Math.max(tierBps, floorBps), MAX_FEE_BPS);
    }
  }

  return Math.min(tierBps, MAX_FEE_BPS);
};

/**
 * Get fee tier info for display (used by frontend).
 */
export const getFeeTiers = (): FeeTier[] => feeTiers;

export const getFeeRecipient = (): string => {
  return process.env.APP_FEE_RECIPIENT || 'goblink.near';
};
