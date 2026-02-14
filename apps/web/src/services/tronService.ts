/**
 * TRON Transaction Service
 * Handles balance fetching, transaction building, and execution for TRON blockchain
 */

// TronWeb types - using window.tronWeb injected by TronLink
interface TronWeb {
  trx: {
    getBalance: (address: string) => Promise<number>;
    sendTransaction: (to: string, amount: number, options?: any) => Promise<any>;
    getTransaction: (txID: string) => Promise<any>;
    getTransactionInfo: (txID: string) => Promise<any>;
  };
  transactionBuilder: {
    triggerSmartContract: (
      contractAddress: string,
      functionSelector: string,
      options: any,
      parameters: any[],
      issuerAddress: string
    ) => Promise<any>;
  };
  contract: (abi?: any[], address?: string) => Promise<any>;
  address: {
    fromHex: (hexAddress: string) => string;
    toHex: (address: string) => string;
  };
  isAddress: (address: string) => boolean;
  fromSun: (sun: number) => string;
  toSun: (trx: string | number) => number;
  BigNumber: any;
}

export interface TronBalance {
  balance: string; // In TRX
  sun: string; // In SUN (1 TRX = 1,000,000 SUN)
}

export interface TRC20Balance {
  balance: string; // In smallest unit
  decimals: number;
  tokenAddress: string;
  symbol?: string;
  name?: string;
}

export interface TransactionResult {
  success: boolean;
  txID: string;
  error?: string;
}

// TRC-20 token ABI (minimal - transfer function)
const TRC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'Function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'Function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'Function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'Function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'Function',
  },
];

/**
 * Get TronWeb instance from window (injected by TronLink)
 */
function getTronWeb(): TronWeb | null {
  if (typeof window === 'undefined') return null;
  return (window as any).tronWeb || null;
}

/**
 * Get TRX balance for an account
 */
export async function getTronBalance(address: string): Promise<TronBalance> {
  try {
    const tronWeb = getTronWeb();
    if (!tronWeb) {
      throw new Error('TronWeb not available');
    }

    const balanceSun = await tronWeb.trx.getBalance(address);
    const balanceTrx = tronWeb.fromSun(balanceSun);

    return {
      balance: balanceTrx,
      sun: balanceSun.toString(),
    };
  } catch (error) {
    console.error('Failed to fetch TRX balance:', error);
    throw new Error('Failed to fetch TRX balance');
  }
}

/**
 * Get TRC-20 token balance
 */
export async function getTRC20Balance(
  ownerAddress: string,
  tokenAddress: string
): Promise<TRC20Balance> {
  try {
    const tronWeb = getTronWeb();
    if (!tronWeb) {
      throw new Error('TronWeb not available');
    }

    // Create contract instance
    const contract = await tronWeb.contract(TRC20_ABI, tokenAddress);

    // Get balance
    const balance = await contract.balanceOf(ownerAddress).call();

    // Get decimals
    let decimals = 6; // Default for USDT on TRON
    try {
      const decimalsResult = await contract.decimals().call();
      decimals = typeof decimalsResult === 'object' && decimalsResult && 'toNumber' in decimalsResult
        ? (decimalsResult as any).toNumber()
        : Number(decimalsResult);
    } catch (err) {
      console.warn('Could not fetch token decimals, using default 6', err);
    }

    // Get symbol (optional)
    let symbol = '';
    try {
      symbol = await contract.symbol().call();
    } catch (err) {
      console.warn('Could not fetch token symbol', err);
    }

    // Get name (optional)
    let name = '';
    try {
      name = await contract.name().call();
    } catch (err) {
      console.warn('Could not fetch token name', err);
    }

    // Convert balance to string
    const balanceStr = typeof balance === 'object' ? balance.toString() : String(balance);

    return {
      balance: balanceStr,
      decimals,
      tokenAddress,
      symbol,
      name,
    };
  } catch (error) {
    console.error('Failed to fetch TRC-20 balance:', error);
    throw new Error('Failed to fetch TRC-20 balance');
  }
}

/**
 * Send TRX to another address
 */
