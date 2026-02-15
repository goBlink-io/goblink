/**
 * Near Intents Explorer API Service
 * Documentation: https://docs.near-intents.org/near-intents/integration/distribution-channels/intents-explorer-api
 */


import axios, { AxiosInstance } from 'axios';

const INTENTS_EXPLORER_BASE_URL = 'https://explorer.near-intents.org';

interface Transaction {
  depositAddress: string;
  depositAddressAndMemo: string;
  originAsset: string;
  destinationAsset: string;
  amountIn: string;
  amountOut: string | null;
  recipient: string;
  refundTo: string;
  status: string;
  depositTxHash: string | null;
  fulfillmentTxHash: string | null;
  refundTxHash: string | null;
  createdAt: string;
  updatedAt: string;
  referral: string | null;
  affiliate: string | null;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    hasMore: boolean;
    lastDepositAddressAndMemo: string | null;
    lastDepositAddress: string | null;
  };
}

class IntentsExplorerService {
  private client: AxiosInstance;
  private jwtToken: string | null;

  constructor() {
    this.jwtToken = process.env.INTENTS_EXPLORER_JWT || null;
    
    this.client = axios.create({
      baseURL: INTENTS_EXPLORER_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add JWT token to all requests if available
    if (this.jwtToken) {
      this.client.interceptors.request.use((config) => {
        config.headers.Authorization = `Bearer ${this.jwtToken}`;
        return config;
      });
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return this.jwtToken !== null && this.jwtToken.length > 0;
  }

  /**
   * Get transactions with optional filters
   */
  async getTransactions(params?: {
    numberOfTransactions?: number;
    lastDepositAddressAndMemo?: string;
    lastDepositAddress?: string;
    direction?: 'next' | 'prev';
    search?: string; // Search by deposit address, recipient, sender, or tx hash
    fromChainId?: string;
    fromTokenId?: string;
    toChainId?: string;
    toTokenId?: string;
    referral?: string;
    affiliate?: string;
    statuses?: string[];
    minUsdPrice?: number;
    maxUsdPrice?: number;
    endTimestamp?: string;
    endTimestampUnix?: number;
    startTimestamp?: string;
    startTimestampUnix?: number;
  }): Promise<TransactionsResponse> {
    if (!this.isConfigured()) {
      throw new Error('Intents Explorer JWT token not configured. Please set INTENTS_EXPLORER_JWT environment variable.');
    }

    try {
      const queryParams: any = {};
      
      if (params) {
        if (params.numberOfTransactions) queryParams.numberOfTransactions = params.numberOfTransactions;
        if (params.lastDepositAddressAndMemo) queryParams.lastDepositAddressAndMemo = params.lastDepositAddressAndMemo;
        if (params.lastDepositAddress) queryParams.lastDepositAddress = params.lastDepositAddress;
        if (params.direction) queryParams.direction = params.direction;
        if (params.search) queryParams.search = params.search; // Search parameter for deposit address, recipient, sender, or tx hash
        if (params.fromChainId) queryParams.fromChainId = params.fromChainId;
        if (params.fromTokenId) queryParams.fromTokenId = params.fromTokenId;
        if (params.toChainId) queryParams.toChainId = params.toChainId;
        if (params.toTokenId) queryParams.toTokenId = params.toTokenId;
        if (params.referral) queryParams.referral = params.referral;
        if (params.affiliate) queryParams.affiliate = params.affiliate;
        if (params.statuses) queryParams.statuses = params.statuses.join(',');
        if (params.minUsdPrice !== undefined) queryParams.minUsdPrice = params.minUsdPrice;
        if (params.maxUsdPrice !== undefined) queryParams.maxUsdPrice = params.maxUsdPrice;
        if (params.endTimestamp) queryParams.endTimestamp = params.endTimestamp;
        if (params.endTimestampUnix !== undefined) queryParams.endTimestampUnix = params.endTimestampUnix;
        if (params.startTimestamp) queryParams.startTimestamp = params.startTimestamp;
        if (params.startTimestampUnix !== undefined) queryParams.startTimestampUnix = params.startTimestampUnix;
      }

      const response = await this.client.get<TransactionsResponse>('/api/v0/transactions', {
        params: queryParams,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid or expired Intents Explorer JWT token. Please update INTENTS_EXPLORER_JWT environment variable.');
      }
      
      console.error('Error fetching transactions from Intents Explorer:', error.message);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  /**
   * Get transaction status by deposit address
   * Uses the search parameter to directly find the transaction by deposit address
   */
  async getTransactionByDepositAddress(depositAddress: string): Promise<Transaction | null> {
    if (!this.isConfigured()) {
      throw new Error('Intents Explorer JWT token not configured. Please set INTENTS_EXPLORER_JWT environment variable.');
    }

    try {
      console.log(`Searching for transaction with deposit address: ${depositAddress}`);
      
      // Use the search parameter to directly search by deposit address
      // This is much more efficient than paginating through all transactions
      const response = await this.getTransactions({
        search: depositAddress, // Search by deposit address, recipient, sender, or tx hash
        numberOfTransactions: 10, // Limit results, should only return 1 match
      });

      // Handle response - API returns array directly OR wrapped in transactions property
      let transactions: any[];
      if (Array.isArray(response)) {
        transactions = response;
      } else if (response && response.transactions && Array.isArray(response.transactions)) {
        transactions = response.transactions;
      } else {
        console.warn('Invalid response from Intents Explorer API:', response);
        return null;
      }

      console.log(`Search returned ${transactions.length} transaction(s)`);

      // The search should return the matching transaction directly
      // Find exact match for deposit address or depositAddressAndMemo
      const transaction = transactions.find(
        (tx) => tx.depositAddress === depositAddress || tx.depositAddressAndMemo === depositAddress
      );

      if (transaction) {
        console.log('Transaction found:', {
          depositAddress: transaction.depositAddress,
          status: transaction.status,
          createdAt: transaction.createdAt,
        });
        return transaction;
      }

      console.log('No matching transaction found for deposit address');
      return null;
    } catch (error: any) {
      console.error('Error fetching transaction by deposit address:', error.message);
      throw error;
    }
  }

  /**
   * Get transactions filtered by referral code
   * Useful for tracking your application's transactions
   */
  async getTransactionsByReferral(referral: string, limit: number = 50): Promise<Transaction[]> {
    const response = await this.getTransactions({
      numberOfTransactions: limit,
      referral,
    });
    
    return response.transactions;
  }

  /**
   * Get transactions filtered by affiliate code
   */
  async getTransactionsByAffiliate(affiliate: string, limit: number = 50): Promise<Transaction[]> {
    const response = await this.getTransactions({
      numberOfTransactions: limit,
      affiliate,
    });
    
    return response.transactions;
  }

  /**
   * Get transactions filtered by status
   */
  async getTransactionsByStatus(statuses: string[], limit: number = 50): Promise<Transaction[]> {
    const response = await this.getTransactions({
      numberOfTransactions: limit,
      statuses,
    });
    
    return response.transactions;
  }
}

// Export singleton instance
export const intentsExplorer = new IntentsExplorerService();

// Export types
export type { Transaction, TransactionsResponse };
