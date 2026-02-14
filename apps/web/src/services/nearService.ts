import type { WalletSelector } from '@near-wallet-selector/core';

const NEAR_RPC_URL = 'https://rpc.mainnet.near.org';

/**
 * NEAR Transaction Service
 * Handles balance fetching, transaction building, and execution for NEAR blockchain
 */

export interface NearBalance {
  available: string; // In NEAR
  stateStaked: string; // In NEAR
  total: string; // In NEAR
}

export interface FTBalance {
  balance: string;
  decimals: number;
  symbol?: string;
}

export interface TransactionResult {
  success: boolean;
  transactionHash: string;
  error?: string;
}

/**
 * Get NEAR balance for an account
 */
export async function getNearBalance(accountId: string): Promise<NearBalance> {
  try {
    const response = await fetch(NEAR_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'view_account',
          finality: 'final',
          account_id: accountId,
        },
      }),
    });

    const { result } = await response.json();
    
    // Convert yoctoNEAR to NEAR (1 NEAR = 10^24 yoctoNEAR)
    const total = (parseFloat(result.amount) / 1e24).toFixed(5);
    const staked = (parseFloat(result.locked) / 1e24).toFixed(5);
    const available = (parseFloat(total) - parseFloat(staked)).toFixed(5);

    return {
      available,
      stateStaked: staked,
      total,
    };
  } catch (error) {
    console.error('Failed to fetch NEAR balance:', error);
    throw new Error('Failed to fetch NEAR balance');
  }
}

/**
 * Get FT (Fungible Token) balance for an account
 */
export async function getFTBalance(
  accountId: string,
  contractId: string
): Promise<FTBalance> {
  try {
    // Call ft_balance_of method
    const balanceResponse = await fetch(NEAR_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: contractId,
          method_name: 'ft_balance_of',
          args_base64: btoa(JSON.stringify({ account_id: accountId })),
        },
      }),
    });

    const { result: balanceResult } = await balanceResponse.json();
    const balance = JSON.parse(
      Buffer.from(balanceResult.result).toString()
    );

    // Get metadata for decimals
    const metadataResponse = await fetch(NEAR_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: contractId,
          method_name: 'ft_metadata',
          args_base64: btoa(JSON.stringify({})),
        },
      }),
    });

    const { result: metadataResult } = await metadataResponse.json();
    const metadata = JSON.parse(
      Buffer.from(metadataResult.result).toString()
    );

    return {
      balance,
      decimals: metadata.decimals || 24,
      symbol: metadata.symbol,
    };
  } catch (error) {
    console.error('Failed to fetch FT balance:', error);
    throw new Error('Failed to fetch FT balance');
  }
}

/**
 * Transfer NEAR tokens
 */
export async function transferNear(
  selector: WalletSelector,
  receiverId: string,
  amount: string // Amount in NEAR (e.g., "1.5")
): Promise<TransactionResult> {
  try {
    const wallet = await selector.wallet();
    const accounts = await wallet.getAccounts();
    
    if (accounts.length === 0) {
      throw new Error('No account connected');
    }

    // Convert amount to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
    const amountInYocto = (parseFloat(amount) * 1e24).toFixed(0);

    // Sign and send transaction
    const result: any = await wallet.signAndSendTransaction({
      receiverId,
      actions: [
        {
          type: 'Transfer',
          params: {
            deposit: amountInYocto,
          },
        } as any,
      ],
    });

    // Check if transaction was successful
    if (result) {
      return {
        success: true,
        transactionHash: result.transaction?.hash || result.transactionHash || 'unknown',
      };
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error: any) {
    console.error('NEAR transfer failed:', error);
    return {
      success: false,
      transactionHash: '',
      error: error.message || 'Transfer failed',
    };
  }
}

/**
 * Transfer FT (Fungible Token) tokens
 */
export async function transferFT(
  selector: WalletSelector,
  contractId: string,
  receiverId: string,
  amount: string, // Amount in smallest unit (considering decimals)
  memo?: string
): Promise<TransactionResult> {
  try {
    const wallet = await selector.wallet();
    const accounts = await wallet.getAccounts();
    
    if (accounts.length === 0) {
      throw new Error('No account connected');
    }

    // FT transfer requires 1 yoctoNEAR deposit
    const deposit = '1';

    // Sign and send transaction
    const result: any = await wallet.signAndSendTransaction({
      receiverId: contractId,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: 'ft_transfer',
            args: {
              receiver_id: receiverId,
              amount,
              memo: memo || null,
            },
            gas: '30000000000000', // 30 TGas
            deposit,
          },
        } as any,
      ],
    });

    if (result) {
      return {
        success: true,
        transactionHash: result.transaction?.hash || result.transactionHash || 'unknown',
      };
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error: any) {
    console.error('FT transfer failed:', error);
    return {
      success: false,
      transactionHash: '',
      error: error.message || 'Transfer failed',
    };
  }
}

