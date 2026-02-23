'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Zap, Shield, BarChart2, BookOpen, Clock,
  Share2, Link2, CreditCard, Code2, Star, History,
  MessageCircle, ChevronDown, ArrowRight, Sparkles,
  LayoutGrid, Brain, Activity, Package,
} from 'lucide-react';
import GradientMesh from '@/components/ui/GradientMesh';
import ChainTicker from '@/components/ui/ChainTicker';
import ScrollReveal from '@/components/ui/ScrollReveal';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

// ── Feature Data ──────────────────────────────────────────────────────────────

interface Feature {
  icon: React.ReactNode;
  title: string;
  tagline: string;
  detail: string;
  highlight?: string; // bold callout inside detail
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  features: Feature[];
}

const CATEGORIES: Category[] = [
  {
    id: 'guidance',
    label: 'UX & Guidance',
    icon: <Wallet className="h-5 w-5" />,
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.08)',
    features: [
      {
        icon: <Wallet className="h-5 w-5" />,
        title: 'Wallet Setup Guide',
        tagline: 'Never leave a user stranded without a wallet.',
        detail:
          'A guided 4-step onboarding flow activates whenever a user lands on a chain they\'ve never connected: Choose wallet → Install → Create account → Connect. Every step is chain-specific — Solana users get Phantom or Solflare, Sui users get Phantom or Slush, NEAR users get Meteor or MyNearWallet, EVM users get MetaMask. The guide detects in real time whether the extension is already installed, and adjusts its instructions for desktop vs. mobile.',
        highlight: 'Zero drop-off for new wallet users.',
      },
      {
        icon: <LayoutGrid className="h-5 w-5" />,
        title: 'No Wallet Card',
        tagline: 'Three paths forward when there\'s no wallet on the destination chain.',
        detail:
          'Instead of a dead end, users see three clear options: switch to a chain they\'re already connected on (shown as green pill buttons with their connected chain names), enter the receiving address manually, or launch the full wallet setup guide for that chain. There\'s no anxiety, no confusion — just a clear next step. Each path respects the user\'s situation rather than forcing one solution.',
        highlight: 'No dead ends. Ever.',
      },
      {
        icon: <Zap className="h-5 w-5" />,
        title: 'Smart Address Auto-Population',
        tagline: 'Connected wallet = addresses filled. No copy-paste required.',
        detail:
          'When a user connects wallets on either side of a transfer, the corresponding address fields fill automatically. The refund address (essential for safe intent-based transfers) is auto-filled from the sending wallet. The recipient field shows "Auto-filled from wallet" as confirmation. When a chain is changed and a wallet is connected on the new chain, the address updates instantly. When a wallet disconnects, manually-entered addresses are preserved while auto-filled ones are cleared.',
        highlight: 'Zero address input for connected wallets.',
      },
      {
        icon: <Star className="h-5 w-5" />,
        title: 'Balance-Filtered Token Selector',
        tagline: 'Show tokens people can actually use. Hide the rest.',
        detail:
          'Once a wallet is connected and balances finish loading, the From token selector filters down to only tokens with a positive balance. A user with SOL, USDC, and JitoSOL sees exactly three options — not 65. Token balances are fetched chain-specifically across NEAR, EVM, Solana, Sui, and more. There\'s a safety fallback: if balances load but everything shows zero (fresh wallet edge case), the full token list is shown rather than an empty screen.',
        highlight: 'Eliminates the "wall of options" cognitive load failure.',
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence Layer',
    icon: <Brain className="h-5 w-5" />,
    color: 'var(--brand)',
    bg: 'rgba(124,58,237,0.08)',
    features: [
      {
        icon: <Brain className="h-5 w-5" />,
        title: 'Smart Defaults',
        tagline: 'The app learns your patterns. Return visits feel instant.',
        detail:
          'Usage patterns are recorded client-side in localStorage — no accounts, no uploads, no tracking. After a few transfers, the app learns which chain pairs and token pairs a user prefers. On return visits, those routes are pre-selected. Returning to goBlink for a weekly NEAR→Solana transfer means the form is already set before you touch it. Up to 50 routes are stored, sorted by recency and frequency.',
        highlight: 'Privacy-first personalization with zero data collection.',
      },
      {
        icon: <Sparkles className="h-5 w-5" />,
        title: 'Contextual Nudges',
        tagline: 'The right message at the right moment. Never repeated.',
        detail:
          'Four nudge types trigger based on real user state: First-ever transfer (suggests a safe test amount per token type — 0.002 ETH, $5 USDC, 0.01 SOL, etc.), first time on a new chain pair (brief route context), largest transfer yet at 3x their personal maximum (recommends a test first), and welcome-back after 7+ days away (re-orientation). Every nudge is dismissable and shown at most once per context. The system reads actual transfer history to determine what\'s appropriate, not timers.',
        highlight: 'Anxiety-reducing UX grounded in behavioral science.',
      },
      {
        icon: <BarChart2 className="h-5 w-5" />,
        title: 'Confidence Score',
        tagline: 'A 0–100 route reliability score. Shown before every transfer.',
        detail:
          'Before confirming, users see a score calculated from real settlement data stored in Supabase: historical success rate on that specific route pair, average completion time, and route classification (whether it\'s a well-established path or novel). Scores display as Excellent (95+), Good (75–94), or Fair (below 75) with specific supporting data shown inline — "94% of transfers on this route succeed" or "Avg. completion: 42s". Users see the data behind the number, not just a label.',
        highlight: 'Certainty reduces the threat response before signing.',
      },
      {
        icon: <Activity className="h-5 w-5" />,
        title: 'Smart First Transaction',
        tagline: 'Token-specific suggestions that match real transfer minimums.',
        detail:
          'When a first-timer is about to send a large amount they\'ve never tried before, the system surfaces a concrete, token-specific suggestion: "Try 0.002 ETH first" or "Try $5 USDC." These test amounts are calibrated per token type to clear minimums comfortably while keeping risk low. After a successful test, the nudge doesn\'t repeat — the system knows the user is confident. This dramatically reduces failed first transfers and support requests.',
        highlight: 'Reduces first-transfer anxiety with actionable specifics.',
      },
    ],
  },
  {
    id: 'experience',
    label: 'Transaction Experience',
    icon: <Activity className="h-5 w-5" />,
    color: '#059669',
    bg: 'rgba(5,150,105,0.08)',
    features: [
      {
        icon: <Activity className="h-5 w-5" />,
        title: 'Transaction Storyline',
        tagline: 'Four narrative phases. Not a spinner.',
        detail:
          'Once a transfer is submitted, the status display shifts from raw API codes to a four-phase narrative: Sending your token → goBlink routing across chains → Delivered to destination. Each phase has a human-readable label and a detail line explaining what\'s happening. Phase transitions animate in real time as status updates arrive every 5 seconds. Time estimates are clamped to a minimum of 60 seconds — we don\'t show "15s" and set up users for disappointment.',
        highlight: 'Waiting is tolerable when users follow a story, not a code.',
      },
      {
        icon: <Clock className="h-5 w-5" />,
        title: 'Real-time Status Tracking',
        tagline: 'Live polling from submission to delivery.',
        detail:
          'Status updates every 5 seconds using the deposit address as the tracking key. States mapped: PENDING_DEPOSIT → DEPOSIT_RECEIVED → PROCESSING → SUCCESS / REFUNDED / FAILED. 404 and 503 responses during the indexing window are silently swallowed — they\'re normal during the first ~30 seconds as the goBlink catches up. The StatusTracker displays the current phase, updates without page reload, and stops polling once a terminal state is reached.',
        highlight: 'No manual refresh. No "check the explorer" instructions.',
      },
      {
        icon: <Share2 className="h-5 w-5" />,
        title: 'Transfer Success',
        tagline: 'Completion is treated as a moment, not just a state change.',
        detail:
          'When a transfer completes, the screen shows: exact amount received, destination chain name, elapsed time in seconds, a one-tap Share button that pre-generates a social post ("Just transferred X [token] to [chain] in [N]s using goBlink ⚡"), and a "Copy receipt link" button that generates a permanent transfer receipt URL. Users also see a prompt to save the recipient address to their Address Book if it\'s new.',
        highlight: 'Completed transfers become shareable social acts.',
      },
      {
        icon: <Link2 className="h-5 w-5" />,
        title: 'Transfer as a Link',
        tagline: 'Every transfer has a permanent shareable receipt.',
        detail:
          'Transfer details are encoded into a short URL: goblink.io/t/[id]. The link decodes to show chain, token, amount, timestamp, and elapsed time. It renders with Open Graph metadata for rich link previews on Telegram, Twitter, Discord, and other platforms — showing chain logos, token symbols, and transfer amounts in the OG card. Links are permanent, don\'t require authentication to view, and work as receipts for support escalation, community proof, or social sharing.',
        highlight: 'Every transfer is a shareable artifact.',
      },
    ],
  },
  {
    id: 'ecosystem',
    label: 'Ecosystem Tools',
    icon: <Package className="h-5 w-5" />,
    color: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
    features: [
      {
        icon: <CreditCard className="h-5 w-5" />,
        title: 'Payment Requests',
        tagline: 'Generate a cross-chain payment link. Get paid in any token.',
        detail:
          'At goblink.io/pay, users fill in a requested token, amount, and their receiving address. goBlink generates a shareable payment link. The recipient clicks it, sees a pre-filled transfer form, connects their wallet on any supported chain, and sends the equivalent value. The requester receives native tokens on their chain — the sender pays on theirs. No wrapped tokens, no manual conversion, no coordination overhead.',
        highlight: 'Cross-chain payment links in under 30 seconds.',
      },
      {
        icon: <Code2 className="h-5 w-5" />,
        title: 'Embeddable Widget',
        tagline: 'Embed goBlink inside any dApp or website.',
        detail:
          'The full transfer interface is available as an embeddable iframe at goblink.io/embed and goblink.io/widget. The CSP `frame-ancestors` directive is permissive, allowing embedding from any origin. The widget is white-label ready — it inherits the host page\'s dark/light mode signal and renders cleanly inside any layout. DEXes, launchpads, wallets, and portfolio apps can offer cross-chain transfers without building the infrastructure.',
        highlight: 'goBlink distribution through every app that embeds us.',
      },
      {
        icon: <BookOpen className="h-5 w-5" />,
        title: 'Address Book',
        tagline: 'Save and name your frequent addresses. Available at every transfer.',
        detail:
          'Users can save wallet addresses with custom labels (e.g., "Warhead\'s Solana" or "Treasury"). The Address Book is available via a single click at the recipient address field during any transfer. Entries are stored locally in encrypted localStorage — never uploaded, never associated with an account. After a successful transfer to a new address, goBlink prompts to save it. Address Book data persists across sessions and chains.',
        highlight: 'Frequently-used addresses, one click away.',
      },
      {
        icon: <History className="h-5 w-5" />,
        title: 'Transaction History',
        tagline: 'Multi-wallet history with live status tracking.',
        detail:
          'The /history page connects NEAR, EVM, Solana, and Sui wallets simultaneously and shows a unified transfer history. Each entry shows: from/to chains, tokens, amounts, timestamp, and live execution status. Status reflects real settlement state — PENDING, PROCESSING, SUCCESS, REFUNDED, or FAILED. History is queryable per wallet and updates without a full page reload. Works alongside the Supabase transaction_history table for persistence.',
        highlight: 'One view for every transfer across every chain.',
      },
    ],
  },
  {
    id: 'trust',
    label: 'Security & Trust',
    icon: <Shield className="h-5 w-5" />,
    color: '#DC2626',
    bg: 'rgba(220,38,38,0.08)',
    features: [
      {
        icon: <MessageCircle className="h-5 w-5" />,
        title: 'Support Chatbot',
        tagline: 'Instant answers. Zero LLM cost. Always available.',
        detail:
          'A fully deterministic, rule-based support system runs client-side with zero API calls. It handles the top Tier 1 questions out of the box: how goBlink works, fees and fee tiers, supported chains and tokens, what happens if a transfer is pending, how refunds work, and how to find a transaction. A ProactiveTip component surfaces context-aware warnings at the right moment — for example, a minimum amount warning before a user hits an API validation error. Chat history persists in the session.',
        highlight: 'Real answers in seconds. No escalation for common questions.',
      },
      {
        icon: <Shield className="h-5 w-5" />,
        title: 'Non-custodial + Auto-refund',
        tagline: 'We never hold your tokens. Failed transfers return automatically.',
        detail:
          'goBlink generates a deposit address and passes it to the user\'s wallet for signing. We never control, route, or hold funds at any step. Every transfer request includes a refund address (auto-filled from the sending wallet). If a transfer fails to settle for any reason — slippage, timing, route failure — goBlink automatically returns funds to the refund address. No manual claims, no support ticket.',
        highlight: '100% auto-refund on failure. By protocol design.',
      },
      {
        icon: <BarChart2 className="h-5 w-5" />,
        title: 'Security Hardened',
        tagline: 'Full security audit completed. 18 issues identified and resolved.',
        detail:
          'Security audit completed February 2026. Issues fixed: rate limiting on all API routes, strict address validation (prevents spoofed deposit address injection), encrypted localStorage for sensitive data, Content Security Policy covering all wallet extension domains and RPC endpoints, CORS lockdown on API routes, removal of all eval() usage, security headers (X-Frame-Options, HSTS, X-Content-Type-Options), and a dedicated security utility library covering validators, rate-limit, api-response, logger, cache, and security modules.',
        highlight: '18 vulnerabilities found and fixed before beta launch.',
      },
    ],
  },
];

// ── Feature Accordion Item ────────────────────────────────────────────────────

function FeatureCard({ feature, color, bg }: { feature: Feature; color: string; bg: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: 'var(--elevated)',
        border: `1px solid ${open ? color + '40' : 'var(--border)'}`,
        boxShadow: open ? `0 0 0 1px ${color}20, 0 4px 24px ${color}10` : 'none',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-4 p-5 text-left"
        aria-expanded={open}
      >
        <div
          className="flex-shrink-0 mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: bg, color }}
        >
          {feature.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
            {feature.title}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {feature.tagline}
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="flex-shrink-0 mt-1"
        >
          <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5">
              <div
                className="h-px w-full mb-4"
                style={{ background: 'var(--border)' }}
              />
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                {feature.detail}
              </p>
              {feature.highlight && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: bg, color }}
                >
                  <Sparkles className="h-3 w-3 flex-shrink-0" />
                  {feature.highlight}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Category Section ──────────────────────────────────────────────────────────

function CategorySection({ cat }: { cat: Category }) {
  return (
    <ScrollReveal>
      <div className="mb-16">
        {/* Category header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: cat.bg, color: cat.color }}
          >
            {cat.icon}
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {cat.label}
          </h3>
          <div
            className="h-px flex-1"
            style={{ background: 'var(--border)' }}
          />
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {cat.features.map((f) => (
            <FeatureCard key={f.title} feature={f} color={cat.color} bg={cat.bg} />
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <GradientMesh />

      {/* ═══ HERO ═══ */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pb-8 pt-20">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(37,99,235,0.1)',
            border: '1px solid rgba(37,99,235,0.25)',
            color: 'var(--brand)',
          }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Beta Live — goblink.io
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-hero mb-6 max-w-4xl"
          style={{ color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          Move Value Anywhere,{' '}
          <span className="text-gradient">Instantly</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-body-lg max-w-xl mb-10"
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          Cross-chain transfers across 12 chains and 65+ tokens — designed to be as simple as sending a text.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-3 mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link href="/app" className="btn btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold">
            Launch App <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="btn btn-ghost inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            See all features <ChevronDown className="h-4 w-4" />
          </a>
        </motion.div>

        {/* Stats — tight to the hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-2xl mx-auto"
        >
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-6 py-5 rounded-2xl"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            {[
              { value: '12', suffix: '', label: 'Active Chains' },
              { value: '65', suffix: '+', label: 'Tokens' },
              { value: '45', suffix: 's', label: 'Avg. Transfer' },
              { value: '100', suffix: '%', label: 'Auto-Refund' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold text-gradient tracking-tight">
                  <AnimatedCounter value={s.value} />{s.suffix}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ FEATURES — front and centre ═══ */}
      <section id="features" className="relative z-10 pt-10 pb-16 px-4 max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>
              Every feature, explained
            </h2>
            <p className="text-body-sm max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              goBlink isn&apos;t just a swap form. It&apos;s a full human experience layer — every detail designed to remove friction and build trust.
            </p>
          </div>
        </ScrollReveal>

        {CATEGORIES.map((cat) => (
          <CategorySection key={cat.id} cat={cat} />
        ))}
      </section>

      {/* ═══ CHAIN TICKER ═══ */}
      <ScrollReveal>
        <section className="relative z-10 py-12 border-y" style={{ borderColor: 'var(--border)' }}>
          <ChainTicker />
        </section>
      </ScrollReveal>

      {/* ═══ CTA BANNER ═══ */}
      <ScrollReveal>
        <section className="relative z-10 px-4 py-20 max-w-3xl mx-auto text-center">
          <div
            className="rounded-3xl p-10"
            style={{
              background: 'rgba(37,99,235,0.06)',
              border: '1px solid rgba(37,99,235,0.2)',
            }}
          >
            <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>
              Ready to move?
            </h2>
            <p className="text-body-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Connect your wallet and make your first cross-chain transfer in under a minute.
            </p>
            <Link
              href="/app"
              className="btn btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold"
            >
              Launch goBlink <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              {['Non-custodial', 'No account needed', 'Auto-refund on failure'].map((t) => (
                <span key={t} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ✓ {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
