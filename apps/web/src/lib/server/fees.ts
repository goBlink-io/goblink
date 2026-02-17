import type { FeeTier } from '@sapphire/shared';

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
 * Calculate the effective fee bps, ensuring the $0.50 floor is met.
 * If the percentage-based fee would be less than $0.50, bump bps up.
 */
export const calculateEffectiveFeeBps = (amountUsd?: number): number => {
  if (amountUsd === undefined || amountUsd <= 0) {
    return DEFAULT_FEE_BPS;
  }

  const tierBps = calculateFeeBps(amountUsd);
  const feeUsd = amountUsd * (tierBps / 10000);

  if (feeUsd < MIN_FEE_USD && amountUsd > 0) {
    // Calculate bps needed to reach the $0.50 floor
    // bps = (minFeeUsd / amountUsd) * 10000
    const floorBps = Math.ceil((MIN_FEE_USD / amountUsd) * 10000);
    return Math.max(tierBps, floorBps);
  }

  return tierBps;
};

/**
 * Get fee tier info for display (used by frontend).
 */
export const getFeeTiers = (): FeeTier[] => feeTiers;

export const getFeeRecipient = (): string => {
  return process.env.APP_FEE_RECIPIENT || 'urbanblazer.near';
};
