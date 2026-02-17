import { NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import { enrichTokenData } from '@/lib/server/dexscreener';
import tokenIcons from '@/data/token-icons.json';

// Cache token list for 5 minutes
export const revalidate = 300;

function applyIconsToAllTokens(tokens: Record<string, unknown>[]): void {
  for (const token of tokens) {
    const normalizedSymbol = (token.symbol as string).replace(/\.(omft|omdep)$/i, '');
    const iconUrl = (tokenIcons as Record<string, string>)[normalizedSymbol];
    if (iconUrl) token.icon = iconUrl;
  }
}

async function enrichTokensWithPricing(tokens: Record<string, unknown>[]): Promise<void> {
  // Batch pricing lookups with concurrency limit
  const BATCH_SIZE = 5;
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (token) => {
        try {
          const priceData = await enrichTokenData(
            token.blockchain as string, token.contractAddress as string, token.symbol as string
          );
          if (priceData.priceUsd) {
            token.priceUsd = priceData.priceUsd;
            token.priceChange24h = priceData.priceChange24h;
          }
        } catch { /* skip */ }
      })
    );
  }
}

// Map 1Click API chain prefixes → our blockchain names
const CHAIN_PREFIX_MAP: Record<string, string> = {
  'eth': 'ethereum', 'base': 'base', 'arb': 'arbitrum',
  'bera': 'berachain', 'sol': 'solana', 'sui': 'sui',
  'gnosis': 'gnosis', 'tron': 'tron', 'starknet': 'starknet',
  'cardano': 'cardano', 'aptos': 'aptos', 'aleo': 'aleo',
};

// Native token asset IDs per chain
const NATIVE_TOKEN_MAP: Record<string, [string, string]> = {
  'ethereum': ['native', '0x0000000000000000000000000000000000000000'],
  'base': ['native', '0x0000000000000000000000000000000000000000'],
  'arbitrum': ['native', '0x0000000000000000000000000000000000000000'],
  'optimism': ['native', '0x0000000000000000000000000000000000000000'],
  'avalanche': ['native', '0x0000000000000000000000000000000000000000'],
  'gnosis': ['native', '0x0000000000000000000000000000000000000000'],
  'berachain': ['native', '0x0000000000000000000000000000000000000000'],
  'monad': ['native', '0x0000000000000000000000000000000000000000'],
  'aurora': ['native', '0x0000000000000000000000000000000000000000'],
  'polygon': ['native', '0x0000000000000000000000000000000000000000'],
  'bsc': ['native', '0x0000000000000000000000000000000000000000'],
  'solana': ['So11111111111111111111111111111111111111112', 'So11111111111111111111111111111111111111112'],
  'sui': ['0x2::sui::SUI', '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'],
};

const BLOCKCHAIN_ALIASES: Record<string, string> = {
  'sol': 'solana', 'pol': 'polygon', 'op': 'optimism', 'avax': 'avalanche',
};

export async function GET() {
  try {
    const rawTokens = await oneclick.getTokens();

    const nearTokens: Record<string, unknown>[] = [];
    const nativeChainTokens: Record<string, unknown>[] = [];

    (rawTokens as Record<string, unknown>[]).forEach((token) => {
      const assetId = token.assetId as string;
      const apiBlockchain = BLOCKCHAIN_ALIASES[token.blockchain as string] || token.blockchain || 'near';

      if (assetId.startsWith('nep141:')) {
        nearTokens.push({ ...token, blockchain: 'near' });

        // Create native-chain representations for cross-chain tokens
        if (assetId.includes('.omft.near') || assetId.includes('.omdep.near')) {
          const match = assetId.match(/^nep141:([a-z]+)[-\.]/);
          if (match) {
            const targetBlockchain = CHAIN_PREFIX_MAP[match[1]];
            if (targetBlockchain) {
              const isNativeToken = assetId.match(/^nep141:[a-z]+\.omft\.near$/);
              let nativeAssetId: string, contractAddress: string;

              if (isNativeToken) {
                const entry = NATIVE_TOKEN_MAP[targetBlockchain];
                if (!entry) return;
                [nativeAssetId, contractAddress] = entry;
              } else if (token.contractAddress) {
                nativeAssetId = token.contractAddress as string;
                contractAddress = token.contractAddress as string;
              } else {
                return;
              }

              nativeChainTokens.push({
                ...token,
                assetId: nativeAssetId,
                defuseAssetId: assetId,
                blockchain: targetBlockchain,
                contractAddress,
                address: contractAddress,
              });
            }
          }
        }
      } else if (assetId.startsWith('nep245:')) {
        // HOT protocol tokens (BSC, Polygon, Optimism, Avalanche, TON, Stellar, Monad, Plasma, XLayer)
        // These already have blockchain set by the API
        nativeChainTokens.push({ ...token, blockchain: apiBlockchain, defuseAssetId: assetId });
      } else if (assetId.startsWith('1cs_v1:')) {
        const match = assetId.match(/^1cs_v1:([^:]+):/);
        if (match) {
          nativeChainTokens.push({
            ...token,
            blockchain: BLOCKCHAIN_ALIASES[match[1]] || match[1],
            defuseAssetId: assetId,
          });
        }
      } else {
        nativeChainTokens.push({ ...token, blockchain: apiBlockchain });
      }
    });

    const allTokens = [...nearTokens, ...nativeChainTokens];
    applyIconsToAllTokens(allTokens);

    // Enrich priority tokens with DexScreener pricing
    const prioritySymbols = new Set(['USDT', 'USDC', 'ETH', 'BTC', 'WBTC', 'SOL', 'SUI', 'ARB', 'OP', 'BNB', 'AVAX', 'MATIC']);
    const priorityTokens = nativeChainTokens
      .filter(t =>
        t.contractAddress && t.contractAddress !== 'native' &&
        prioritySymbols.has(t.symbol as string)
      )
      .slice(0, 15);

    if (priorityTokens.length > 0) {
      try { await enrichTokensWithPricing(priorityTokens); } catch { /* skip */ }
    }

    // Background enrichment for remaining tokens (non-blocking)
    const remainingTokens = nativeChainTokens
      .filter(t => t.contractAddress && t.contractAddress !== 'native' && !priorityTokens.includes(t))
      .slice(0, 40);
    if (remainingTokens.length > 0) {
      enrichTokensWithPricing(remainingTokens).catch(() => {});
    }

    return NextResponse.json(allTokens, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch tokens', message }, { status: 500 });
  }
}
