import { Router } from 'express';
import * as oneclick from '../services/oneclick';
import * as fees from '../services/fees';
import { intentsExplorer } from '../services/intentsExplorer';
import { QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import { validateQuoteRequest } from '../middleware/validation';
import * as dexscreener from '../services/dexscreener';
import tokenIcons from '../data/token-icons.json';

const router = Router();

// Apply icons to ALL tokens (fast dictionary lookup, no API calls)
function applyIconsToAllTokens(tokens: any[]): void {
  for (const token of tokens) {
    const normalizedSymbol = token.symbol.replace(/\.(omft|omdep)$/i, '');
    const iconUrl = (tokenIcons as Record<string, string>)[normalizedSymbol];
    if (iconUrl) {
      token.icon = iconUrl;
    }
  }
}

// Enrich tokens with pricing data (limited subset, API calls)
async function enrichTokensWithPricing(tokens: any[]): Promise<void> {
  console.log(`Starting price enrichment for ${tokens.length} tokens...`);
  
  for (const token of tokens) {
    try {
      const priceData = await dexscreener.enrichTokenData(
        token.blockchain,
        token.contractAddress,
        token.symbol
      );
      
      if (priceData.priceUsd) {
        token.priceUsd = priceData.priceUsd;
        token.priceChange24h = priceData.priceChange24h;
      }
      
      console.log(`Price enriched ${token.symbol} on ${token.blockchain}: $${priceData.priceUsd || 'N/A'}`);
    } catch (error: any) {
      console.error(`Failed to get price for ${token.symbol}:`, error.message);
    }
  }
  
  console.log('Price enrichment complete');
}

// GET /api/tokens - Get supported tokens
router.get('/tokens', async (req, res) => {
  try {
    // TODO: Implement Redis caching
    const rawTokens = await oneclick.getTokens();
    
    // Normalize blockchain names from API to match UI chain IDs
    const blockchainMapping: Record<string, string> = {
      'sol': 'solana',
      'pol': 'polygon',
      'op': 'optimism',
    };
    
    const nearTokens: any[] = [];
    const nativeChainTokens: any[] = [];
    
    rawTokens.forEach((token: any) => {
      // Normalize blockchain name
      const apiBlockchain = blockchainMapping[token.blockchain] || token.blockchain || 'near';
      
      // ALL nep141 tokens are NEAR-wrapped and belong to NEAR blockchain
      if (token.assetId.startsWith('nep141:')) {
        nearTokens.push({
          ...token,
          blockchain: 'near'
        });
        
        // Check if this is a cross-chain wrapped token that should also appear on its native chain
        // Pattern: nep141:CHAIN-ADDRESS or nep141:CHAIN.omft.near
        if (token.assetId.includes('.omft.near') || token.assetId.includes('.omdep.near')) {
          const match = token.assetId.match(/^nep141:([a-z]+)[-\.]/);
          if (match) {
            const chainPrefix = match[1];
            let targetBlockchain: string | null = null;
            
            // Map chain prefixes to blockchain names
            const chainPrefixMapping: Record<string, string> = {
              'eth': 'ethereum',
              'base': 'base',
              'arb': 'arbitrum',
              'bera': 'berachain',
              'sol': 'solana',
              'sui': 'sui',
            };
            
            targetBlockchain = chainPrefixMapping[chainPrefix];
            
            // If this token should appear on a native chain, create a native version
            if (targetBlockchain) {
              // Check if this is a native token (no dash in assetId after chain prefix)
              const isNativeToken = token.assetId.match(/^nep141:[a-z]+\.omft\.near$/);
              
              let nativeAssetId: string;
              let contractAddress: string;
              
              if (isNativeToken) {
                // Native tokens: use special native asset identifiers
                if (targetBlockchain === 'ethereum') {
                  nativeAssetId = 'native'; // Special identifier for ETH
                  contractAddress = '0x0000000000000000000000000000000000000000';
                } else if (targetBlockchain === 'solana') {
                  nativeAssetId = 'So11111111111111111111111111111111111111112'; // SOL mint address
                  contractAddress = 'So11111111111111111111111111111111111111112';
                } else if (targetBlockchain === 'sui') {
                  nativeAssetId = '0x2::sui::SUI'; // SUI coin type
                  contractAddress = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
                } else if (targetBlockchain === 'berachain') {
                  nativeAssetId = 'native'; // Special identifier for BERA
                  contractAddress = '0x0000000000000000000000000000000000000000';
                } else if (targetBlockchain === 'base') {
                  nativeAssetId = 'native'; // Special identifier for native ETH on Base
                  contractAddress = '0x0000000000000000000000000000000000000000';
                } else if (targetBlockchain === 'arbitrum') {
                  nativeAssetId = 'native'; // Special identifier for native ETH on Arbitrum
                  contractAddress = '0x0000000000000000000000000000000000000000';
                } else {
                  // Skip if we don't know how to handle this native token
                  return;
                }
              } else if (token.contractAddress) {
                // Token with contract address (ERC-20, SPL, etc.)
                if (targetBlockchain === 'solana') {
                  nativeAssetId = token.contractAddress;
                } else if (targetBlockchain === 'sui') {
                  nativeAssetId = token.contractAddress;
                } else {
                  // EVM chains use 0x addresses
                  nativeAssetId = token.contractAddress;
                }
                contractAddress = token.contractAddress;
              } else {
                // Skip if no contract address and not a recognized native token
                return;
              }
              
              nativeChainTokens.push({
                ...token,
                assetId: nativeAssetId, // Native address for wallet
                defuseAssetId: token.assetId, // NEP-141 for Intents quote
                blockchain: targetBlockchain,
                contractAddress: contractAddress,
                address: contractAddress
              });
            }
          }
        }
      }
      // Handle 1ClickSwap v1 native format tokens (1cs_v1:CHAIN:...)
      else if (token.assetId.startsWith('1cs_v1:')) {
        const match = token.assetId.match(/^1cs_v1:([^:]+):/);
        if (match) {
          const blockchain = blockchainMapping[match[1]] || match[1];
          nativeChainTokens.push({
            ...token,
            blockchain
          });
        }
      }
      // Handle native Sui tokens (sui:...)
      else if (token.assetId.startsWith('sui:')) {
        nativeChainTokens.push({
          ...token,
          blockchain: 'sui'
        });
      }
      // Handle native Solana tokens (solana:...)
      else if (token.assetId.startsWith('solana:')) {
        nativeChainTokens.push({
          ...token,
          blockchain: 'solana'
        });
      }
      // Default: use API-provided blockchain
      else {
        nativeChainTokens.push({
          ...token,
          blockchain: apiBlockchain
        });
      }
    });
    
    // Combine all tokens
    let allTokens = [...nearTokens, ...nativeChainTokens];
    
    // STEP 1: Apply icons to ALL tokens (fast, no API calls)
    console.log(`Applying icons to all ${allTokens.length} tokens...`);
    applyIconsToAllTokens(allTokens);
    const tokensWithIcons = allTokens.filter(t => t.icon).length;
    console.log(`${tokensWithIcons}/${allTokens.length} tokens now have icons`);
    
    // STEP 2: Enrich top tokens with pricing data synchronously
    // Focus on the most popular tokens for immediate enrichment
    const priorityTokens = nativeChainTokens
      .filter(t =>
        t.contractAddress &&
        t.contractAddress !== 'native' &&
        ['USDT', 'USDC', 'ETH', 'BTC', 'WBTC', 'SOL', 'SUI', 'ARB', 'OP', 'BNB'].includes(t.symbol)
      )
      .slice(0, 10); // Limit to 10 priority tokens
    
    if (priorityTokens.length > 0) {
      console.log(`Enriching ${priorityTokens.length} priority tokens with pricing...`);
      try {
        await enrichTokensWithPricing(priorityTokens);
      } catch (err: any) {
        console.error('Priority token pricing failed:', err);
      }
    }
    
    // STEP 3: Start background pricing enrichment for remaining tokens (non-blocking)
    const remainingTokens = nativeChainTokens
      .filter(t =>
        t.contractAddress &&
        t.contractAddress !== 'native' &&
        !priorityTokens.includes(t)
      )
      .slice(0, 40);
    
    if (remainingTokens.length > 0) {
      enrichTokensWithPricing(remainingTokens).catch((err: any) => {
        console.error('Background pricing enrichment failed:', err);
      });
    }
    
    res.json(allTokens);
  } catch (error: any) {
    console.error('Failed to fetch tokens:', error);
    res.status(500).json({
      error: 'Failed to fetch tokens',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Mapping of native chain asset IDs to their NEP-141 equivalents for 1Click quotes
const NATIVE_TO_NEP141_MAP: Record<string, string> = {
  'sui:0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI': 'nep141:sui.omft.near',
  'solana:native': 'nep141:sol.omft.near',
};

// POST /api/quote - Request a swap quote
router.post('/quote', validateQuoteRequest, async (req, res) => {
  try {
    const {
      dry,
      originAsset,
      destinationAsset,
      amount,
      recipient,
      refundTo,
      swapType,
      slippageTolerance,
      deadline
    } = req.body;

    // Translate native chain asset IDs to NEP-141 equivalents for 1Click API
    const resolvedOriginAsset = NATIVE_TO_NEP141_MAP[originAsset] || originAsset;
    const resolvedDestinationAsset = NATIVE_TO_NEP141_MAP[destinationAsset] || destinationAsset;

    console.log('Quote request - originAsset:', originAsset, '-> resolved:', resolvedOriginAsset);
    console.log('Quote request - destinationAsset:', destinationAsset, '-> resolved:', resolvedDestinationAsset);

    // Calculate fees
    // For now, we use the default fee. In the future, we can estimate USD value for tiered pricing.
    const feeBps = fees.calculateFeeBps();
    const feeRecipient = fees.getFeeRecipient();

    const quoteRequest: QuoteRequest = {
      dry: dry ?? true,
      originAsset: resolvedOriginAsset,
      destinationAsset: resolvedDestinationAsset,
      amount,
      recipient,
      refundTo,
      swapType: swapType ?? QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: slippageTolerance ?? 100, // 1% default
      deadline: deadline ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min default
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
      recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
      refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
      appFees: [
        {
          recipient: feeRecipient,
          fee: feeBps
        }
      ]
    };

    const quote = await oneclick.getQuote(quoteRequest);
    
    // TODO: Store transaction in database if dry is false
    
    res.json(quote);
  } catch (error: any) {
    console.error('Quote error:', error);
    
    // Enhanced error handling with specific messages
    let statusCode = 500;
    let errorMessage = 'Failed to get quote';
    let details = error.message;

    // Check for specific error types
    if (error.message?.includes('refundTo') || error.message?.includes('recipient')) {
      statusCode = 400;
      errorMessage = 'Invalid address format';
      details = error.message;
    } else if (error.message?.includes('amount')) {
      statusCode = 400;
      errorMessage = 'Invalid amount';
      details = error.message;
    } else if (error.message?.includes('asset')) {
      statusCode = 400;
      errorMessage = 'Invalid asset selection';
      details = error.message;
    } else if (error.message?.includes('timeout') || error.message?.includes('network')) {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable';
      details = 'Unable to reach swap service. Please try again.';
    }

    res.status(statusCode).json({
      error: errorMessage,
      message: details,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/deposit/submit - Submit deposit tx hash
// Note: This endpoint is optional since we're tracking via Intents Explorer API
router.post('/deposit/submit', async (req, res) => {
  try {
    const { txHash } = req.body;
    if (!txHash) {
      return res.status(400).json({ error: 'txHash is required' });
    }

    // Try to submit to 1Click SDK if the method exists
    try {
      const result = await oneclick.submitDeposit(txHash);
      res.json(result);
    } catch (sdkError: any) {
      // If submitDeposit doesn't exist or fails, that's OK
      // Transaction tracking works via Intents Explorer API
      console.log('Note: submitDeposit not available in SDK, using Intents Explorer for tracking');
      res.json({
        success: true,
        message: 'Transaction will be tracked via Intents Explorer',
        txHash
      });
    }
  } catch (error: any) {
    console.error('Deposit submission error:', error);
    // Don't fail - return success since tracking works via Intents Explorer
    res.json({
      success: true,
      message: 'Transaction will be tracked via Intents Explorer',
      txHash: req.body.txHash
    });
  }
});

// GET /api/status/:depositAddress - Check swap status
router.get('/status/:depositAddress', async (req, res) => {
  try {
    const { depositAddress } = req.params;
    
    // Try to fetch status from Intents Explorer API
    if (intentsExplorer.isConfigured()) {
      try {
        const transaction = await intentsExplorer.getTransactionByDepositAddress(depositAddress);
        
        if (transaction) {
          // TODO: Update transaction status in database
          
          // Return the transaction details
          return res.json({
            depositAddress: transaction.depositAddress,
            status: transaction.status,
            originAsset: transaction.originAsset,
            destinationAsset: transaction.destinationAsset,
            amountIn: transaction.amountIn,
            amountOut: transaction.amountOut,
            recipient: transaction.recipient,
            refundTo: transaction.refundTo,
            depositTxHash: transaction.depositTxHash,
            fulfillmentTxHash: transaction.fulfillmentTxHash,
            refundTxHash: transaction.refundTxHash,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            referral: transaction.referral,
            affiliate: transaction.affiliate
          });
        }
        
        // Transaction not found in Intents Explorer
        return res.status(404).json({
          error: 'Swap not found',
          message: 'No swap found for this deposit address',
          depositAddress: depositAddress
        });
      } catch (explorerError: any) {
        console.error('Intents Explorer fetch error:', explorerError.message);
        
        // If it's a rate limit or API error, return 404 so client will retry gracefully
        // Client handles 404s silently without showing errors to users
        if (explorerError.message?.includes('429') || explorerError.message?.includes('rate limit')) {
          return res.status(404).json({
            error: 'Transaction not yet available',
            message: 'Please wait, checking transaction status...',
            depositAddress
          });
        }
        
        // For other errors, let them bubble up to be caught by outer try-catch
        throw explorerError;
      }
    } else {
      // Intents Explorer not configured
      console.warn('Intents Explorer JWT not configured. Unable to track transaction status.');
      return res.status(503).json({
        error: 'Transaction tracking not available',
        message: 'Transaction tracking service is not configured. Please contact support.',
        details: process.env.NODE_ENV === 'development'
          ? 'INTENTS_EXPLORER_JWT environment variable not set'
          : undefined
      });
    }
  } catch (error: any) {
    console.error('Status fetch error:', error);
    
    res.status(500).json({
      error: 'Failed to fetch status',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
