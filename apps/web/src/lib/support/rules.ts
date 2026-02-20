// ── goBlink Support Rules Engine ──
// CRITICAL: Never mention "NEAR Intents", "1Click", "defuse", "solver", "intent", or underlying infrastructure.
// Always say "goBlink", "goBlink's network", "goBlink's transfer system", etc.

import { AppState, SupportRule, SupportMessage } from './types';

// ── Helper: Get wallet info for a chain type ──
const getWalletForChainType = (state: AppState, chainType: string): string | null => {
  const wallet = state.connectedWallets.find(w => w.chain === chainType);
  return wallet ? wallet.address : null;
};

// ── Helper: Get chain type from chain ID ──
const getChainType = (chainId: string | null): string => {
  if (!chainId) return '';
  
  const evmChains = ['ethereum', 'arbitrum', 'base', 'bsc', 'polygon', 'optimism', 'berachain', 'monad'];
  if (evmChains.includes(chainId)) return 'evm';
  if (chainId === 'solana') return 'solana';
  if (chainId === 'near') return 'near';
  if (chainId === 'sui') return 'sui';
  if (chainId === 'aptos') return 'aptos';
  if (chainId === 'starknet') return 'starknet';
  if (chainId === 'ton') return 'ton';
  if (chainId === 'tron') return 'tron';
  return '';
};

// ── Helper: Get wallet name for chain ──
const getWalletName = (chainType: string): string => {
  switch (chainType) {
    case 'evm': return 'MetaMask or another Ethereum wallet';
    case 'solana': return 'Phantom or another Solana wallet';
    case 'near': return 'NEAR Wallet';
    case 'sui': return 'Sui Wallet';
    case 'aptos': return 'Petra or another Aptos wallet';
    case 'starknet': return 'Argent or Braavos';
    case 'ton': return 'TON Wallet';
    case 'tron': return 'TronLink';
    default: return 'a compatible wallet';
  }
};

// ── Helper: Get DEX suggestion for same-chain swaps ──
const getDexSuggestion = (chainId: string): string => {
  switch (chainId) {
    case 'ethereum': return 'Uniswap';
    case 'arbitrum': return 'Camelot or Uniswap';
    case 'base': return 'Aerodrome or Uniswap';
    case 'bsc': return 'PancakeSwap';
    case 'polygon': return 'QuickSwap';
    case 'optimism': return 'Velodrome or Uniswap';
    case 'solana': return 'Jupiter';
    case 'near': return 'Ref Finance';
    case 'sui': return 'Cetus or Turbos';
    case 'aptos': return 'Liquidswap or PancakeSwap';
    default: return 'a DEX on that chain';
  }
};

