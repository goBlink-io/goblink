/**
 * Stellar Transaction Service
 *
 * Provides utilities for interacting with the Stellar network:
 * - Balance fetching (XLM and assets)
 * - XLM transfers
 * - Asset transfers
 * - Transaction building and signing
 * - Transaction confirmation tracking
 */

import * as StellarSdk from '@stellar/stellar-sdk';

// Stellar Server configuration
const HORIZON_URL = 'https://horizon.stellar.org'; // Mainnet
// const HORIZON_URL = 'https://horizon-testnet.stellar.org'; // Testnet

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Get XLM balance for an account
 */
export async function getXLMBalance(publicKey: string): Promise<string> {
  try {
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find(
      (balance: any) => balance.asset_type === 'native'
    );
    return xlmBalance ? xlmBalance.balance : '0';
  } catch (error) {
    console.error('Error fetching XLM balance:', error);
    throw new Error('Failed to fetch XLM balance');
  }
}

/**
 * Get asset balance for an account
 */
export async function getAssetBalance(
  publicKey: string,
  assetCode: string,
  assetIssuer: string
): Promise<string> {
  try {
    const account = await server.loadAccount(publicKey);
    const assetBalance = account.balances.find(
      (balance: any) =>
        balance.asset_code === assetCode &&
        balance.asset_issuer === assetIssuer
    );
    return assetBalance ? assetBalance.balance : '0';
  } catch (error) {
    console.error('Error fetching asset balance:', error);
    throw new Error(`Failed to fetch ${assetCode} balance`);
  }
}

/**
 * Get all balances for an account
 */
export async function getAllBalances(publicKey: string): Promise<any[]> {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances;
  } catch (error) {
    console.error('Error fetching all balances:', error);
    throw new Error('Failed to fetch account balances');
  }
}

/**
 * Build an XLM payment transaction
 */
export async function buildXLMPayment(
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string,
  memo?: string
): Promise<StellarSdk.Transaction> {
  try {
    const sourceAccount = await server.loadAccount(sourcePublicKey);
    
    let transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          asset: StellarSdk.Asset.native(),
          amount: amount,
        })
      )
      .setTimeout(180);

    // Add memo if provided
    if (memo) {
      transaction = transaction.addMemo(StellarSdk.Memo.text(memo));
    }

    return transaction.build();
  } catch (error) {
    console.error('Error building XLM payment:', error);
    throw new Error('Failed to build XLM payment transaction');
  }
}

/**
 * Build an asset payment transaction
 */
export async function buildAssetPayment(
  sourcePublicKey: string,
  destinationPublicKey: string,
  assetCode: string,
  assetIssuer: string,
  amount: string,
  memo?: string
): Promise<StellarSdk.Transaction> {
  try {
    const sourceAccount = await server.loadAccount(sourcePublicKey);
    const asset = new StellarSdk.Asset(assetCode, assetIssuer);
    
    let transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          asset: asset,
          amount: amount,
        })
      )
      .setTimeout(180);

    // Add memo if provided
    if (memo) {
      transaction = transaction.addMemo(StellarSdk.Memo.text(memo));
    }

    return transaction.build();
  } catch (error) {
    console.error('Error building asset payment:', error);
    throw new Error(`Failed to build ${assetCode} payment transaction`);
  }
}

/**
 * Submit a signed transaction to the network
 */
export async function submitTransaction(
  signedTransaction: StellarSdk.Transaction
): Promise<any> {
  try {
    const result = await server.submitTransaction(signedTransaction);
    return result;
  } catch (error: any) {
    console.error('Error submitting transaction:', error);
    if (error.response?.data?.extras) {
      throw new Error(
        `Transaction failed: ${JSON.stringify(error.response.data.extras)}`
      );
    }
    throw new Error('Failed to submit transaction');
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  txHash: string,
  maxAttempts: number = 30
): Promise<any> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const transaction = await server.transactions().transaction(txHash).call();
      if (transaction) {
        return transaction;
      }
    } catch (error) {
      // Transaction not found yet, keep polling
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    attempts++;
  }
  
  throw new Error('Transaction confirmation timeout');
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(txHash: string): Promise<any> {
  try {
    const transaction = await server.transactions().transaction(txHash).call();
    return {
      hash: transaction.hash,
      successful: transaction.successful,
      ledger: transaction.ledger_attr,
      createdAt: transaction.created_at,
      feePaid: transaction.fee_paid,
      operationCount: transaction.operation_count,
    };
  } catch (error) {
    console.error('Error fetching transaction status:', error);
    throw new Error('Failed to fetch transaction status');
  }
}

