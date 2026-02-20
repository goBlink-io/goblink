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
    this.jwtToken = process.env.INTENTS_EXPLORER_JWT?.trim() || null;
    this.client = axios.create({
      baseURL: INTENTS_EXPLORER_BASE_URL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
    if (this.jwtToken) {
      this.client.interceptors.request.use((config) => {
        config.headers.Authorization = `Bearer ${this.jwtToken}`;
        return config;
      });
    }
  }

  isConfigured(): boolean {
    return this.jwtToken !== null && this.jwtToken.length > 0;
  }

  async getTransactions(params?: {
    numberOfTransactions?: number;
    search?: string;
    [key: string]: unknown;
  }): Promise<TransactionsResponse> {
    if (!this.isConfigured()) {
      throw new Error('Intents Explorer JWT not configured');
    }
    const response = await this.client.get<TransactionsResponse>('/api/v0/transactions', {
      params: params || {},
    });
    return response.data;
  }

  async getTransactionByDepositAddress(depositAddress: string): Promise<Transaction | null> {
    if (!this.isConfigured()) {
      throw new Error('Intents Explorer JWT not configured');
    }
    const response = await this.getTransactions({
      search: depositAddress,
      numberOfTransactions: 10,
    });
    const transactions = Array.isArray(response)
      ? response
      : response?.transactions || [];
    return transactions.find(
      (tx: Transaction) => tx.depositAddress === depositAddress || tx.depositAddressAndMemo === depositAddress
    ) || null;
  }
}

export const intentsExplorer = new IntentsExplorerService();
export type { Transaction, TransactionsResponse };
