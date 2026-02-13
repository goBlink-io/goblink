import * as db from '../db';
import { SwapStatus } from '@sapphire/shared';

export interface Transaction {
  id: number;
  session_id: string;
  origin_asset: string;
  destination_asset: string;
  amount: string;
  deposit_address: string | null;
  recipient: string;
  refund_to: string;
  status: SwapStatus;
  quote_details: any;
  app_fee_bps: number;
  user_ip: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface StatusHistoryEntry {
  id: number;
  transaction_id: number;
  status: SwapStatus;
  metadata: any;
  timestamp: Date;
}

/**
 * Create a new transaction record
 */
export const createTransaction = async (data: {
  sessionId: string;
  originAsset: string;
  destinationAsset: string;
  amount: string;
  recipient: string;
  refundTo: string;
  quoteDetails?: any;
  appFeeBps: number;
  userIp?: string;
  userAgent?: string;
}): Promise<Transaction> => {
  const result = await db.query(
    `INSERT INTO transactions (
      session_id, origin_asset, destination_asset, amount,
      recipient, refund_to, status, quote_details, app_fee_bps,
      user_ip, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      data.sessionId,
      data.originAsset,
      data.destinationAsset,
      data.amount,
      data.recipient,
      data.refundTo,
      'PENDING_QUOTE',
      data.quoteDetails || null,
      data.appFeeBps,
      data.userIp || null,
      data.userAgent || null,
    ]
  );

  const transaction = result.rows[0];
  
  // Create initial status history entry
  await addStatusHistory(transaction.id, 'PENDING_QUOTE', { message: 'Transaction created' });

  return transaction;
};

/**
 * Update transaction with deposit address and quote details
 */
export const updateTransactionWithQuote = async (
  sessionId: string,
  depositAddress: string,
  quoteDetails: any
): Promise<Transaction | null> => {
  const result = await db.query(
    `UPDATE transactions
    SET deposit_address = $1, quote_details = $2, status = $3
    WHERE session_id = $4
    RETURNING *`,
    [depositAddress, quoteDetails, 'PENDING_DEPOSIT', sessionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const transaction = result.rows[0];
  await addStatusHistory(transaction.id, 'PENDING_DEPOSIT', { 
    message: 'Quote received, waiting for deposit',
    depositAddress 
  });

  return transaction;
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (
  sessionId: string,
  status: SwapStatus,
  metadata?: any
): Promise<Transaction | null> => {
  const result = await db.query(
    `UPDATE transactions
    SET status = $1
    WHERE session_id = $2
    RETURNING *`,
    [status, sessionId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const transaction = result.rows[0];
  await addStatusHistory(transaction.id, status, metadata);

  return transaction;
};

/**
 * Update transaction status by deposit address
 */
export const updateTransactionStatusByDepositAddress = async (
  depositAddress: string,
  status: SwapStatus,
  metadata?: any
): Promise<Transaction | null> => {
  const result = await db.query(
    `UPDATE transactions
    SET status = $1
    WHERE deposit_address = $2
    RETURNING *`,
    [status, depositAddress]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const transaction = result.rows[0];
  await addStatusHistory(transaction.id, status, metadata);

  return transaction;
};

/**
 * Get transaction by session ID
 */
export const getTransactionBySessionId = async (sessionId: string): Promise<Transaction | null> => {
  const result = await db.query(
    'SELECT * FROM transactions WHERE session_id = $1',
    [sessionId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Get transaction by deposit address
 */
export const getTransactionByDepositAddress = async (depositAddress: string): Promise<Transaction | null> => {
  const result = await db.query(
    'SELECT * FROM transactions WHERE deposit_address = $1',
    [depositAddress]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Get all transactions (with pagination)
 */
export const getAllTransactions = async (
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> => {
  const result = await db.query(
    'SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  return result.rows;
};

/**
 * Get transactions by status
 */
export const getTransactionsByStatus = async (
  status: SwapStatus,
  limit: number = 50
): Promise<Transaction[]> => {
  const result = await db.query(
    'SELECT * FROM transactions WHERE status = $1 ORDER BY created_at DESC LIMIT $2',
    [status, limit]
  );

  return result.rows;
};

/**
 * Add status history entry
 */
export const addStatusHistory = async (
  transactionId: number,
  status: SwapStatus,
  metadata?: any
): Promise<StatusHistoryEntry> => {
  const result = await db.query(
    'INSERT INTO status_history (transaction_id, status, metadata) VALUES ($1, $2, $3) RETURNING *',
    [transactionId, status, metadata || null]
  );

  return result.rows[0];
};

/**
 * Get status history for a transaction
 */
export const getStatusHistory = async (transactionId: number): Promise<StatusHistoryEntry[]> => {
  const result = await db.query(
    'SELECT * FROM status_history WHERE transaction_id = $1 ORDER BY timestamp ASC',
    [transactionId]
  );

  return result.rows;
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async () => {
  const result = await db.query(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as count_24h
    FROM transactions
    GROUP BY status
  `);

  return result.rows;
};

export default {
  createTransaction,
  updateTransactionWithQuote,
  updateTransactionStatus,
  updateTransactionStatusByDepositAddress,
  getTransactionBySessionId,
  getTransactionByDepositAddress,
  getAllTransactions,
  getTransactionsByStatus,
  addStatusHistory,
  getStatusHistory,
  getTransactionStats,
};
