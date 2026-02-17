import { NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import { enrichTokenData } from '@/lib/server/dexscreener';
import tokenIcons from '@/data/token-icons.json';

function applyIconsToAllTokens(tokens: Record<string, unknown>[]): void {
  for (const token of tokens) {
    const normalizedSymbol = (token.symbol as string).replace(/\.(omft|omdep)$/i, '');
    const iconUrl = (tokenIcons as Record<string, string>)[normalizedSymbol];
    if (iconUrl) token.icon = iconUrl;
  }
}

async function enrichTokensWithPricing(tokens: Record<string, unknown>[]): Promise<void> {
  for (const token of tokens) {
    try {
      const priceData = await enrichTokenData(
        token.blockchain as string, token.contractAddress as string, token.symbol as string
      );
      if (priceData.priceUsd) {
        token.priceUsd = priceData.priceUsd;
        token.priceChange24h = priceData.priceChange24h;
      }
    } catch { /* skip */ }
  }
}

export async function GET() {
  try {
    const rawTokens = await oneclick.getTokens();

    const blockchainMapping: Record<string, string> = {
      'sol': 'solana', 'pol': 'polygon', 'op': 'optimism',
    };

    const nearTokens: Record<string, unknown>[] = [];
    const nativeChainTokens: Record<string, unknown>[] = [];

    (rawTokens as Record<string, unknown>[]).forEach((token) => {
      const apiBlockchain = blockchainMapping[token.blockchain as string] || token.blockchain || 'near';
      const assetId = token.assetId as string;

      if (assetId.startsWith('nep141:')) {
        nearTokens.push({ ...token, blockchain: 'near' });

        if (assetId.includes('.omft.near') || assetId.includes('.omdep.near')) {
          const match = assetId.match(/^nep141:([a-z]+)[-\.]/);
          if (match) {
            const chainPrefixMapping: Record<string, string> = {
              'eth': 'ethereum', 'base': 'base', 'arb': 'arbitrum',
              'bera': 'berachain', 'sol': 'solana', 'sui': 'sui',
            };
            const targetBlockchain = chainPrefixMapping[match[1]];
            if (targetBlockchain) {
              const isNativeToken = assetId.match(/^nep141:[a-z]+\.omft\.near$/);
              let nativeAssetId: string, contractAddress: string;

              if (isNativeToken) {
                const nativeMap: Record<string, [string, string]> = {
                  'ethereum': ['native', '0x0000000000000000000000000000000000000000'],
                  'solana': ['So11111111111111111111111111111111111111112', 'So11111111111111111111111111111111111111112'],
                  'sui': ['0x2::sui::SUI', '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'],
                  'berachain': ['native', '0x0000000000000000000000000000000000000000'],
                  'base': ['native', '0x0000000000000000000000000000000000000000'],
                  'arbitrum': ['native', '0x0000000000000000000000000000000000000000'],
                };
                const entry = nativeMap[targetBlockchain];
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
      } else if (assetId.startsWith('1cs_v1:')) {
        const match = assetId.match(/^1cs_v1:([^:]+):/);
        if (match) {
          nativeChainTokens.push({ ...token, blockchain: blockchainMapping[match[1]] || match[1] });
        }
      } else if (assetId.startsWith('sui:')) {
        nativeChainTokens.push({ ...token, blockchain: 'sui' });
      } else if (assetId.startsWith('solana:')) {
        nativeChainTokens.push({ ...token, blockchain: 'solana' });
      } else {
        nativeChainTokens.push({ ...token, blockchain: apiBlockchain });
      }
    });

    const allTokens = [...nearTokens, ...nativeChainTokens];
    applyIconsToAllTokens(allTokens);

    // Enrich priority tokens synchronously
    const priorityTokens = nativeChainTokens
      .filter(t =>
        t.contractAddress && t.contractAddress !== 'native' &&
        ['USDT', 'USDC', 'ETH', 'BTC', 'WBTC', 'SOL', 'SUI', 'ARB', 'OP', 'BNB'].includes(t.symbol as string)
      )
      .slice(0, 10);

    if (priorityTokens.length > 0) {
      try { await enrichTokensWithPricing(priorityTokens); } catch { /* skip */ }
    }

    // Background enrichment (non-blocking)
    const remainingTokens = nativeChainTokens
      .filter(t => t.contractAddress && t.contractAddress !== 'native' && !priorityTokens.includes(t))
      .slice(0, 40);
    if (remainingTokens.length > 0) {
      enrichTokensWithPricing(remainingTokens).catch(() => {});
    }

    return NextResponse.json(allTokens);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch tokens', message }, { status: 500 });
  }
}
