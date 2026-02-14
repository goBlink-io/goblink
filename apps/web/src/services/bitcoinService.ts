/**
 * Bitcoin Transaction Service
 * Handles UTXO management, PSBT building, and transaction execution for Bitcoin blockchain
 */

import { signTransaction, SignTransactionOptions, request } from 'sats-connect';

/**
 * Bitcoin uses UTXO (Unspent Transaction Output) model
 * PSBT (Partially Signed Bitcoin Transaction) for signing
 */

// Bitcoin API endpoints (using Blockstream for mainnet/testnet)
const BITCOIN_API_MAINNET = 'https://blockstream.info/api';
const BITCOIN_API_TESTNET = 'https://blockstream.info/testnet/api';

export interface UTXO {
  txid: string;
  vout: number;
  value: number; // In satoshis
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

export interface BitcoinBalance {
  confirmed: number; // In satoshis
  unconfirmed: number; // In satoshis
  total: number; // In satoshis
}

export interface TransactionResult {
  success: boolean;
  txid: string;
  error?: string;
}

export interface FeeEstimate {
  fastestFee: number; // sat/vB
  halfHourFee: number; // sat/vB
  hourFee: number; // sat/vB
  economyFee: number; // sat/vB
  minimumFee: number; // sat/vB
}

/**
 * Get Bitcoin API endpoint based on network
 */
function getApiEndpoint(isTestnet: boolean = false): string {
  return isTestnet ? BITCOIN_API_TESTNET : BITCOIN_API_MAINNET;
}

/**
 * Get UTXOs for a Bitcoin address
 */
export async function getUTXOs(address: string, isTestnet: boolean = false): Promise<UTXO[]> {
  try {
    const apiEndpoint = getApiEndpoint(isTestnet);
    const response = await fetch(`${apiEndpoint}/address/${address}/utxo`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch UTXOs');
    }
    
    const utxos: UTXO[] = await response.json();
    return utxos;
  } catch (error) {
    console.error('Failed to fetch UTXOs:', error);
    throw new Error('Failed to fetch UTXOs');
  }
}

/**
 * Get Bitcoin balance for an address
 */
export async function getBitcoinBalance(address: string, isTestnet: boolean = false): Promise<BitcoinBalance> {
  try {
    const apiEndpoint = getApiEndpoint(isTestnet);
    const response = await fetch(`${apiEndpoint}/address/${address}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }
    
    const data = await response.json();
    
    // Get confirmed balance from chain stats
    const confirmed = data.chain_stats?.funded_txo_sum || 0;
    const spent = data.chain_stats?.spent_txo_sum || 0;
    const confirmedBalance = confirmed - spent;
    
    // Get unconfirmed balance from mempool stats
    const mempoolFunded = data.mempool_stats?.funded_txo_sum || 0;
    const mempoolSpent = data.mempool_stats?.spent_txo_sum || 0;
    const unconfirmedBalance = mempoolFunded - mempoolSpent;
    
    return {
      confirmed: confirmedBalance,
      unconfirmed: unconfirmedBalance,
      total: confirmedBalance + unconfirmedBalance,
    };
  } catch (error) {
    console.error('Failed to fetch Bitcoin balance:', error);
    throw new Error('Failed to fetch Bitcoin balance');
  }
}

/**
 * Get fee estimates from mempool
 */
export async function getFeeEstimates(isTestnet: boolean = false): Promise<FeeEstimate> {
  try {
    const apiEndpoint = getApiEndpoint(isTestnet);
    const response = await fetch(`${apiEndpoint}/fee-estimates`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch fee estimates');
    }
    
    const feeData = await response.json();
    
    // Parse fee estimates (returned as { "1": X, "2": Y, ... } where key is number of blocks)
    return {
      fastestFee: Math.ceil(parseFloat(feeData['1'] || feeData['2'] || '20')),
      halfHourFee: Math.ceil(parseFloat(feeData['3'] || feeData['4'] || '15')),
      hourFee: Math.ceil(parseFloat(feeData['6'] || feeData['7'] || '10')),
      economyFee: Math.ceil(parseFloat(feeData['144'] || '5')),
      minimumFee: 1, // 1 sat/vB minimum
    };
  } catch (error) {
    console.error('Failed to fetch fee estimates:', error);
    // Return default estimates if API fails
    return {
      fastestFee: 20,
      halfHourFee: 15,
      hourFee: 10,
      economyFee: 5,
      minimumFee: 1,
    };
  }
}

/**
 * Estimate transaction size in vBytes
 * This is a simplified estimation
 */
export function estimateTransactionSize(inputCount: number, outputCount: number): number {
  // Rough estimation:
  // - Base size: 10 bytes
  // - Each input: ~148 bytes (for P2WPKH)
  // - Each output: ~34 bytes
  const baseSize = 10;
  const inputSize = inputCount * 148;
  const outputSize = outputCount * 34;
  
  return baseSize + inputSize + outputSize;
}

/**
 * Calculate transaction fee
 */
export function calculateFee(inputCount: number, outputCount: number, feeRate: number): number {
  const txSize = estimateTransactionSize(inputCount, outputCount);
  return Math.ceil(txSize * feeRate);
}

/**
 * Select UTXOs for transaction (coin selection)
 * Uses a simple greedy algorithm
 */
export function selectUTXOs(
  utxos: UTXO[],
  targetAmount: number,
  feeRate: number
): { selectedUTXOs: UTXO[]; fee: number; change: number } | null {
  // Sort UTXOs by value (descending) for greedy selection
  const sortedUTXOs = [...utxos]
    .filter(utxo => utxo.status.confirmed) // Only use confirmed UTXOs
    .sort((a, b) => b.value - a.value);
  
  if (sortedUTXOs.length === 0) {
    return null;
  }
  
  const selectedUTXOs: UTXO[] = [];
  let totalInput = 0;
  
  // Keep adding UTXOs until we have enough to cover target + fee
  for (const utxo of sortedUTXOs) {
    selectedUTXOs.push(utxo);
    totalInput += utxo.value;
    
    // Estimate fee with current input count (1 output initially, 2 if change needed)
    const estimatedFee = calculateFee(selectedUTXOs.length, 2, feeRate);
    const totalNeeded = targetAmount + estimatedFee;
    
    if (totalInput >= totalNeeded) {
      const change = totalInput - totalNeeded;
      
      // If change is too small (dust), add it to fee
      if (change < 546) { // 546 sats is dust limit
        return {
          selectedUTXOs,
          fee: estimatedFee + change,
          change: 0,
        };
      }
      
      return {
        selectedUTXOs,
        fee: estimatedFee,
        change,
      };
    }
  }
  
  // Not enough UTXOs to cover amount + fee
  return null;
}

/**
 * Build a simple Bitcoin transaction (PSBT hex)
 * This creates a PSBT that can be signed by the wallet
 * 
 * Note: This is a simplified version. In production, use a proper Bitcoin library like bitcoinjs-lib
 */
export async function buildTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number, // In satoshis
  feeRate: number, // sat/vB
  isTestnet: boolean = false
): Promise<{ psbtHex: string; fee: number; inputCount: number } | null> {
  try {
    // Get UTXOs for the sender
    const utxos = await getUTXOs(fromAddress, isTestnet);
    
    if (utxos.length === 0) {
      throw new Error('No UTXOs available');
    }
    
    // Select UTXOs for this transaction
    const selection = selectUTXOs(utxos, amount, feeRate);
    
    if (!selection) {
      throw new Error('Insufficient funds to cover amount and fee');
    }
    
    // Note: Building a proper PSBT hex requires bitcoinjs-lib or similar
    // For now, we return a structure that indicates what needs to be built
    // The actual PSBT building would be done by the wallet or a proper library
    
    console.warn('PSBT building requires bitcoinjs-lib or similar library');
    console.log('Transaction details:', {
      inputs: selection.selectedUTXOs.length,
      outputs: selection.change > 0 ? 2 : 1,
      fee: selection.fee,
      change: selection.change,
    });
    
    // Placeholder - in production, use bitcoinjs-lib to build proper PSBT
    return {
      psbtHex: '', // Would contain actual PSBT hex
      fee: selection.fee,
      inputCount: selection.selectedUTXOs.length,
    };
  } catch (error) {
    console.error('Failed to build transaction:', error);
    return null;
  }
}

/**
 * Send Bitcoin transaction using wallet's PSBT signing
 */
export async function sendBitcoin(
  fromAddress: string,
  toAddress: string,
  amount: number, // In satoshis
  feeRate: number, // sat/vB
  isTestnet: boolean = false
): Promise<TransactionResult> {
  try {
    if (!isValidBitcoinAddress(toAddress)) {
      return { success: false, txid: '', error: 'Invalid recipient address' };
    }
    
    // Build transaction
    const txData = await buildTransaction(fromAddress, toAddress, amount, feeRate, isTestnet);
    
    if (!txData || !txData.psbtHex) {
      return { success: false, txid: '', error: 'Failed to build transaction' };
    }
    
    // Note: Actual PSBT signing requires proper integration with sats-connect
    // This is a placeholder showing the intended flow
    
    return {
      success: false,
      txid: '',
      error: 'PSBT signing not fully implemented - requires bitcoinjs-lib integration'
    };
    
  } catch (error: any) {
    console.error('Failed to send Bitcoin:', error);
    return {
      success: false,
      txid: '',
      error: error?.message || 'Failed to send Bitcoin',
    };
  }
}

/**
 * Broadcast a signed transaction to the network
 */
export async function broadcastTransaction(
  txHex: string,
  isTestnet: boolean = false
): Promise<string> {
  try {
    const apiEndpoint = getApiEndpoint(isTestnet);
    const response = await fetch(`${apiEndpoint}/tx`, {
      method: 'POST',
      body: txHex,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to broadcast transaction: ${error}`);
    }
    
    const txid = await response.text();
    return txid;
  } catch (error) {
    console.error('Failed to broadcast transaction:', error);
    throw new Error('Failed to broadcast transaction');
  }
}