/**
 * Check if an account has FT storage deposit
 */
export async function checkStorageDeposit(
  accountId: string,
  contractId: string
): Promise<boolean> {
  try {
    const response = await fetch(NEAR_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: contractId,
          method_name: 'storage_balance_of',
          args_base64: btoa(JSON.stringify({ account_id: accountId })),
        },
      }),
    });

    const { result } = await response.json();
    const storageBalance = JSON.parse(
      Buffer.from(result.result).toString()
    );

    return storageBalance !== null;
  } catch (error) {
    console.error('Failed to check storage deposit:', error);
    return false;
  }
}

/**
 * Register account for FT (pay storage deposit)
 */
export async function registerFTAccount(
  selector: WalletSelector,
  contractId: string,
  accountId?: string
): Promise<TransactionResult> {
  try {
    const wallet = await selector.wallet();
    const accounts = await wallet.getAccounts();
    
    if (accounts.length === 0) {
      throw new Error('No account connected');
    }

    const registrationAccountId = accountId || accounts[0].accountId;

    // Typical storage deposit is 0.00125 NEAR (1.25e21 yoctoNEAR)
    const storageDeposit = '1250000000000000000000';

    const result: any = await wallet.signAndSendTransaction({
      receiverId: contractId,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: 'storage_deposit',
            args: {
              account_id: registrationAccountId,
              registration_only: true,
            },
            gas: '30000000000000', // 30 TGas
            deposit: storageDeposit,
          },
        } as any,
      ],
    });

    if (result) {
      return {
        success: true,
        transactionHash: result.transaction?.hash || result.transactionHash || 'unknown',
      };
    } else {
      throw new Error('Registration failed');
    }
  } catch (error: any) {
    console.error('FT registration failed:', error);
    return {
      success: false,
      transactionHash: '',
      error: error.message || 'Registration failed',
    };
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  transactionHash: string,
  accountId: string,
  maxAttempts: number = 10
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(NEAR_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'tx',
          params: [transactionHash, accountId],
        }),
      });

      const { result } = await response.json();
      
      if (result?.status) {
        if (result.status.SuccessValue !== undefined || result.status.SuccessReceiptId) {
          return true;
        }
        if (result.status.Failure) {
          console.error('Transaction failed:', result.status.Failure);
          return false;
        }
      }
    } catch (error) {
      // Transaction might not be ready yet
      console.log(`Attempt ${i + 1}: Transaction not confirmed yet`);
    }

    // Wait 2 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return false;
}

/**
 * Parse token amount with decimals
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  const multiplier = Math.pow(10, decimals);
  const parsedAmount = parseFloat(amount) * multiplier;
  return Math.floor(parsedAmount).toString();
}

/**
 * Format token amount from smallest unit
 */
export function formatTokenAmount(amount: string, decimals: number): string {
  const divisor = Math.pow(10, decimals);
  const formatted = parseFloat(amount) / divisor;
  return formatted.toFixed(Math.min(decimals, 6));
}
