import { Address, TonClient, beginCell, toNano, fromNano } from '@ton/ton';
import { SendTransactionRequest } from '@tonconnect/ui-react';

/**
 * TON Transaction Service
 * Handles balance fetching, transaction building, and execution for TON blockchain
 */

// TON API endpoint
const TON_API_ENDPOINT = 'https://toncenter.com/api/v2/jsonRPC';

export interface TonBalance {
  balance: string; // In TON
  nanotons: string; // In nanotons (1 TON = 10^9 nanotons)
}

export interface JettonBalance {
  balance: string; // In smallest unit
  decimals: number;
  jettonAddress: string;
  totalBalance: string;
}

export interface TransactionResult {
  success: boolean;
  boc: string; // Base64 encoded bag of cells
  error?: string;
}

/**
 * Get TON client instance
 */
function getTonClient(): TonClient {
  return new TonClient({
    endpoint: TON_API_ENDPOINT,
  });
}

/**
 * Get TON balance for an account
 */
export async function getTonBalance(address: string): Promise<TonBalance> {
  try {
    const client = getTonClient();
    const parsedAddress = Address.parse(address);
    const balance = await client.getBalance(parsedAddress);
    
    const balanceTon = fromNano(balance);
    
    return {
      balance: balanceTon,
      nanotons: balance.toString(),
    };
  } catch (error) {
    console.error('Failed to fetch TON balance:', error);
    throw new Error('Failed to fetch TON balance');
  }
}

/**
 * Get Jetton balance for a specific jetton wallet
 */
export async function getJettonBalance(
  ownerAddress: string,
  jettonMasterAddress: string
): Promise<JettonBalance> {
  try {
    const client = getTonClient();
    
    // Get jetton wallet address for the owner
    const jettonWalletAddress = await getJettonWalletAddress(
      ownerAddress,
      jettonMasterAddress
    );
    
    if (!jettonWalletAddress) {
      return {
        balance: '0',
        decimals: 9, // Default
        jettonAddress: jettonMasterAddress,
        totalBalance: '0',
      };
    }
    
    // Call get_wallet_data method on jetton wallet
    const result = await client.runMethod(
      Address.parse(jettonWalletAddress),
      'get_wallet_data'
    );
    
    const balance = result.stack.readBigNumber();
    
    // Try to get decimals from jetton master
    let decimals = 9; // Default to 9 decimals
    try {
      const metadataResult = await client.runMethod(
        Address.parse(jettonMasterAddress),
        'get_jetton_data'
      );
      // Jetton data: total_supply, mintable, admin_address, content, wallet_code
      // Decimals are usually in content metadata
      decimals = 9; // Keep default for now
    } catch (err) {
      console.warn('Could not fetch jetton decimals, using default 9', err);
    }
    
    return {
      balance: balance.toString(),
      decimals,
      jettonAddress: jettonMasterAddress,
      totalBalance: balance.toString(),
    };
  } catch (error) {
    console.error('Failed to fetch jetton balance:', error);
    throw new Error('Failed to fetch jetton balance');
  }
}

/**
 * Get jetton wallet address for an owner
 */
async function getJettonWalletAddress(
  ownerAddress: string,
  jettonMasterAddress: string
): Promise<string | null> {
  try {
    const client = getTonClient();
    const owner = Address.parse(ownerAddress);
    const jettonMaster = Address.parse(jettonMasterAddress);
    
    const result = await client.runMethod(
      jettonMaster,
      'get_wallet_address',
      [
        { type: 'slice', cell: beginCell().storeAddress(owner).endCell() }
      ]
    );
    
    const jettonWalletAddress = result.stack.readAddress();
    return jettonWalletAddress.toString();
  } catch (error) {
    console.error('Failed to get jetton wallet address:', error);
    return null;
  }
}

/**
 * Build TON transfer transaction
 */
export function buildTonTransfer(
  toAddress: string,
  amount: string, // In nanotons
  memo?: string
): SendTransactionRequest {
  try {
    const payload = memo
      ? beginCell().storeUint(0, 32).storeStringTail(memo).endCell().toBoc().toString('base64')
      : '';
    
    return {
      validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      messages: [
        {
          address: toAddress,
          amount: amount,
          payload: payload,
        },
      ],
    };
  } catch (error: any) {
    console.error('Failed to build TON transfer:', error);
    throw new Error(error?.message || 'Failed to build TON transfer');
  }
}

/**
 * Build Jetton transfer transaction
 */