/**
 * Check if an account exists on the network
 */
export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    await server.loadAccount(publicKey);
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Get minimum account balance (base reserve)
 */
export async function getMinimumBalance(): Promise<string> {
  try {
    // Stellar requires a minimum balance of 1 XLM (base reserve)
    // Plus 0.5 XLM for each trustline
    return '1';
  } catch (error) {
    console.error('Error fetching minimum balance:', error);
    return '1'; // Default base reserve
  }
}

/**
 * Parse amount from stroops (smallest unit) to XLM
 */
export function parseAmount(stroops: string): string {
  return (parseFloat(stroops) / 10000000).toFixed(7);
}

/**
 * Format amount from XLM to stroops (smallest unit)
 */
export function formatAmount(xlm: string): string {
  return (parseFloat(xlm) * 10000000).toFixed(0);
}

/**
 * Validate Stellar address format
 */
export function validateAddress(address: string): boolean {
  try {
    StellarSdk.StrKey.decodeEd25519PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get asset info from asset ID
 * Asset ID format: "CODE:ISSUER" or "native" for XLM
 */
export function parseAssetId(assetId: string): {
  code: string;
  issuer: string | null;
  asset: StellarSdk.Asset;
} {
  if (assetId === 'native' || assetId === 'XLM') {
    return {
      code: 'XLM',
      issuer: null,
      asset: StellarSdk.Asset.native(),
    };
  }

  const [code, issuer] = assetId.split(':');
  if (!code || !issuer) {
    throw new Error('Invalid asset ID format. Expected "CODE:ISSUER"');
  }

  return {
    code,
    issuer,
    asset: new StellarSdk.Asset(code, issuer),
  };
}

/**
 * Get account details including sequence number
 */
export async function getAccountDetails(publicKey: string): Promise<any> {
  try {
    const account = await server.loadAccount(publicKey);
    return {
      accountId: account.accountId(),
      sequence: account.sequence,
      balances: account.balances,
      signers: account.signers,
      subentryCount: account.subentry_count,
    };
  } catch (error) {
    console.error('Error fetching account details:', error);
    throw new Error('Failed to fetch account details');
  }
}

/**
 * Estimate transaction fee
 */
export async function estimateFee(): Promise<string> {
  try {
    // Stellar uses a fixed base fee
    // Current base fee is 100 stroops (0.00001 XLM)
    return parseAmount(StellarSdk.BASE_FEE);
  } catch (error) {
    console.error('Error estimating fee:', error);
    return '0.00001'; // Default base fee
  }
}

/**
 * Check if account has trustline for asset
 */
export async function hasTrustline(
  publicKey: string,
  assetCode: string,
  assetIssuer: string
): Promise<boolean> {
  try {
    const account = await server.loadAccount(publicKey);
    const trustline = account.balances.find(
      (balance: any) =>
        balance.asset_code === assetCode &&
        balance.asset_issuer === assetIssuer
    );
    return !!trustline;
  } catch (error) {
    console.error('Error checking trustline:', error);
    return false;
  }
}

/**
 * Build trustline operation
 */
export async function buildChangeTrust(
  sourcePublicKey: string,
  assetCode: string,
  assetIssuer: string,
  limit?: string
): Promise<StellarSdk.Transaction> {
  try {
    const sourceAccount = await server.loadAccount(sourcePublicKey);
    const asset = new StellarSdk.Asset(assetCode, assetIssuer);
    
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: asset,
          limit: limit, // undefined = maximum limit
        })
      )
      .setTimeout(180)
      .build();

    return transaction;
  } catch (error) {
    console.error('Error building change trust operation:', error);
    throw new Error('Failed to build trustline transaction');
  }
}

export default {
  getXLMBalance,
  getAssetBalance,
  getAllBalances,
  buildXLMPayment,
  buildAssetPayment,
  submitTransaction,
  waitForTransaction,
  getTransactionStatus,
  accountExists,
  getMinimumBalance,
  parseAmount,
  formatAmount,
  validateAddress,
  parseAssetId,
  getAccountDetails,
  estimateFee,
  hasTrustline,
  buildChangeTrust,
};