export async function sendTRX(
  tronWeb: TronWeb,
  fromAddress: string,
  toAddress: string,
  amount: string // In SUN
): Promise<TransactionResult> {
  try {
    if (!tronWeb) {
      throw new Error('TronWeb not available');
    }

    if (!isValidTronAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }

    const amountSun = parseInt(amount, 10);
    if (isNaN(amountSun) || amountSun <= 0) {
      throw new Error('Invalid amount');
    }

    // Send transaction
    const tx = await tronWeb.trx.sendTransaction(toAddress, amountSun);

    if (!tx || !tx.txid) {
      throw new Error('Transaction failed');
    }

    return {
      success: true,
      txID: tx.txid,
    };
  } catch (error: any) {
    console.error('Failed to send TRX:', error);
    return {
      success: false,
      txID: '',
      error: error?.message || 'Failed to send TRX',
    };
  }
}

/**
 * Send TRC-20 tokens
 */
export async function sendTRC20(
  tronWeb: TronWeb,
  fromAddress: string,
  tokenAddress: string,
  toAddress: string,
  amount: string // In smallest unit
): Promise<TransactionResult> {
  try {
    if (!tronWeb) {
      throw new Error('TronWeb not available');
    }

    if (!isValidTronAddress(toAddress)) {
      throw new Error('Invalid recipient address');
    }

    if (!isValidTronAddress(tokenAddress)) {
      throw new Error('Invalid token address');
    }

    // Create contract instance
    const contract = await tronWeb.contract(TRC20_ABI, tokenAddress);

    // Send transaction
    const tx = await contract.transfer(toAddress, amount).send({
      feeLimit: 100_000_000, // 100 TRX fee limit
      callValue: 0,
      shouldPollResponse: false,
    });

    if (!tx) {
      throw new Error('Transaction failed');
    }

    return {
      success: true,
      txID: tx,
    };
  } catch (error: any) {
    console.error('Failed to send TRC-20:', error);
    return {
      success: false,
      txID: '',
      error: error?.message || 'Failed to send TRC-20 token',
    };
  }
}

/**
 * Wait for transaction confirmation
 * TRON transactions are typically confirmed in ~3 seconds
 */
export async function waitForTransaction(
  txID: string,
  timeoutMs: number = 60000
): Promise<boolean> {
  try {
    const tronWeb = getTronWeb();
    if (!tronWeb) {
      throw new Error('TronWeb not available');
    }

    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const txInfo = await tronWeb.trx.getTransactionInfo(txID);

        // Transaction is confirmed if it has receipt
        if (txInfo && txInfo.id) {
          // Check if transaction was successful
          if (txInfo.receipt && txInfo.receipt.result === 'SUCCESS') {
            return true;
          }
          // If there's a result but it's not SUCCESS, transaction failed
          if (txInfo.receipt && txInfo.receipt.result) {
            console.warn('Transaction failed with result:', txInfo.receipt.result);
            return false;
          }
        }
      } catch (err) {
        // Transaction not yet available, continue polling
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.warn('Transaction confirmation timeout');
    return false;
  } catch (error) {
    console.error('Failed to wait for transaction:', error);
    return false;
  }
}

/**
 * Get transaction status and details
 */
