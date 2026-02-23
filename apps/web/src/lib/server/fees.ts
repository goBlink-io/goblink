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
 * Calculate the effective fee bps, ensuring the $0.50 minimum floor is met.
 *
 * Floor logic: if the percentage-based fee < $0.50, bump bps up to hit the floor.
 * Cap: effective bps is always capped at MAX_FEE_BPS (3%) so tiny transfers
 * never see absurd percentages (e.g. 54%). For very small amounts the floor
 * won't be fully reached but users pay at most 3%.
 *
 * Examples at current rates:
 *   $1 transfer  → 300 bps (3%, capped) = $0.03  [floor unreachable]
 *   $17 transfer → 294 bps (2.94%)       = $0.50  [floor hit]
 *   $50 transfer → 100 bps (1.0%)        = $0.50  [floor hit]
 *   $100 transfer→  50 bps (0.5%)        = $0.50  [floor hit]
 *   $1K transfer →  35 bps (0.35%)       = $3.50  [above floor]
 */
export const calculateEffectiveFeeBps = (amountUsd?: number): number => {
  if (amountUsd === undefined || amountUsd <= 0) {
    return DEFAULT_FEE_BPS;
  }

  const tierBps = calculateFeeBps(amountUsd);
  const feeUsd = amountUsd * (tierBps / 10000);

  if (feeUsd < MIN_FEE_USD) {
    // bps needed to hit the $0.50 floor, capped at MAX_FEE_BPS
    const floorBps = Math.ceil((MIN_FEE_USD / amountUsd) * 10000);
    return Math.min(Math.max(tierBps, floorBps), MAX_FEE_BPS);
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
