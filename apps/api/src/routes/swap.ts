import { Router } from 'express';
import * as oneclick from '../services/oneclick';
import * as fees from '../services/fees';
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
      swapType: swapType ?? 'EXACT_INPUT',
      slippageTolerance: slippageTolerance ?? 100, // 1% default
      deadline: deadline ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min default
      depositType: 'ORIGIN_CHAIN' as const,
      recipientType: 'DESTINATION_CHAIN' as const,
      refundType: 'ORIGIN_CHAIN' as const,
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
router.post('/deposit/submit', async (req, res) => {
  try {
    const { txHash } = req.body;
    if (!txHash) {
      return res.status(400).json({ error: 'txHash is required' });
    }

    const result = await oneclick.submitDeposit(txHash);
    res.json(result);
  } catch (error: any) {
    console.error('Deposit submission error:', error);
    res.status(500).json({
      error: 'Failed to submit deposit',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/status/:depositAddress - Check swap status
router.get('/status/:depositAddress', async (req, res) => {
  try {
    const { depositAddress } = req.params;
    const status = await oneclick.getStatus(depositAddress);
    
    // TODO: Update transaction status in database
    
    res.json(status);
  } catch (error: any) {
    console.error('Status fetch error:', error);
    
    // Handle 404 case specially
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      return res.status(404).json({
        error: 'Swap not found',
        message: 'No swap found for this deposit address',
        depositAddress: depositAddress
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch status',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
