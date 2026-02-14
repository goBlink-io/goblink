import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SendOptions,
  Commitment,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { WalletContextState } from '@solana/wallet-adapter-react';

const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
const COMMITMENT: Commitment = 'confirmed';

/**
 * Solana Transaction Service
 * Handles balance fetching, transaction building, and execution for Solana blockchain
 */

export interface SolBalance {
  balance: number; // In SOL
  lamports: number; // In lamports (1 SOL = 10^9 lamports)
}

export interface SPLBalance {
  balance: string; // In smallest unit
  decimals: number;
  uiAmount: number; // Human-readable amount
}

export interface TransactionResult {
  success: boolean;
  signature: string;
  error?: string;
}

/**
 * Get connection to Solana RPC
 */
function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, COMMITMENT);
}

/**
 * Get SOL balance for an account
 */
export async function getSOLBalance(publicKey: PublicKey): Promise<SolBalance> {
  try {
    const connection = getConnection();
    const lamports = await connection.getBalance(publicKey);
    
    return {
      balance: lamports / LAMPORTS_PER_SOL,
      lamports,
    };
  } catch (error) {
    console.error('Failed to fetch SOL balance:', error);
    throw new Error('Failed to fetch SOL balance');
  }
}

/**
 * Get SPL token balance for an account
 */
export async function getSPLBalance(
  ownerPublicKey: PublicKey,
  mintAddress: string
): Promise<SPLBalance> {
  try {
    const connection = getConnection();
    const mintPublicKey = new PublicKey(mintAddress);
    
    // Get associated token address
    const tokenAddress = await getAssociatedTokenAddress(
      mintPublicKey,
      ownerPublicKey
    );

    // Get token account
    const tokenAccount = await getAccount(connection, tokenAddress);

    // Get mint info for decimals
    const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
    const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals || 9;

    return {
      balance: tokenAccount.amount.toString(),
      decimals,
      uiAmount: Number(tokenAccount.amount) / Math.pow(10, decimals),
    };
  } catch (error) {
    console.error('Failed to fetch SPL balance:', error);
    // Return zero balance if account doesn't exist
    return {
      balance: '0',
      decimals: 9,
      uiAmount: 0,
    };
  }
}

/**
 * Transfer SOL tokens
 */
export async function transferSOL(
  wallet: WalletContextState,
  toPublicKey: PublicKey,
  amount: number // Amount in SOL
): Promise<TransactionResult> {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    const connection = getConnection();
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: toPublicKey,
        lamports,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign transaction
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    // Confirm transaction
    await connection.confirmTransaction(signature, COMMITMENT);

    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('SOL transfer failed:', error);
    return {
      success: false,
      signature: '',
      error: error.message || 'Transfer failed',
    };
  }
}

/**
 * Transfer SPL tokens
 */
export async function transferSPL(
  wallet: WalletContextState,
  mintAddress: string,
  toPublicKey: PublicKey,
  amount: string, // Amount in smallest unit
  decimals: number = 9
): Promise<TransactionResult> {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    const connection = getConnection();
    const mintPublicKey = new PublicKey(mintAddress);

    // Get source token account
    const sourceTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      wallet.publicKey
    );

    // Get destination token account
    const destinationTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      toPublicKey
    );

    const transaction = new Transaction();

    // Check if destination token account exists
    const destAccountInfo = await connection.getAccountInfo(destinationTokenAccount);
    
    if (!destAccountInfo) {
      // Create associated token account for destination
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          destinationTokenAccount, // associatedToken
          toPublicKey, // owner
          mintPublicKey // mint
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount,
        wallet.publicKey,
        BigInt(amount)
      )
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign transaction
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    // Confirm transaction
    await connection.confirmTransaction(signature, COMMITMENT);

    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('SPL transfer failed:', error);
    return {
      success: false,
      signature: '',
      error: error.message || 'Transfer failed',
    };
  }
}

/**
 * Check if an account has an SPL token account
 */
export async function hasTokenAccount(
  ownerPublicKey: PublicKey,
  mintAddress: string
): Promise<boolean> {
  try {
    const connection = getConnection();
    const mintPublicKey = new PublicKey(mintAddress);
    
    const tokenAddress = await getAssociatedTokenAddress(
      mintPublicKey,
      ownerPublicKey
    );

    const accountInfo = await connection.getAccountInfo(tokenAddress);
    return accountInfo !== null;
  } catch (error) {
    console.error('Failed to check token account:', error);
    return false;
  }
}

/**
 * Create associated token account for an owner
 */
export async function createTokenAccount(
  wallet: WalletContextState,
  mintAddress: string,
  ownerPublicKey?: PublicKey
): Promise<TransactionResult> {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    const connection = getConnection();
    const mintPublicKey = new PublicKey(mintAddress);
    const owner = ownerPublicKey || wallet.publicKey;

    // Get associated token address
    const tokenAddress = await getAssociatedTokenAddress(
      mintPublicKey,
      owner
    );

    // Create transaction
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey, // payer
        tokenAddress, // associatedToken
        owner, // owner
        mintPublicKey // mint
      )
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign transaction
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    // Confirm transaction
    await connection.confirmTransaction(signature, COMMITMENT);

    return {
      success: true,
      signature,
    };
  } catch (error: any) {
    console.error('Create token account failed:', error);
    return {
      success: false,
      signature: '',
      error: error.message || 'Failed to create token account',
    };
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForConfirmation(
  signature: string,
  commitment: Commitment = 'confirmed',
  timeout: number = 30000
): Promise<boolean> {
  try {
    const connection = getConnection();
    
    const result = await connection.confirmTransaction(
      signature,
      commitment
    );

    return !result.value.err;
  } catch (error) {
    console.error('Transaction confirmation failed:', error);
    return false;
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(signature: string): Promise<{
  confirmed: boolean;
  error?: string;
}> {
  try {
    const connection = getConnection();
    const status = await connection.getSignatureStatus(signature);

    if (status.value === null) {
      return { confirmed: false };
    }

    if (status.value.err) {
      return {
        confirmed: false,
        error: JSON.stringify(status.value.err),
      };
    }

    return {
      confirmed: status.value.confirmationStatus === 'confirmed' ||
                 status.value.confirmationStatus === 'finalized',
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    return { confirmed: false, error: 'Failed to fetch status' };
  }
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

/**
 * Get SPL token mint info
 */
export async function getTokenMintInfo(mintAddress: string): Promise<{
  decimals: number;
  supply: string;
} | null> {
  try {
    const connection = getConnection();
    const mintPublicKey = new PublicKey(mintAddress);
    const mintInfo = await connection.getParsedAccountInfo(mintPublicKey);
    
    if (!mintInfo.value) return null;

    const data = (mintInfo.value.data as any).parsed.info;
    return {
      decimals: data.decimals,
      supply: data.supply,
    };
  } catch (error) {
    console.error('Failed to get mint info:', error);
    return null;
  }
}

/**
 * Estimate transaction fee
 */
export async function estimateTransactionFee(
  transaction: Transaction
): Promise<number> {
  try {
    const connection = getConnection();
    const fee = await connection.getFeeForMessage(
      transaction.compileMessage(),
      COMMITMENT
    );
    
    return fee.value || 5000; // Default to 5000 lamports (~0.000005 SOL)
  } catch (error) {
    console.error('Failed to estimate fee:', error);
    return 5000;
  }
}
