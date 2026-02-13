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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tokens' });
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
      depositType: 'ORIGIN_CHAIN',
      recipientType: 'DESTINATION_CHAIN',
      refundType: 'ORIGIN_CHAIN',
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
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({ error: 'Failed to get quote' });
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit deposit' });
  }
});

// GET /api/status/:depositAddress - Check swap status
router.get('/status/:depositAddress', async (req, res) => {
  try {
    const { depositAddress } = req.params;
    const status = await oneclick.getStatus(depositAddress);
    
    // TODO: Update transaction status in database
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