export async function getTransactionStatus(txID: string) {
  try {
    const tronWeb = getTronWeb();
    if (!tronWeb) {
      throw new Error('TronWeb not available');
    }

    const [tx, txInfo] = await Promise.all([
      tronWeb.trx.getTransaction(txID),
      tronWeb.trx.getTransactionInfo(txID),
    ]);

    return {
      status: txInfo && txInfo.receipt ? txInfo.receipt.result : 'PENDING',
      transaction: tx,
      info: txInfo,
      txID,
      timestamp: tx?.raw_data?.timestamp || Date.now(),
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    throw new Error('Failed to get transaction status');
  }
}

/**
 * Get TRC-20 token information
 */
export async function getTRC20TokenInfo(tokenAddress: string) {
  try {
    const tronWeb = getTronWeb();
    if (!tronWeb) {
      throw new Error('TronWeb not available');
    }

    const contract = await tronWeb.contract(TRC20_ABI, tokenAddress);

    const [symbol, name, decimals] = await Promise.all([
      contract.symbol().call().catch(() => ''),
      contract.name().call().catch(() => ''),
      contract.decimals().call().catch(() => 6),
    ]);

    const decimalsNumber = typeof decimals === 'object' ? decimals.toNumber() : Number(decimals);

    return {
      address: tokenAddress,
      symbol,
      name,
      decimals: decimalsNumber,
    };
  } catch (error) {
    console.error('Failed to get token info:', error);
    return null;
  }
}

/**
 * Parse amount from human-readable to smallest unit (SUN for TRX, or token units)
 */
export function parseAmount(amount: string, decimals: number = 6): string {
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
export function formatAmount(amount: string, decimals: number = 6): string {
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
 * Validate TRON address (Base58 format)
 */
export function isValidTronAddress(address: string): boolean {
  try {
    const tronWeb = getTronWeb();
    if (!tronWeb) {
      // Basic validation without TronWeb
      return /^T[A-Za-z1-9]{33}$/.test(address);
    }
    return tronWeb.isAddress(address);
  } catch (error) {
    return false;
  }
}

/**
 * Estimate transaction fee
 * TRON transactions typically cost 0-1 TRX depending on bandwidth and energy
 * TRC-20 transfers can cost 1-5 TRX without energy
 */
export async function estimateTransactionFee(isTokenTransfer: boolean = false): Promise<string> {
  try {
    const tronWeb = getTronWeb();
    if (!tronWeb) {
      throw new Error('TronWeb not available');
    }

    // TRX transfer: typically free if you have bandwidth, or ~0.1 TRX
    if (!isTokenTransfer) {
      return tronWeb.toSun(0.1).toString();
    }

    // TRC-20 transfer: typically 1-5 TRX without energy, ~0 with energy
    return tronWeb.toSun(5).toString(); // Conservative estimate
  } catch (error) {
    console.error('Failed to estimate transaction fee:', error);
    const tronWeb = getTronWeb();
    return tronWeb ? tronWeb.toSun(0.1).toString() : '100000'; // 0.1 TRX in SUN
  }
}

/**
 * Check if account has sufficient balance for transaction
 */
export async function hasSufficientBalance(
  address: string,
  amount: string,
  tokenAddress?: string
): Promise<boolean> {
  try {
    if (tokenAddress) {
      const tokenBalance = await getTRC20Balance(address, tokenAddress);
      return BigInt(tokenBalance.balance) >= BigInt(amount);
    } else {
      const trxBalance = await getTronBalance(address);
      return BigInt(trxBalance.sun) >= BigInt(amount);
    }
  } catch (error) {
    console.error('Failed to check balance:', error);
    return false;
  }
}

/**
 * Convert TRX to SUN
 */
export function trxToSun(trxAmount: string | number): string {
  try {
    const tronWeb = getTronWeb();
    if (!tronWeb) {
      // Manual conversion: 1 TRX = 1,000,000 SUN
      const trx = typeof trxAmount === 'string' ? parseFloat(trxAmount) : trxAmount;
      return Math.floor(trx * 1_000_000).toString();
    }
    return tronWeb.toSun(trxAmount).toString();
  } catch (error) {
    console.error('Failed to convert TRX to SUN:', error);
    throw new Error('Invalid TRX amount');
  }
}

/**
 * Convert SUN to TRX
 */
export function sunToTrx(sunAmount: string | number): string {
  try {
    const tronWeb = getTronWeb();
    const sun = typeof sunAmount === 'string' ? parseFloat(sunAmount) : sunAmount;
    
    if (!tronWeb) {
      // Manual conversion: 1 TRX = 1,000,000 SUN
      return (sun / 1_000_000).toString();
    }
    return tronWeb.fromSun(sun);
  } catch (error) {
    console.error('Failed to convert SUN to TRX:', error);
    return '0';
  }
}

/**
 * Common TRC-20 token addresses on TRON mainnet
 */
export const TRON_TOKENS = {
  USDT: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // Official USDT on TRON
  USDC: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', // Official USDC on TRON
  USDD: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', // TRON's stablecoin
  BTT: 'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4', // BitTorrent Token
  JST: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9', // JUST token
};