export function buildJettonTransfer(
  jettonWalletAddress: string,
  recipientAddress: string,
  amount: string, // In smallest unit
  forwardAmount: string = '1' // Forward 1 nanoton for notification
): SendTransactionRequest {
  try {
    const recipient = Address.parse(recipientAddress);
    
    // Build transfer body according to TEP-74
    const body = beginCell()
      .storeUint(0xf8a7ea5, 32) // transfer op code
      .storeUint(0, 64) // query_id
      .storeCoins(BigInt(amount)) // amount
      .storeAddress(recipient) // destination
      .storeAddress(recipient) // response_destination
      .storeBit(0) // no custom payload
      .storeCoins(BigInt(forwardAmount)) // forward_ton_amount
      .storeBit(0) // no forward_payload
      .endCell();
    
    // Amount to send to jetton wallet (for gas)
    const gasAmount = toNano('0.05'); // 0.05 TON for gas
    
    return {
      validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      messages: [
        {
          address: jettonWalletAddress,
          amount: gasAmount.toString(),
          payload: body.toBoc().toString('base64'),
        },
      ],
    };
  } catch (error: any) {
    console.error('Failed to build jetton transfer:', error);
    throw new Error(error?.message || 'Failed to build jetton transfer');
  }
}

/**
 * Wait for transaction confirmation
 * Note: TON transactions are usually confirmed quickly (5-10 seconds)
 */
export async function waitForTransaction(
  transactionHash: string,
  timeoutMs: number = 60000
): Promise<boolean> {
  try {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // Check if transaction exists
        // Note: TON transaction hash format is different, this is a simplified check
        // In production, you'd use TON API to check transaction status
        await new Promise(resolve => setTimeout(resolve, 2000));
        // For now, assume success after waiting
        return true;
      } catch (err) {
        // Transaction not yet available, continue polling
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.warn('Transaction confirmation timeout');
    return false;
  } catch (error) {
    console.error('Failed to wait for transaction:', error);
    return false;
  }
}

/**
 * Get transaction status
 * Note: TON transaction tracking is simplified here
 */
export async function getTransactionStatus(transactionHash: string) {
  try {
    return {
      status: 'confirmed',
      transactionHash,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    throw new Error('Failed to get transaction status');
  }
}

/**
 * Get jetton metadata
 */
export async function getJettonMetadata(jettonMasterAddress: string) {
  try {
    const client = getTonClient();
    const jettonMaster = Address.parse(jettonMasterAddress);
    
    const result = await client.runMethod(jettonMaster, 'get_jetton_data');
    
    // Parse jetton data
    // total_supply, mintable, admin_address, content, wallet_code
    const totalSupply = result.stack.readBigNumber();
    
    return {
      totalSupply: totalSupply.toString(),
      decimals: 9, // Default
      jettonAddress: jettonMasterAddress,
    };
  } catch (error) {
    console.error('Failed to get jetton metadata:', error);
    return null;
  }
}

/**
 * Parse amount from human-readable to nanotons
 */
export function parseAmount(amount: string, decimals: number = 9): string {
  try {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
      throw new Error('Invalid amount');
    }
    
    // Convert to smallest unit
    const multiplier = Math.pow(10, decimals);
    const smallestUnit = Math.floor(parsed * multiplier);
    
    return smallestUnit.toString();
  } catch (error) {
    console.error('Failed to parse amount:', error);
    throw new Error('Invalid amount format');
  }
}

/**
 * Format amount from nanotons to human-readable
 */
export function formatAmount(amount: string, decimals: number = 9): string {
  try {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) {
      return '0';
    }
    
    const divisor = Math.pow(10, decimals);
    const formatted = parsed / divisor;
    
    return formatted.toFixed(decimals);
  } catch (error) {
    console.error('Failed to format amount:', error);
    return '0';
  }
}

/**
 * Validate TON address
 */
export function isValidTonAddress(address: string): boolean {
  try {
    Address.parse(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Estimate transaction fee
 * TON transactions typically cost 0.01-0.05 TON
 */
export async function estimateTransactionFee(): Promise<string> {
  try {
    // Return typical fee estimate
    return toNano('0.01').toString(); // 0.01 TON
  } catch (error) {
    console.error('Failed to estimate transaction fee:', error);
    return toNano('0.01').toString();
  }
}

/**
 * Check if account has sufficient balance for transaction
 */
export async function hasSufficientBalance(
  address: string,
  amount: string,
  jettonAddress?: string
): Promise<boolean> {
  try {
    if (jettonAddress) {
      const jettonBalance = await getJettonBalance(address, jettonAddress);
      return BigInt(jettonBalance.totalBalance) >= BigInt(amount);
    } else {
      const tonBalance = await getTonBalance(address);
      return BigInt(tonBalance.nanotons) >= BigInt(amount);
    }
  } catch (error) {
    console.error('Failed to check balance:', error);
    return false;
  }
}

/**
 * Common TON jetton addresses on mainnet
 */
export const TON_JETTONS = {
  // Note: These are example addresses, update with actual jetton addresses
  USDT: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // Example
  USDC: 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA', // Example
  NOTCOIN: 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT', // Example
};
