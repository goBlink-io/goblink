/**
 * Unified Wallet Types and Interfaces
 * 
 * Provides chain-agnostic wallet abstractions for all supported blockchains.
 * Enables consistent wallet interactions regardless of underlying chain implementation.
 */

// ============================================================================
// Chain Types
// ============================================================================

export type SupportedChain = 
  | 'evm'       // Ethereum, Polygon, Arbitrum, Base, etc.
  | 'solana'    // Solana
  | 'near'      // NEAR Protocol
  | 'sui'       // Sui
  | 'stellar'   // Stellar
  | 'starknet'  // Starknet
  | 'ton'       // TON
  | 'tron'      // TRON
  | 'bitcoin';  // Bitcoin

export type EVMChain = 
  | 'ethereum'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'bnb'
  | 'avalanche'
  | 'aurora';

// ============================================================================
// Wallet Connection States
// ============================================================================

export type WalletConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error';

export interface WalletError {
  code: string;
  message: string;
  details?: any;
}

// ============================================================================
// Wallet Info
// ============================================================================

export interface WalletInfo {
  chain: SupportedChain;
  address: string;
  publicKey?: string;
  balance?: string;
  connectionState: WalletConnectionState;
  error?: WalletError;
}

// ============================================================================
// Balance Info
// ============================================================================

export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  contractAddress?: string;
  usdValue?: string;
}

export interface ChainBalance {
  chain: SupportedChain;
  nativeToken: TokenBalance;
  tokens: TokenBalance[];
  totalUsdValue?: string;
}

// ============================================================================
// Transaction Types
// ============================================================================

export type TransactionStatus = 
  | 'pending'
  | 'confirming'
  | 'confirmed'
  | 'failed';

export interface TransactionRequest {
  chain: SupportedChain;
  from: string;
  to: string;
  amount: string;
  token?: string; // Contract address or token identifier
  memo?: string;
  gasPrice?: string;
  gasLimit?: string;
}

export interface TransactionResult {
  hash: string;
  status: TransactionStatus;
  chain: SupportedChain;
  from: string;
  to: string;
  amount: string;
  token?: string;
  timestamp?: number;
  confirmations?: number;
  error?: WalletError;
}

// ============================================================================
// Unified Wallet Interface
// ============================================================================

export interface IUnifiedWallet {
  // Connection Management
  connect(chain: SupportedChain): Promise<void>;
  disconnect(chain: SupportedChain): Promise<void>;
  disconnectAll(): Promise<void>;
  
  // Wallet Info
  getWalletInfo(chain: SupportedChain): WalletInfo | null;
  getAllWallets(): WalletInfo[];
  isConnected(chain: SupportedChain): boolean;
  
  // Balance Queries
  getBalance(chain: SupportedChain, address?: string): Promise<string>;
  getTokenBalance(
    chain: SupportedChain, 
    tokenAddress: string, 
    address?: string
  ): Promise<string>;
  getAllBalances(chain: SupportedChain): Promise<ChainBalance>;
  
  // Transactions
  sendTransaction(request: TransactionRequest): Promise<TransactionResult>;
  signMessage(chain: SupportedChain, message: string): Promise<string>;
  
  // Utilities
  validateAddress(chain: SupportedChain, address: string): boolean;
  formatAmount(chain: SupportedChain, amount: string, decimals: number): string;
  parseAmount(chain: SupportedChain, amount: string, decimals: number): string;
}

// ============================================================================
// Chain-Specific Adapters
// ============================================================================

export interface ChainAdapter {
  chain: SupportedChain;
  
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getAddress(): string | null;
  getConnectionState(): WalletConnectionState;
  
  // Balances
  getNativeBalance(address?: string): Promise<string>;
  getTokenBalance(tokenAddress: string, address?: string): Promise<string>;
  
  // Transactions
  sendNative(to: string, amount: string, memo?: string): Promise<string>;
  sendToken(tokenAddress: string, to: string, amount: string): Promise<string>;
  waitForTransaction(txHash: string, timeout?: number): Promise<TransactionResult>;
  
  // Utilities
  validateAddress(address: string): boolean;
  formatAmount(amount: string, decimals: number): string;
  parseAmount(amount: string, decimals: number): string;
}

// ============================================================================
// Wallet Context State
// ============================================================================

export interface UnifiedWalletContextState {
  // Wallet Info
  wallets: Map<SupportedChain, WalletInfo>;
  
  // Connection Management
  connect: (chain: SupportedChain) => Promise<void>;
  disconnect: (chain: SupportedChain) => Promise<void>;
  disconnectAll: () => Promise<void>;
  
  // Queries
  getWallet: (chain: SupportedChain) => WalletInfo | null;
  isConnected: (chain: SupportedChain) => boolean;
  getConnectedChains: () => SupportedChain[];
  
  // Balance Queries
  getBalance: (chain: SupportedChain, address?: string) => Promise<string>;
  getTokenBalance: (chain: SupportedChain, tokenAddress: string, address?: string) => Promise<string>;
  getAllBalances: (chain: SupportedChain) => Promise<ChainBalance>;
  
  // Transactions
  sendTransaction: (request: TransactionRequest) => Promise<TransactionResult>;
  signMessage: (chain: SupportedChain, message: string) => Promise<string>;
  
  // Utilities
  validateAddress: (chain: SupportedChain, address: string) => boolean;
  formatAmount: (chain: SupportedChain, amount: string, decimals: number) => string;
  parseAmount: (chain: SupportedChain, amount: string, decimals: number) => string;
}

// ============================================================================
// Helper Types
// ============================================================================

export interface ChainConfig {
  chain: SupportedChain;
  name: string;
  nativeToken: string;
  explorer: string;
  rpcUrl?: string;
}

export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
  evm: {
    chain: 'evm',
    name: 'Ethereum',
    nativeToken: 'ETH',
    explorer: 'https://etherscan.io',
  },
  solana: {
    chain: 'solana',
    name: 'Solana',
    nativeToken: 'SOL',
    explorer: 'https://solscan.io',
  },
  near: {
    chain: 'near',
    name: 'NEAR',
    nativeToken: 'NEAR',
    explorer: 'https://nearblocks.io',
  },
  sui: {
    chain: 'sui',
    name: 'Sui',
    nativeToken: 'SUI',
    explorer: 'https://suiscan.xyz',
  },
  stellar: {
    chain: 'stellar',
    name: 'Stellar',
    nativeToken: 'XLM',
    explorer: 'https://stellar.expert',
  },
  starknet: {
    chain: 'starknet',
    name: 'Starknet',
    nativeToken: 'ETH',
    explorer: 'https://starkscan.co',
  },
  ton: {
    chain: 'ton',
    name: 'TON',
    nativeToken: 'TON',
    explorer: 'https://tonscan.org',
  },
  tron: {
    chain: 'tron',
    name: 'TRON',
    nativeToken: 'TRX',
    explorer: 'https://tronscan.org',
  },
  bitcoin: {
    chain: 'bitcoin',
    name: 'Bitcoin',
    nativeToken: 'BTC',
    explorer: 'https://blockstream.info',
  },
};
