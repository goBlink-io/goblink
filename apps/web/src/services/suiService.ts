import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import type { WalletAccount } from '@mysten/wallet-standard';

const SUI_RPC_URL = getFullnodeUrl('mainnet');

/**
 * Sui Transaction Service
 * Handles balance fetching, transaction building, and execution for Sui blockchain
 */

export interface SuiBalance {
  balance: string; // In SUI
  mist: string; // In MIST (1 SUI = 10^9 MIST)
}

export interface SuiTokenBalance {
  balance: string; // In smallest unit
  decimals: number;
  coinType: string;
  totalBalance: string;
}

export interface TransactionResult {
  success: boolean;
  digest: string;
  error?: string;
}

/**
 * Get Sui client instance
 */
function getSuiClient(): SuiClient {
  return new SuiClient({ url: SUI_RPC_URL });
}

/**
 * Get SUI balance for an account
 */
export async function getSuiBalance(address: string): Promise<SuiBalance> {
  try {
    const client = getSuiClient();
    const balance = await client.getBalance({
      owner: address,
      coinType: '0x2::sui::SUI',
    });

    return {
      balance: (parseFloat(balance.totalBalance) / 1e9).toFixed(9),
      mist: balance.totalBalance,
    };
  } catch (error) {
    console.error('Failed to fetch SUI balance:', error);
    throw new Error('Failed to fetch SUI balance');
  }
}

/**
 * Get token balance for a specific coin type
 */
export async function getSuiTokenBalance(
  address: string,
  coinType: string
): Promise<SuiTokenBalance> {
  try {
    const client = getSuiClient();
    const balance = await client.getBalance({
      owner: address,
      coinType,
    });

    // Try to get coin metadata for decimals
    let decimals = 9; // Default to 9 decimals
    try {
      const metadata = await client.getCoinMetadata({ coinType });
      if (metadata) {
        decimals = metadata.decimals;
      }
    } catch (err) {
      console.warn('Could not fetch coin metadata, using default decimals', err);
    }

    return {
      balance: balance.totalBalance,
      decimals,
      coinType,
      totalBalance: balance.totalBalance,
    };
  } catch (error) {
    console.error('Failed to fetch token balance:', error);
    throw new Error('Failed to fetch token balance');
  }
}

/**
 * Get all coin balances for an account
 */
export async function getAllBalances(address: string) {
  try {
    const client = getSuiClient();
    const balances = await client.getAllBalances({ owner: address });
    return balances;
  } catch (error) {
    console.error('Failed to fetch all balances:', error);
    throw new Error('Failed to fetch all balances');
  }
}

/**
 * Send SUI tokens
 */
