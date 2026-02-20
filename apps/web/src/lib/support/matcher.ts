// ── Message Pattern Matching ──
// Match user messages to support categories using keywords

import { AppState, SupportMessage } from './types';
import { getRuleById } from './rules';

interface Pattern {
  keywords: string[];
  ruleId: string;
}

const PATTERNS: Pattern[] = [
  {
    keywords: ['fee', 'fees', 'cost', 'costs', 'charge', 'charges', 'price', 'pricing', 'how much', 'expensive', 'cheap'],
    ruleId: 'fees-question'
  },
  {
    keywords: ['safe', 'safety', 'secure', 'security', 'trust', 'trustworthy', 'scam', 'hack', 'hacked', 'risk', 'risky', 'custodial'],
    ruleId: 'safety-question'
  },
  {
    keywords: ['wallet', 'wallets', 'connect', 'connection', 'metamask', 'phantom', 'install', 'setup', 'set up'],
    ruleId: 'no-wallet-for-source'
  },
  {
    keywords: ['long', 'slow', 'fast', 'speed', 'time', 'when', 'how long', 'pending', 'stuck', 'wait', 'waiting'],
    ruleId: 'speed-question'
  },
  {
    keywords: ['refund', 'refunded', 'money back', 'return', 'returned', 'lost', 'missing', 'didnt receive', "didn't receive"],
    ruleId: 'tx-refunded'
  },
  {
    keywords: ['chain', 'chains', 'network', 'networks', 'support', 'supported', 'which chain', 'available', 'blockchain', 'blockchains'],
    ruleId: 'supported-chains'
  },
  {
    keywords: ['stuck', 'frozen', 'not working', 'error', 'problem', 'issue', 'help', 'broken', 'failed', 'failing'],
    ruleId: 'tx-failed'
  },
  {
    keywords: ['welcome', 'hello', 'hi', 'hey', 'start', 'begin', 'new', 'first time', 'getting started'],
    ruleId: 'first-time-user'
  },
];

/**
 * Match a user message to a support rule
 * Returns the rule ID if a match is found, null otherwise
 */
export function matchMessage(message: string): string | null {
  const normalized = message.toLowerCase().trim();
  
  for (const pattern of PATTERNS) {
    for (const keyword of pattern.keywords) {
      if (normalized.includes(keyword)) {
        return pattern.ruleId;
      }
    }
  }
  
  return null;
}

/**
 * Get a response for a user message
 * First checks app state rules, then falls back to keyword matching
 */
export function getResponseForMessage(message: string, state: AppState): SupportMessage | null {
  // Try keyword matching
  const ruleId = matchMessage(message);
  
  if (ruleId) {
    const rule = getRuleById(ruleId);
    if (rule) {
      try {
        return rule.response(state);
      } catch (error) {
        console.error(`Failed to generate response for rule ${ruleId}:`, error);
      }
    }
  }
  
  return null;
}

/**
 * Get quick-reply suggestions
 */
export function getQuickReplies(): Array<{ label: string; message: string }> {
  return [
    { label: 'How do fees work?', message: 'How do fees work?' },
    { label: 'Is it safe?', message: 'Is goBlink safe?' },
    { label: 'Supported chains', message: 'Which chains are supported?' },
    { label: 'How long does it take?', message: 'How long does a transfer take?' },
  ];
}

/**
 * Get fallback message when no match found
 */
export function getFallbackMessage(): SupportMessage {
  return {
    text: "I'm not sure about that. Here's what I can help with:",
    actions: [
      { label: 'Wallet Help', action: 'open-link', data: '#wallet' },
      { label: 'Transfer Info', action: 'open-link', data: '#transfer' },
      { label: 'Fees & Safety', action: 'open-link', data: '#fees' },
    ],
    severity: 'info'
  };
}
