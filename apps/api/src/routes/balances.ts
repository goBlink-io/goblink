import { Router, Request, Response } from 'express';
import { providers } from 'near-api-js';

const router = Router();

// NEAR RPC endpoint - using FastNEAR as the old endpoint is deprecated
const NEAR_RPC_URL = process.env.NEAR_RPC_URL || 'https://rpc.fastnear.com';

/**
 * GET /api/balances/near/:accountId
 * Get native NEAR balance for an account
 */
router.get('/near/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    const provider = new providers.JsonRpcProvider({ url: NEAR_RPC_URL });
    
    const account = await provider.query({
      request_type: 'view_account',
      finality: 'final',
      account_id: accountId,
    }) as any;
    
    // Convert yoctoNEAR to NEAR
    const balanceInYocto = account.amount;
    const balanceInNear = (Number(balanceInYocto) / 1e24).toFixed(4);
    
    res.json({ 
      balance: balanceInNear,
      balanceYocto: balanceInYocto,
      accountId 
    });
  } catch (error: any) {
    console.error('Failed to fetch NEAR balance:', error);
    res.status(500).json({ 
      error: 'Failed to fetch balance',
      message: error.message 
    });
  }
});

/**
 * GET /api/balances/near-token/:accountId
 * Get NEAR FT token balance
 * Query params: contractAddress, decimals
 */
router.get('/near-token/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const { contractAddress, decimals } = req.query;
    
    if (!accountId || !contractAddress || !decimals) {
      return res.status(400).json({ 
        error: 'Account ID, contract address, and decimals are required' 
      });
    }

    const provider = new providers.JsonRpcProvider({ url: NEAR_RPC_URL });
    
    // Call ft_balance_of on the token contract
    const result = await provider.query({
      request_type: 'call_function',
      finality: 'final',
      account_id: contractAddress as string,
      method_name: 'ft_balance_of',
      args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
    }) as any;
    
    // Parse the result
    const balanceString = Buffer.from(result.result).toString();
    const balance = JSON.parse(balanceString);
    
    // Convert to human readable format
    const decimalsNum = parseInt(decimals as string);
    const balanceInTokens = (Number(balance) / Math.pow(10, decimalsNum)).toFixed(4);
    
    res.json({ 
      balance: balanceInTokens,
      balanceRaw: balance,
      accountId,
      contractAddress 
    });
  } catch (error: any) {
    console.error('Failed to fetch NEAR token balance:', error);
    res.status(500).json({ 
      error: 'Failed to fetch token balance',
      message: error.message 
    });
  }
});

export default router;