export async function sendSui(
  signAndExecuteTransactionBlock: any,
  recipient: string,
  amount: string // Amount in MIST (smallest unit)
): Promise<TransactionResult> {
  try {
    const txb = new TransactionBlock();
    
    const [coin] = txb.splitCoins(txb.gas, [txb.pure(amount)]);
    txb.transferObjects([coin], txb.pure(recipient));

    const result = await signAndExecuteTransactionBlock({
      transactionBlock: txb,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    if (result.effects?.status?.status === 'success') {
      return {
        success: true,
        digest: result.digest,
      };
    } else {
      return {
        success: false,
        digest: result.digest,
        error: result.effects?.status?.error || 'Transaction failed',
      };
    }
  } catch (error: any) {
    console.error('Failed to send SUI:', error);
    return {
      success: false,
      digest: '',
      error: error?.message || 'Failed to send SUI',
    };
  }
}

/**
 * Send Sui tokens (USDC, USDT, etc.)
 */
export async function sendSuiToken(
  signAndExecuteTransactionBlock: any,
  address: string,
  coinType: string,
  recipient: string,
  amount: string // Amount in smallest unit
): Promise<TransactionResult> {
  try {
    const client = getSuiClient();
    
    // Get coins of the specified type owned by the address
    const coins = await client.getCoins({
      owner: address,
      coinType,
    });

    if (!coins.data || coins.data.length === 0) {
      return {
        success: false,
        digest: '',
        error: 'No coins found for this type',
      };
    }

    const txb = new TransactionBlock();
    
    // If we have multiple coins, merge them first
    if (coins.data.length > 1) {
      const coinObjects = coins.data.map(coin => coin.coinObjectId);
      txb.mergeCoins(txb.object(coinObjects[0]), coinObjects.slice(1).map(id => txb.object(id)));
      const [coin] = txb.splitCoins(txb.object(coinObjects[0]), [txb.pure(amount)]);
      txb.transferObjects([coin], txb.pure(recipient));
    } else {
      const [coin] = txb.splitCoins(txb.object(coins.data[0].coinObjectId), [txb.pure(amount)]);
      txb.transferObjects([coin], txb.pure(recipient));
    }

    const result = await signAndExecuteTransactionBlock({
      transactionBlock: txb,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    if (result.effects?.status?.status === 'success') {
      return {
        success: true,
        digest: result.digest,
      };
    } else {
      return {
        success: false,
        digest: result.digest,
        error: result.effects?.status?.error || 'Transaction failed',
      };
    }
  } catch (error: any) {
    console.error('Failed to send token:', error);
    return {
      success: false,
      digest: '',
      error: error?.message || 'Failed to send token',
    };
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  digest: string,
  timeoutMs: number = 30000
): Promise<boolean> {
  try {
    const client = getSuiClient();
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const txResponse = await client.getTransactionBlock({
          digest,
          options: {
            showEffects: true,
          },
        });

        if (txResponse.effects?.status?.status === 'success') {
          return true;
        } else if (txResponse.effects?.status?.status === 'failure') {
          return false;
        }
      } catch (err) {
        // Transaction not yet available, continue polling
      }

      // Wait 2 seconds before next poll
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
 */
export async function getTransactionStatus(digest: string) {
  try {
    const client = getSuiClient();
    const txResponse = await client.getTransactionBlock({
      digest,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });

    return {
      status: txResponse.effects?.status?.status || 'unknown',
      digest: txResponse.digest,
      timestamp: txResponse.timestampMs,
      gasUsed: txResponse.effects?.gasUsed,
      effects: txResponse.effects,
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    throw new Error('Failed to get transaction status');
  }
}

/**
 * Get coin metadata (symbol, decimals, etc.)
 */
export async function getCoinMetadata(coinType: string) {
  try {
    const client = getSuiClient();
    const metadata = await client.getCoinMetadata({ coinType });
    
    if (!metadata) {
      return null;
    }

    return {
      decimals: metadata.decimals,
      name: metadata.name,
      symbol: metadata.symbol,
      description: metadata.description,
      iconUrl: metadata.iconUrl,
    };
  } catch (error) {
    console.error('Failed to get coin metadata:', error);
    return null;
  }
}

/**
 * Parse amount from human-readable to smallest unit
 */
export function parseAmount(amount: string, decimals: number): string {
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
 * Format amount from smallest unit to human-readable
 */
export function formatAmount(amount: string, decimals: number): string {
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
 * Validate Sui address
 */
export function isValidSuiAddress(address: string): boolean {
  // Sui addresses are 32-byte hex strings with 0x prefix (66 characters total)
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

/**
 * Get gas price estimate
 */
export async function getGasPrice(): Promise<string> {
  try {
    const client = getSuiClient();
    const gasPrice = await client.getReferenceGasPrice();
    return gasPrice.toString();
  } catch (error) {
    console.error('Failed to get gas price:', error);
    throw new Error('Failed to get gas price');
  }
}

/**
 * Estimate transaction fee
 */
export async function estimateTransactionFee(
  txb: TransactionBlock
): Promise<string> {
  try {
    const client = getSuiClient();
    
    // Dry run the transaction to get gas estimate
    const dryRunResult = await client.dryRunTransactionBlock({
      transactionBlock: await txb.build({ client }),
    });

    if (dryRunResult.effects.status.status !== 'success') {
      throw new Error('Dry run failed');
    }

    const gasUsed = dryRunResult.effects.gasUsed;
    const totalGas = 
      BigInt(gasUsed.computationCost) +
      BigInt(gasUsed.storageCost) -
      BigInt(gasUsed.storageRebate);

    return totalGas.toString();
  } catch (error) {
    console.error('Failed to estimate transaction fee:', error);
    // Return default estimate (0.001 SUI = 1,000,000 MIST)
    return '1000000';
  }
}

/**
 * Check if account has sufficient balance for transaction
 */
export async function hasSufficientBalance(
  address: string,
  amount: string,
  coinType: string = '0x2::sui::SUI'
): Promise<boolean> {
  try {
    const balance = await getSuiTokenBalance(address, coinType);
    return BigInt(balance.totalBalance) >= BigInt(amount);
  } catch (error) {
    console.error('Failed to check balance:', error);
    return false;
  }
}
