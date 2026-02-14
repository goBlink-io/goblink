import { RpcProvider, Contract, uint256, CallData, type GetTransactionReceiptResponse } from 'starknet';

const STARKNET_RPC_URL = 'https://starknet-mainnet.public.blastapi.io';

/**
 * Starknet Transaction Service
 * Handles balance fetching, transaction building, and execution for Starknet blockchain
 */

export interface StarknetBalance {
  balance: string; // In ETH
  wei: string; // In WEI (1 ETH = 10^18 WEI)
}

export interface StarknetTokenBalance {
  balance: string; // In smallest unit
  decimals: number;
  contractAddress: string;
  totalBalance: string;
}

export interface TransactionResult {
  success: boolean;
  transactionHash: string;
  error?: string;
}

/**
 * Get Starknet RPC provider instance
 */
function getStarknetProvider(): RpcProvider {
  return new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
}

/**
 * ERC20 ABI for token interactions
 */
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'felt' }],
    outputs: [{ name: 'balance', type: 'Uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'felt' },
      { name: 'amount', type: 'Uint256' },
    ],
    outputs: [{ name: 'success', type: 'felt' }],
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'felt' }],
    stateMutability: 'view',
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'felt' }],
    stateMutability: 'view',
  },
  {
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'name', type: 'felt' }],
    stateMutability: 'view',
  },
];

/**
 * Get ETH balance for an account
 */
export async function getStarknetBalance(address: string): Promise<StarknetBalance> {
  try {
    const provider = getStarknetProvider();
    
    // ETH contract address on Starknet
    const ethContractAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
    const contract = new Contract(ERC20_ABI, ethContractAddress, provider);
    
    const result = await contract.call('balanceOf', [address]) as any;
    const balanceUint256 = uint256.uint256ToBN(result.balance || result);
    const balanceWei = balanceUint256.toString();
    
    return {
      balance: (parseFloat(balanceWei) / 1e18).toFixed(18),
      wei: balanceWei,
    };
  } catch (error) {
    console.error('Failed to fetch ETH balance:', error);
    throw new Error('Failed to fetch ETH balance');
  }
}

/**
 * Get ERC20 token balance for a specific contract
 */
export async function getStarknetTokenBalance(
  address: string,
  contractAddress: string
): Promise<StarknetTokenBalance> {
  try {
    const provider = getStarknetProvider();
    const contract = new Contract(ERC20_ABI, contractAddress, provider);
    
    // Get balance
    const balanceResult = await contract.call('balanceOf', [address]) as any;
    const balanceUint256 = uint256.uint256ToBN(balanceResult.balance || balanceResult);
    const balance = balanceUint256.toString();
    
    // Get decimals
    let decimals = 18; // Default to 18
    try {
      const decimalsResult = await contract.call('decimals', []);
      decimals = Number(decimalsResult);
    } catch (err) {
      console.warn('Could not fetch token decimals, using default 18', err);
    }
    
    return {
      balance,
      decimals,
      contractAddress,
      totalBalance: balance,
    };
  } catch (error) {
    console.error('Failed to fetch token balance:', error);
    throw new Error('Failed to fetch token balance');
  }
}

/**
 * Send ETH tokens
 */
export async function sendStarknetEth(
  account: any, // Wallet account from window.starknet
  recipient: string,
  amount: string // Amount in WEI (smallest unit)
): Promise<TransactionResult> {
  try {
    if (!account || !account.address) {
      throw new Error('No account connected');
    }

    const ethContractAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
    
    // Prepare the transfer call
    const transferCallData = CallData.compile({
      recipient,
      amount: uint256.bnToUint256(amount),
    });

    // Execute the transaction through the wallet
    const result = await account.execute({
      contractAddress: ethContractAddress,
      entrypoint: 'transfer',
      calldata: transferCallData,
    });

    return {
      success: true,
      transactionHash: result.transaction_hash,
    };
  } catch (error: any) {
    console.error('Failed to send ETH:', error);
    return {
      success: false,
      transactionHash: '',
      error: error?.message || 'Failed to send ETH',
    };
  }
}

/**
 * Send ERC20 tokens
 */
