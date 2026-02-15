import { Router } from 'express';
import * as oneclick from '../services/oneclick';
import * as fees from '../services/fees';
import { intentsExplorer } from '../services/intentsExplorer';
import { QuoteRequest } from '@defuse-protocol/one-click-sdk-typescript';
import { validateQuoteRequest } from '../middleware/validation';

const router = Router();

// GET /api/tokens - Get supported tokens
router.get('/tokens', async (req, res) => {
  try {
    // TODO: Implement Redis caching
    const tokens = await oneclick.getTokens();
    res.json(tokens);
  } catch (error: any) {
    console.error('Failed to fetch tokens:', error);
    res.status(500).json({
      error: 'Failed to fetch tokens',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

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

    // Calculate fees
    // For now, we use the default fee. In the future, we can estimate USD value for tiered pricing.
    const feeBps = fees.calculateFeeBps();
    const feeRecipient = fees.getFeeRecipient();

    const quoteRequest: QuoteRequest = {
      dry: dry ?? true,
      originAsset,
      destinationAsset,
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
