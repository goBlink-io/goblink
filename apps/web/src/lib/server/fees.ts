import type { FeeTier } from '@sapphire/shared';

const DEFAULT_FEE_BPS = parseInt(process.env.APP_FEE_BPS || '50', 10);

let feeTiers: FeeTier[] = [];
try {
  if (process.env.FEE_TIERS) {
    feeTiers = JSON.parse(process.env.FEE_TIERS);
  }
} catch {
  console.error('Error parsing FEE_TIERS environment variable');
}

export const calculateFeeBps = (amountUsd?: number): number => {
  if (feeTiers.length === 0 || amountUsd === undefined) {
    return DEFAULT_FEE_BPS;
  }
  const tier = feeTiers.find(t => t.maxAmountUsd === null || amountUsd <= t.maxAmountUsd);
  return tier ? tier.bps : DEFAULT_FEE_BPS;
};

export const getFeeRecipient = (): string => {
  return process.env.APP_FEE_RECIPIENT || 'sapphire.near';
};