// ── Support Rules ──
export const SUPPORT_RULES: SupportRule[] = [
  // ═════════════════════════════════════════════════════════════════
  // WALLET RULES (Priority 100-199)
  // ═════════════════════════════════════════════════════════════════
  
  {
    id: 'no-wallet-with-amount',
    priority: 100,
    category: 'wallet',
    proactive: true,
    condition: (state) => !state.hasAnyWallet && !!state.amount && parseFloat(state.amount) > 0,
    response: () => ({
      text: "Connect a wallet to start transferring. goBlink supports MetaMask, Phantom, Sui Wallet, and 300+ others.",
      actions: [
        { label: 'Connect Wallet', action: 'connect-wallet' }
      ],
      severity: 'info'
    })
  },
  
  {
    id: 'wrong-wallet-type',
    priority: 110,
    category: 'wallet',
    proactive: true,
    condition: (state) => {
      if (!state.fromChain || !state.hasAnyWallet) return false;
      const chainType = getChainType(state.fromChain);
      const hasWallet = getWalletForChainType(state, chainType);
      return !hasWallet && state.connectedWallets.length > 0;
    },
    response: (state) => {
      const chainType = getChainType(state.fromChain!);
      const walletName = getWalletName(chainType);
      const connectedType = state.connectedWallets[0].chain;
      const connectedName = getWalletName(connectedType);
      
      return {
        text: `You're connected with ${connectedName} but selected ${state.fromChain} as source. Connect ${walletName} or switch your source chain.`,
        actions: [
          { label: 'Connect Wallet', action: 'connect-wallet' }
        ],
        severity: 'warning'
      };
    }
  },
  
  {
    id: 'no-wallet-for-source',
    priority: 115,
    category: 'wallet',
    proactive: false,
    condition: (state) => {
      if (!state.fromChain) return false;
      const chainType = getChainType(state.fromChain);
      return !getWalletForChainType(state, chainType);
    },
    response: (state) => {
      const chainType = getChainType(state.fromChain!);
      const walletName = getWalletName(chainType);
      
      let setupLink = '';
      switch (chainType) {
        case 'evm': setupLink = 'https://metamask.io/download/'; break;
        case 'solana': setupLink = 'https://phantom.app/'; break;
        case 'sui': setupLink = 'https://suiwallet.com/'; break;
        case 'aptos': setupLink = 'https://petra.app/'; break;
        case 'starknet': setupLink = 'https://www.argent.xyz/'; break;
        case 'ton': setupLink = 'https://tonkeeper.com/'; break;
        case 'tron': setupLink = 'https://www.tronlink.org/'; break;
      }
      
      return {
        text: `To transfer from ${state.fromChain}, you need ${walletName}. ${setupLink ? 'Click below to get started.' : 'Connect a compatible wallet to continue.'}`,
        actions: setupLink ? [
          { label: 'Get Wallet', action: 'open-link', data: setupLink },
          { label: 'Connect Wallet', action: 'connect-wallet' }
        ] : [
          { label: 'Connect Wallet', action: 'connect-wallet' }
        ],
        severity: 'info'
      };
    }
  },
  
  // ═════════════════════════════════════════════════════════════════
  // SWAP/QUOTE RULES (Priority 200-299)
  // ═════════════════════════════════════════════════════════════════
  
  {
    id: 'insufficient-balance',
    priority: 200,
    category: 'swap',
    proactive: true,
    condition: (state) => state.insufficientBalance,
    response: (state) => {
      const balanceText = state.userBalance || 'insufficient';
      const requiredText = state.requiredAmount || state.amount || 'the required amount';
      
      return {
        text: `You have ${balanceText} but this transfer needs ${requiredText} plus gas fees for network fees.`,
        severity: 'error'
      };
    }
  },
  
  {
    id: 'quote-loading-long',
    priority: 210,
    category: 'swap',
    proactive: true,
    condition: (state) => state.quoteStatus === 'loading',
    response: () => ({
      text: "Still finding the best rate for your transfer. Cross-chain quotes can take a moment...",
      severity: 'info'
    })
  },
  
  {
    id: 'quote-error',
    priority: 220,
    category: 'swap',
    proactive: true,
    condition: (state) => state.quoteStatus === 'error',
    response: (state) => {
      let text = "We couldn't get a quote for this transfer. ";
      
      // Parse common errors
      if (state.quoteError) {
        const err = state.quoteError.toLowerCase();
        if (err.includes('insufficient liquidity') || err.includes('no route')) {
          text = "There's not enough liquidity for this transfer right now. Try a smaller amount or a different token pair.";
        } else if (err.includes('unsupported')) {
          text = "This token pair isn't supported yet. Check that both tokens are available on goBlink.";
        } else if (err.includes('amount too small') || err.includes('minimum')) {
          text = "The transfer amount is too small. Try increasing the amount.";
        } else if (err.includes('amount too large') || err.includes('maximum')) {
          text = "The transfer amount exceeds the maximum. Try a smaller amount or split into multiple transfers.";
        } else {
          text += state.quoteError;
        }
      }
      
      return {
        text,
        actions: [
          { label: 'Try Again', action: 'retry' }
        ],
        severity: 'error'
      };
    }
  },
  
  {
    id: 'quote-expired',
    priority: 230,
    category: 'swap',
    proactive: true,
    condition: (state) => state.quoteStatus === 'expired',
    response: () => ({
      text: "Your quote has expired. Rates update frequently — click to get a fresh quote.",
      actions: [
        { label: 'Get New Quote', action: 'retry' }
      ],
      severity: 'warning'
    })
  },
  
  {
    id: 'large-amount',
    priority: 240,
    category: 'swap',
    proactive: true,
    condition: (state) => {
      if (!state.amount) return false;
      // Assuming USD value - in real app you'd convert from token amount
      const amount = parseFloat(state.amount);
      return amount > 10000;
    },
    response: () => ({
      text: "For transfers over $10,000, goBlink's fee drops to just 0.30%. Large transfers may take slightly longer to process.",
      severity: 'info'
    })
  },
  
  {
    id: 'same-chain-selected',
    priority: 250,
    category: 'swap',
    proactive: true,
    condition: (state) => state.fromChain === state.toChain && state.fromChain !== null,
    response: (state) => {
      const dex = getDexSuggestion(state.fromChain!);
      return {
        text: `You've selected the same chain for both sides. goBlink is designed for cross-chain transfers. For same-chain swaps, try ${dex}.`,
        severity: 'info'
      };
    }
  },
  
  // ═════════════════════════════════════════════════════════════════
  // TRANSACTION RULES (Priority 300-399)
  // ═════════════════════════════════════════════════════════════════
  
  {
    id: 'tx-pending-2min',
    priority: 300,
    category: 'transaction',
    proactive: true,
    condition: (state) => {
      if (state.txStatus !== 'pending' && state.txStatus !== 'confirming') return false;
      if (!state.txStartedAt) return false;
      const elapsed = (Date.now() - state.txStartedAt) / 1000;
      return elapsed > 120 && elapsed < 300;
    },
    response: () => ({
      text: "Your transfer is being processed by goBlink's network. Cross-chain transfers typically complete in under a minute but can take up to 10 minutes during high network activity.",
      severity: 'info'
    })
  },
  
  {
    id: 'tx-pending-5min',
    priority: 310,
    category: 'transaction',
    proactive: true,
    condition: (state) => {
      if (state.txStatus !== 'pending' && state.txStatus !== 'confirming') return false;
      if (!state.txStartedAt) return false;
      const elapsed = (Date.now() - state.txStartedAt) / 1000;
      return elapsed > 300;
    },
    response: () => ({
      text: "Your transfer is taking longer than usual. This can happen during blockchain congestion. Don't worry — if the transfer can't complete, your funds will be automatically refunded.",
      severity: 'warning'
    })
  },
  
  {
    id: 'tx-failed',
    priority: 320,
    category: 'transaction',
    proactive: true,
    condition: (state) => state.txStatus === 'failed',
    response: (state) => {
      let reason = '';
      if (state.txError) {
        const err = state.txError.toLowerCase();
        if (err.includes('slippage')) {
          reason = 'The price moved too much during the transfer. ';
        } else if (err.includes('timeout')) {
          reason = 'The transfer timed out. ';
        } else if (err.includes('insufficient')) {
          reason = 'Insufficient balance or liquidity. ';
        } else {
          reason = `${state.txError}. `;
        }
      }
      
      return {
        text: `Your transfer couldn't be completed. ${reason}Your funds will be automatically refunded to your wallet. Refunds typically arrive within a few minutes.`,
        severity: 'error'
      };
    }
  },
  
  {
    id: 'tx-refunded',
    priority: 330,
    category: 'transaction',
    proactive: true,
    condition: (state) => state.txStatus === 'refunded',
    response: (state) => {
      const wallet = state.connectedWallets[0]?.address || 'your wallet';
      return {
        text: `Your funds have been refunded to ${wallet.slice(0, 6)}...${wallet.slice(-4)}.`,
        severity: 'success'
      };
    }
  },
  
  {
    id: 'tx-completed',
    priority: 340,
    category: 'transaction',
    proactive: true,
    condition: (state) => state.txStatus === 'completed',
    response: (state) => {
      return {
        text: `Transfer complete! Your tokens have been delivered to ${state.recipient ? state.recipient.slice(0, 6) + '...' + state.recipient.slice(-4) : 'the recipient'}.`,
        severity: 'success'
      };
    }
  },
  
  // ═════════════════════════════════════════════════════════════════
  // GENERAL / EDUCATIONAL RULES (Priority 400-499)
  // ═════════════════════════════════════════════════════════════════
  
  {
    id: 'first-time-user',
    priority: 400,
    category: 'general',
    proactive: false,
    condition: (state) => !state.hasAnyWallet && !state.amount,
    response: () => ({
      text: "Welcome to goBlink! Transfer tokens across 20+ blockchains in seconds. Just select your source and destination, enter an amount, and go.",
      severity: 'info'
    })
  },
  
  {
    id: 'fees-question',
    priority: 410,
    category: 'general',
    proactive: false,
    condition: () => false, // Triggered by keyword matching
    response: () => ({
      text: "goBlink charges a small service fee: 0.75% for transfers under $1,000, 0.50% for $1K-$10K, and 0.30% for transfers over $10K. Network fees are separate and depend on blockchain activity.",
      severity: 'info'
    })
  },
  
  {
    id: 'supported-chains',
    priority: 420,
    category: 'general',
    proactive: false,
    condition: () => false, // Triggered by keyword matching
    response: () => ({
      text: "goBlink supports 20+ blockchains: Ethereum, Arbitrum, Base, BNB Chain, Polygon, Optimism, Solana, NEAR, Sui, Aptos, Starknet, TON, Tron, Bitcoin (coming soon), and more!",
      severity: 'info'
    })
  },
  
  {
    id: 'safety-question',
    priority: 430,
    category: 'general',
    proactive: false,
    condition: () => false, // Triggered by keyword matching
    response: () => ({
      text: "goBlink is non-custodial — we never hold your funds. Transfers go directly between blockchains using goBlink's network, and failed transfers are automatically refunded.",
      severity: 'info'
    })
  },
  
  {
    id: 'speed-question',
    priority: 440,
    category: 'general',
    proactive: false,
    condition: () => false, // Triggered by keyword matching
    response: () => ({
      text: "Most goBlink transfers complete in under 60 seconds. During high network activity, it can take up to 10 minutes. You can track your transfer's progress in real-time.",
      severity: 'info'
    })
  },
];

// ── Evaluate Rules Against App State ──
export function evaluateRules(state: AppState, proactiveOnly: boolean = false): SupportMessage | null {
  // Sort by priority (higher = more important)
  const sortedRules = [...SUPPORT_RULES].sort((a, b) => b.priority - a.priority);
  
  for (const rule of sortedRules) {
    if (proactiveOnly && !rule.proactive) continue;
    
    try {
      if (rule.condition(state)) {
        return rule.response(state);
      }
    } catch (error) {
      console.error(`Rule ${rule.id} failed:`, error);
    }
  }
  
  return null;
}

// ── Get Rule by ID ──
export function getRuleById(id: string): SupportRule | null {
  return SUPPORT_RULES.find(r => r.id === id) || null;
}
