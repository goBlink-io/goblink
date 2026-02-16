import { Router, Request, Response } from 'express';
import { providers } from 'near-api-js';
import axios from 'axios';
import { getSuiBalance, getSuiAccountTokens, getSuiAccountCoins } from '../services/sui';

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

    // Validate NEAR contract address format
    // Skip if it's an address from another blockchain
    const contractAddr = contractAddress as string;
    
    // Check for non-NEAR addresses
    if (
      contractAddr.startsWith('0x') || // Ethereum/EVM
      contractAddr.includes('::') || // Sui
      /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contractAddr) // Likely Solana base58
    ) {
      console.log(`Skipping non-NEAR contract address: ${contractAddr}`);
      return res.json({
        balance: '0.00',
        balanceRaw: '0',
        accountId,
        contractAddress: contractAddr
      });
    }
    
    // NEAR contract addresses should either:
    // 1. End with .near or .testnet (named accounts)
    // 2. Be a 64-character hex string (implicit accounts)
    const isValidNearAddress =
      contractAddr.endsWith('.near') ||
      contractAddr.endsWith('.testnet') ||
      /^[a-f0-9]{64}$/.test(contractAddr);
    
    if (!isValidNearAddress) {
      console.log(`Invalid NEAR contract address format: ${contractAddr}`);
      return res.json({
        balance: '0.00',
        balanceRaw: '0',
        accountId,
        contractAddress: contractAddr
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

/**
 * GET /api/balances/sui/:address
 * Get native SUI balance for an address
 */
router.get('/sui/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    console.log('[SUI] Fetching balance for address:', address);
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const result = await getSuiBalance(address);
    
    console.log('[SUI] Balance result:', result);
    
    res.json(result);
  } catch (error: any) {
    console.error('[SUI] Failed to fetch SUI balance:', error);
    res.status(500).json({
      error: 'Failed to fetch SUI balance',
      message: error.message,
      details: error.response?.data || error.toString()
    });
  }
});

/**
 * GET /api/balances/sui-tokens/:address
 * Get all tokens/coins for a Sui address
 * Returns all coins with metadata from Blockvision
 */
router.get('/sui-tokens/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    console.log('[SUI-TOKENS] Fetching tokens for address:', address);
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const tokens = await getSuiAccountTokens(address);
    
    console.log('[SUI-TOKENS] Found', tokens.length, 'tokens');
    
    res.json({
      address,
      tokens,
      count: tokens.length
    });
  } catch (error: any) {
    console.error('[SUI-TOKENS] Failed to fetch Sui tokens:', error);
    res.status(500).json({
      error: 'Failed to fetch Sui tokens',
      message: error.message,
      details: error.response?.data || error.toString()
    });
  }
});

/**
 * GET /api/balances/sui-coins/:address
 * Get all coin objects for a Sui address from Blockvision API
 * Returns full Blockvision response with all coin metadata
 */
router.get('/sui-coins/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    console.log('[SUI-COINS] Fetching coins for address:', address);
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const result = await getSuiAccountCoins(address);
    
    console.log('[SUI-COINS] Retrieved data:', result.result.coins.length, 'coins');
    
    res.json({
      address,
      ...result
    });
  } catch (error: any) {
    console.error('[SUI-COINS] Failed to fetch Sui coins:', error);
    res.status(500).json({
      error: 'Failed to fetch Sui coins',
      message: error.message,
      details: error.response?.data || error.toString()
    });
  }
});

/**
 * GET /api/balances/sui-token/:address
 * Get balance for a specific Sui token by coin type
 * Query parameter: coinType (full coin type address)
 */
router.get('/sui-token/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { coinType } = req.query;
    
    console.log('[SUI-TOKEN] Fetching token balance:', { address, coinType });
    
    if (!address || !coinType) {
      return res.status(400).json({
        error: 'Address and coinType query parameter are required'
      });
    }

    const { getSuiTokenBalance } = require('../services/sui');
    const result = await getSuiTokenBalance(address, coinType as string);
    
    console.log('[SUI-TOKEN] Balance result:', result);
    
    res.json(result);
  } catch (error: any) {
    console.error('[SUI-TOKEN] Failed to fetch Sui token balance:', error);
    res.status(500).json({
      error: 'Failed to fetch Sui token balance',
      message: error.message,
      details: error.response?.data || error.toString()
    });
  }
});

/**
 * GET /api/balances/solana/:address
 * Get native SOL balance for a Solana address
 */
router.get('/solana/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    const response = await axios.post(SOLANA_RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address],
    });

    const lamports = response.data?.result?.value || 0;
    const balanceInSol = (lamports / 1e9).toFixed(4);

    res.json({
      balance: balanceInSol,
      balanceLamports: lamports.toString(),
      address,
    });
  } catch (error: any) {
    console.error('[SOL] Failed to fetch SOL balance:', error);
    res.status(500).json({
      error: 'Failed to fetch SOL balance',
      message: error.message,
    });
  }
});

/**
 * GET /api/balances/solana/blockhash/latest
 * Proxy endpoint to get Solana latest blockhash (avoids browser CORS/403 issues)
 */
router.get('/solana-blockhash', async (_req: Request, res: Response) => {
  try {
    const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    const response = await axios.post(SOLANA_RPC_URL, {
      jsonrpc: '2.0',
      id: 1,
      method: 'getLatestBlockhash',
      params: [{ commitment: 'confirmed' }],
    });

    const blockhash = response.data?.result?.value?.blockhash;
    const lastValidBlockHeight = response.data?.result?.value?.lastValidBlockHeight;

    if (!blockhash) {
      throw new Error('No blockhash returned from Solana RPC');
    }

    res.json({ blockhash, lastValidBlockHeight });
  } catch (error: any) {
    console.error('[SOL] Failed to fetch blockhash:', error.message);
    res.status(500).json({
      error: 'Failed to fetch Solana blockhash',
      message: error.message,
    });
  }
});

/**
 * POST /api/solana-rpc
 * General Solana JSON-RPC proxy for wallet providers that can't reach Solana public RPC from browser
 */
router.post('/solana-rpc', async (req: Request, res: Response) => {
  try {
    const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    const response = await axios.post(SOLANA_RPC_URL, req.body, {
      headers: { 'Content-Type': 'application/json' },
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('[SOL RPC Proxy] Error:', error.message);
    res.status(500).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: error.message },
      id: req.body?.id || null,
    });
  }
});

export default router;
