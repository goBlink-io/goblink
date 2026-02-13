import { FeeTier } from '@sapphire/shared';

const DEFAULT_FEE_BPS = parseInt(process.env.APP_FEE_BPS || '50', 10);

// Parse fee tiers from environment variable if available
let feeTiers: FeeTier[] = [];
try {
  if (process.env.FEE_TIERS) {
    feeTiers = JSON.parse(process.env.FEE_TIERS);
  }
} catch (error) {
  console.error('Error parsing FEE_TIERS environment variable:', error);
}

/**
 * Calculates the application fee in basis points based on the transaction amount in USD.
 * @param amountUsd The transaction amount in USD (optional, for tiered pricing)
 * @returns The fee in basis points
 */
export const calculateFeeBps = (amountUsd?: number): number => {
  if (feeTiers.length === 0 || amountUsd === undefined) {
    return DEFAULT_FEE_BPS;
  }

  // Find the first tier where amountUsd is less than or equal to maxAmountUsd
  const tier = feeTiers.find(t => t.maxAmountUsd === null || amountUsd <= t.maxAmountUsd);
  
  return tier ? tier.bps : DEFAULT_FEE_BPS;
};

/**
 * Returns the fee recipient NEAR account ID.
 */
export const getFeeRecipient = (): string => {
  return process.env.APP_FEE_RECIPIENT || 'sapphire.near';
};
