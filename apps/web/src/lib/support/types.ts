// ── Support Bot Types ──

export interface AppState {
  // Wallet state
  connectedWallets: Array<{
    chain: string; // 'evm' | 'solana' | 'near' | 'sui' | 'aptos' | 'starknet' | 'ton' | 'tron'
    address: string;
    isConnected: boolean;
  }>;
  hasAnyWallet: boolean;
  
  // Form state
  fromChain: string | null;
  toChain: string | null;
  fromToken: string | null;
  toToken: string | null;
  amount: string | null;
  recipient: string | null;
  
  // Quote state
  quoteStatus: 'idle' | 'loading' | 'success' | 'error' | 'expired';
  quoteError: string | null;
  
  // Transaction state
  txStatus: 'idle' | 'pending' | 'confirming' | 'completed' | 'failed' | 'refunded';
  txError: string | null;
  depositAddress: string | null;
  txStartedAt: number | null;
  
  // Balance info (if available)
  insufficientBalance: boolean;
  userBalance: string | null;
  requiredAmount: string | null;
  
  // Environment
  isMobile: boolean;
  detectedWalletExtensions: string[]; // ['metamask', 'phantom', etc.]
  
  // Error history
  recentErrors: Array<{ message: string; timestamp: number; context: string }>;
}

export interface SupportMessage {
  text: string;
  actions?: Array<{
    label: string;
    action: 'connect-wallet' | 'switch-network' | 'open-link' | 'retry' | 'copy';
    data?: string;
  }>;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface SupportRule {
  id: string;
  priority: number;
  condition: (state: AppState) => boolean;
  response: (state: AppState) => SupportMessage;
  proactive: boolean; // Can this appear without user asking?
  category: 'wallet' | 'swap' | 'transaction' | 'general';
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  severity?: 'info' | 'warning' | 'error' | 'success';
  actions?: Array<{
    label: string;
    action: string;
    data?: string;
  }>;
}