export async function sendStarknetToken(
  account: any, // Wallet account from window.starknet
  contractAddress: string,
  recipient: string,
  amount: string // Amount in smallest unit
): Promise<TransactionResult> {
  try {
    if (!account || !account.address) {
      throw new Error('No account connected');
    }

    // Prepare the transfer call
    const transferCallData = CallData.compile({
      recipient,
      amount: uint256.bnToUint256(amount),
    });

    // Execute the transaction through the wallet
    const result = await account.execute({
      contractAddress,
      entrypoint: 'transfer',
      calldata: transferCallData,
    });

    return {
      success: true,
      transactionHash: result.transaction_hash,
    };
  } catch (error: any) {
    console.error('Failed to send token:', error);
    return {
      success: false,
      transactionHash: '',
      error: error?.message || 'Failed to send token',
    };
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  transactionHash: string,
  timeoutMs: number = 60000 // 60 seconds for Starknet
): Promise<boolean> {
  try {
    const provider = getStarknetProvider();
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const receipt = await provider.getTransactionReceipt(transactionHash) as any;
        
        if (receipt.execution_status === 'SUCCEEDED' || receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1') {
          return true;
        } else if (receipt.execution_status === 'REVERTED' || receipt.status === 'REJECTED') {
          return false;
        }
        // If PENDING or RECEIVED, continue polling
      } catch (err) {
        // Transaction not yet available, continue polling
      }

      // Wait 5 seconds before next poll (Starknet is slower)
      await new Promise(resolve => setTimeout(resolve, 5000));
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
export async function getTransactionStatus(transactionHash: string) {
  try {
    const provider = getStarknetProvider();
    const receipt = await provider.getTransactionReceipt(transactionHash) as any;

    return {
      status: receipt.execution_status || receipt.status || 'unknown',
      transactionHash: receipt.transaction_hash || transactionHash,
      blockHash: receipt.block_hash,
      blockNumber: receipt.block_number,
      actualFee: receipt.actual_fee,
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    throw new Error('Failed to get transaction status');
  }
}

/**
 * Get token metadata (symbol, decimals, etc.)
 */
export async function getTokenMetadata(contractAddress: string) {
  try {
    const provider = getStarknetProvider();
    const contract = new Contract(ERC20_ABI, contractAddress, provider);
    
    let symbol = '';
    let name = '';
    let decimals = 18;

    try {
      const symbolResult = await contract.call('symbol', []);
      // Starknet returns felt, may need conversion
      symbol = symbolResult.toString();
    } catch (err) {
      console.warn('Could not fetch token symbol', err);
    }

    try {
      const nameResult = await contract.call('name', []);
      name = nameResult.toString();
    } catch (err) {
      console.warn('Could not fetch token name', err);
    }

    try {
      const decimalsResult = await contract.call('decimals', []);
      decimals = Number(decimalsResult);
    } catch (err) {
      console.warn('Could not fetch token decimals', err);
    }

    return {
      decimals,
      name,
      symbol,
      contractAddress,
    };
  } catch (error) {
    console.error('Failed to get token metadata:', error);
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
 * Validate Starknet address
 */
export function isValidStarknetAddress(address: string): boolean {
  // Starknet addresses are hex strings with 0x prefix
  // They can be up to 66 characters (0x + 64 hex chars)
  return /^0x[a-fA-F0-9]{1,64}$/.test(address);
}

/**
 * Estimate transaction fee
 */
export async function estimateTransactionFee(
  account: any,
  calls: any[]
): Promise<string> {
  try {
    if (!account || !account.estimateFee) {
      throw new Error('Account does not support fee estimation');
    }

    const feeEstimate = await account.estimateFee(calls);
    
    // Return the overall fee in WEI
    return feeEstimate.overall_fee?.toString() || '0';
  } catch (error) {
    console.error('Failed to estimate transaction fee:', error);
    // Return default estimate (0.001 ETH = 10^15 WEI)
    return '1000000000000000';
  }
}

/**
 * Check if account has sufficient balance for transaction
 */
export async function hasSufficientBalance(
  address: string,
  amount: string,
  contractAddress?: string
): Promise<boolean> {
  try {
    let balance: string;
    
    if (contractAddress) {
      const tokenBalance = await getStarknetTokenBalance(address, contractAddress);
      balance = tokenBalance.totalBalance;
    } else {
      const ethBalance = await getStarknetBalance(address);
      balance = ethBalance.wei;
    }
    
    return BigInt(balance) >= BigInt(amount);
  } catch (error) {
    console.error('Failed to check balance:', error);
    return false;
  }
}

/**
 * Common Starknet token contract addresses
 */
export const STARKNET_TOKENS = {
  ETH: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  USDC: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
  USDT: '0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8',
  DAI: '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3',
  WBTC: '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac',
};