/**
 * Get transaction details
 */
export async function getTransaction(txid: string, isTestnet: boolean = false) {
  try {
    const apiEndpoint = getApiEndpoint(isTestnet);
    const response = await fetch(`${apiEndpoint}/tx/${txid}`);
    
    if (!response.ok) {
      throw new Error('Transaction not found');
    }
    
    const tx = await response.json();
    return tx;
  } catch (error) {
    console.error('Failed to fetch transaction:', error);
    throw new Error('Failed to fetch transaction');
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForConfirmation(
  txid: string,
  isTestnet: boolean = false,
  timeoutMs: number = 300000 // 5 minutes
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const tx = await getTransaction(txid, isTestnet);
      
      if (tx.status && tx.status.confirmed) {
        return true;
      }
    } catch (error) {
      // Transaction might not be in mempool yet
    }
    
    // Wait 10 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  return false;
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(txid: string, isTestnet: boolean = false) {
  try {
    const tx = await getTransaction(txid, isTestnet);
    
    return {
      txid,
      confirmed: tx.status?.confirmed || false,
      blockHeight: tx.status?.block_height,
      blockHash: tx.status?.block_hash,
      blockTime: tx.status?.block_time,
      fee: tx.fee,
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    return {
      txid,
      confirmed: false,
      error: 'Failed to get transaction status',
    };
  }
}

/**
 * Validate Bitcoin address
 */
export function isValidBitcoinAddress(address: string): boolean {
  // Basic validation for Bitcoin addresses
  // Legacy (P2PKH): starts with 1
  // Script (P2SH): starts with 3
  // Bech32 (SegWit): starts with bc1
  // Testnet: starts with m, n, 2, or tb1
  
  const mainnetRegex = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
  const testnetRegex = /^(m|n|2|tb1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
  
  return mainnetRegex.test(address) || testnetRegex.test(address);
}

/**
 * Convert BTC to satoshis
 */
export function btcToSatoshis(btc: number | string): number {
  const btcNum = typeof btc === 'string' ? parseFloat(btc) : btc;
  return Math.round(btcNum * 100_000_000);
}

/**
 * Convert satoshis to BTC
 */
export function satoshisToBTC(satoshis: number): string {
  return (satoshis / 100_000_000).toFixed(8);
}

/**
 * Format satoshis to human-readable BTC
 */
export function formatBTC(satoshis: number, decimals: number = 8): string {
  const btc = satoshis / 100_000_000;
  return btc.toFixed(decimals);
}

/**
 * Parse BTC amount to satoshis
 */
export function parseBTC(btc: string): number {
  try {
    const parsed = parseFloat(btc);
    if (isNaN(parsed) || parsed < 0) {
      throw new Error('Invalid amount');
    }
    return btcToSatoshis(parsed);
  } catch (error) {
    console.error('Failed to parse BTC amount:', error);
    throw new Error('Invalid BTC amount format');
  }
}

/**
 * Check if address has sufficient balance
 */
export async function hasSufficientBalance(
  address: string,
  amount: number, // In satoshis
  isTestnet: boolean = false
): Promise<boolean> {
  try {
    const balance = await getBitcoinBalance(address, isTestnet);
    return balance.confirmed >= amount;
  } catch (error) {
    console.error('Failed to check balance:', error);
    return false;
  }
}

/**
 * Get recommended fee rate based on priority
 */
export async function getRecommendedFee(
  priority: 'fast' | 'medium' | 'slow' = 'medium',
  isTestnet: boolean = false
): Promise<number> {
  try {
    const fees = await getFeeEstimates(isTestnet);
    
    switch (priority) {
      case 'fast':
        return fees.fastestFee;
      case 'medium':
        return fees.hourFee;
      case 'slow':
        return fees.economyFee;
      default:
        return fees.hourFee;
    }
  } catch (error) {
    console.error('Failed to get recommended fee:', error);
    // Return default based on priority
    return priority === 'fast' ? 20 : priority === 'medium' ? 10 : 5;
  }
}
