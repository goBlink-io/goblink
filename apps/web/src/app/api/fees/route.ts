import { NextResponse } from 'next/server';
import { getFeeTiers, getMinFeeUsd } from '@/lib/server/fees';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const tiers = getFeeTiers();
  const minFeeUsd = getMinFeeUsd();

  return NextResponse.json({
    tiers: tiers.map(t => ({
      maxAmountUsd: t.maxAmountUsd,
      percent: (t.bps / 100).toFixed(2),
      bps: t.bps,
      label: t.maxAmountUsd === null
        ? 'Whale'
        : t.maxAmountUsd <= 5000
          ? 'Standard'
          : 'Pro',
    })),
    minFeeUsd,
    summary: [
      { range: 'Under $5,000', rate: '0.35%' },
      { range: '$5,000 – $50,000', rate: '0.10%' },
      { range: 'Over $50,000', rate: '0.05%' },
    ],
  });
}
