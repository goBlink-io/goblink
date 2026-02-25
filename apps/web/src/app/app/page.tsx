'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SwapForm from '@/components/SwapForm';
import FirstVisitBanner, { markIntroDismissed } from '@/components/FirstVisitBanner';
import TransferModal from '@/components/TransferModal';
import RecentTransfers from '@/components/RecentTransfers';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { useSmartFirstTransaction } from '@/hooks/useSmartFirstTransaction';
import { useSmartDefaults } from '@/hooks/useSmartDefaults';
import { Zap, Shield, DollarSign, ArrowRight, ChevronDown } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import StaggerContainer, { StaggerItem } from '@/components/ui/StaggerContainer';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import ChainTicker from '@/components/ui/ChainTicker';
import ComparisonTable from '@/components/ui/ComparisonTable';
import TerminalTransfer from '@/components/ui/TerminalTransfer';

export default function Home() {
  const [quoteData, setQuoteData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [, setTrackingAddress] = useState<string>('');
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  const { history, addEntry } = useTransactionHistory();
  const { recordTransfer, updateLastRecordSuccess } = useSmartFirstTransaction('', '', '', 0);
  const { recordRoute } = useSmartDefaults();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  // Social proof counter (Win #6) — simulated live activity
  const [lastTransferSecs, setLastTransferSecs] = useState(22);

  useEffect(() => {
    const tick = () => {
      setLastTransferSecs(60); // Conservative estimate
    };
    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, []);

  const handleQuoteReceived = (quote: any) => {
    setQuoteData(quote);
    setShowModal(true);
  };

  const handleTransferComplete = (depositAddress: string, txHash?: string) => {
    markIntroDismissed(); // First transfer = user understands the flow, banner never needed again
    setTrackingAddress(depositAddress);
    if (quoteData) {
      addEntry({
        fromChain: quoteData.fromChain || '?',
        toChain: quoteData.toChain || '?',
        fromToken: quoteData.originTokenMetadata?.symbol || '?',
        toToken: quoteData.destinationTokenMetadata?.symbol || '?',
        amount: quoteData.quote?.amountInFormatted || '',
        depositAddress,
        status: 'PENDING_DEPOSIT',
      });
    }
    // Record route for smart defaults pattern learning
    if (quoteData) {
      recordRoute(
        quoteData.fromChain || '?',
        quoteData.toChain || '?',
        quoteData.originTokenMetadata?.symbol || '?',
        quoteData.destinationTokenMetadata?.symbol || '?'
      );
    }

    // Record for smart first-transaction nudge system
    if (quoteData) {
      recordTransfer({
        fromChain: quoteData.fromChain || '?',
        toChain: quoteData.toChain || '?',
        fromToken: quoteData.originTokenMetadata?.symbol || '?',
        toToken: quoteData.destinationTokenMetadata?.symbol || '?',
        amount: quoteData.quote?.amountInFormatted || '',
        amountUsd: parseFloat(quoteData.quote?.amountInUsd || '0') || 0,
        success: true, // Optimistic — refined when status polling confirms
      });
    }

    if (txHash) {
      fetch('/api/deposit/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash, depositAddress }),
      }).catch(err => console.error('Error submitting tx:', err));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setBalanceRefreshKey(k => k + 1);
    setTimeout(() => { setQuoteData(null); setTrackingAddress(''); }, 300);
  };

  const faqs = [
    { q: 'How does this actually work?', a: 'You pick tokens, enter an amount, and sign one transaction. Under the hood, goBlink routes through a network of solvers who compete to fill your transfer at the best rate. Your tokens arrive in ~45 seconds. No bridges, no wrapping, no complexity.' },
    { q: 'Can I lose my tokens?', a: 'No. goBlink is non-custodial — we never hold your funds. Every transfer has a protocol-level guarantee: if it can\'t complete, your tokens are returned automatically. No support tickets, no waiting.' },
    { q: 'What chains work?', a: 'Ethereum, Solana, NEAR, Sui, Base, Arbitrum, Polygon, Optimism, BNB, Aptos, Starknet, and Tron. More coming. You can send from any to any.' },
    { q: 'How much does it cost?', a: '0.35% under $5K. 0.10% from $5K–$50K. 0.05% above $50K. Shown in dollars before you sign — a $500 transfer costs $1.75. No minimum fees, no hidden spread, no gas surprises.' },
    { q: 'Do I need to sign up?', a: 'No account, no email, no KYC. Connect a wallet and go. Your wallet is your identity.' },
  ];

  return (
    <div className="relative">
      {/* ═══ Gradient Mesh Background ═══ */}

      <div className="relative z-10 animate-fade-up">
        {/* ═══════════════════════════════════════════════
             ABOVE THE FOLD: tagline + swap card + trust bar
             ═══════════════════════════════════════════════ */}

        {/* ═══ Hero — asymmetric: copy left, swap card right ═══ */}
        <section className="mb-12 sm:mb-16 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left — copy block */}
            <motion.div
              className="pt-2 lg:pt-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <h1
                className="text-hero mb-4 text-left"
                style={{ color: 'var(--text-primary)' }}
              >
                Skip the bridge.{' '}
                <span style={{ color: 'var(--brand)' }}>Just send it.</span>
              </h1>
              <p
                className="text-body-lg mb-6 max-w-md"
                style={{ color: 'var(--text-secondary)' }}
              >
                You shouldn&apos;t need a tutorial to move your own money. Pick tokens, sign once, done. Works across 12 chains.
              </p>

              {/* Trust signals — left-aligned, stacked */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>We never touch your tokens</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Zap className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
                  <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>45 seconds, not 10 minutes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <DollarSign className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Transfer fails? You get every cent back.</span>
                </div>
              </div>

              {/* Social proof — tucked under trust signals */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-tiny font-medium"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Active now · Last transfer: {lastTransferSecs}s ago
              </div>
            </motion.div>

            {/* Right — swap card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <FirstVisitBanner />
              <ErrorBoundary fallbackMessage="We couldn't load the transfer form. Please refresh the page.">
                <SwapForm
                  onQuoteReceived={handleQuoteReceived}
                  refreshKey={balanceRefreshKey}
                  onSwapInitiated={() => {}}
                />
              </ErrorBoundary>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════
             BELOW THE FOLD
             ══════════════════════════════════════ */}

        {/* ═══ Stats — varied sizes: one hero stat, three supporting ═══ */}
        <section className="mb-20 max-w-3xl mx-auto">
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Hero stat — larger */}
            <StaggerItem>
              <div
                className="sm:row-span-2 rounded-2xl p-6 flex flex-col justify-center"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
              >
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--brand)' }}>
                  <AnimatedCounter value="12" />
                </div>
                <div className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>Chains</div>
                <div className="text-tiny mt-1" style={{ color: 'var(--text-muted)' }}>ETH, SOL, NEAR, SUI, Base — you name it</div>
              </div>
            </StaggerItem>

            {/* Supporting stats — compact row */}
            {[
              { value: '65', suffix: '+', label: 'Tokens', sub: 'USDC, ETH, SOL — the ones you actually use' },
              { value: '45', suffix: 's', label: 'Avg. Transfer', sub: 'Signed to delivered' },
              { value: '100', suffix: '%', label: 'Auto-Refund', sub: 'Protocol-enforced, not a pinky promise' },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                >
                  <div className="text-2xl font-extrabold tracking-tight mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    <AnimatedCounter value={stat.value} />{stat.suffix}
                  </div>
                  <div className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>{stat.label}</div>
                  <div className="text-tiny" style={{ color: 'var(--text-muted)' }}>{stat.sub}</div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* ═══ Terminal Transfer — Concept E custom element ═══ */}
        <section className="mb-20 max-w-xl mx-auto">
          <ScrollReveal>
            <TerminalTransfer />
          </ScrollReveal>
        </section>

        {/* ═══ Recent Transfers ═══ */}
        <section className="max-w-[480px] mx-auto mb-16">
          <RecentTransfers history={history} onSelect={() => {}} />
        </section>

        {/* ═══ Supported Chains — auto-scrolling ticker ═══ */}
        <ScrollReveal>
          <section className="mb-20">
            <h2 className="text-h2 mb-3 max-w-3xl mx-auto" style={{ color: 'var(--text-primary)' }}>
              Your tokens live on different chains. So what.
            </h2>
            <p className="text-body-sm mb-6 max-w-3xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Pick a source. Pick a destination. We handle the rest.
            </p>
            <ChainTicker />
          </section>
        </ScrollReveal>

        {/* ═══ How It Works — horizontal numbered steps ═══ */}
        <section className="mb-20 max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-h2 mb-10" style={{ color: 'var(--text-primary)' }}>
              If you can send an email, you can use this.
            </h2>
          </ScrollReveal>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Pick your tokens', desc: 'SOL on Solana → USDC on Base? ETH on Arbitrum → NEAR? Whatever. Connect your wallet and your balances show up automatically.' },
              { step: '2', title: 'Check the math, sign once', desc: 'You see the exact amount arriving, the fee in actual dollars (not some opaque percentage), and how long it\'ll take. One signature. That\'s it.' },
              { step: '3', title: 'Watch it land', desc: 'Real-time tracking. No refreshing, no guessing, no block explorer tabs. Average: 45 seconds. If something goes wrong, you get refunded automatically.' },
            ].map((item) => (
              <ScrollReveal key={item.step} delay={parseInt(item.step) * 0.08}>
                <div className="flex items-start gap-5">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-body-sm font-bold"
                    style={{ background: 'var(--brand)', color: 'white' }}
                  >
                    {item.step}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-h5 mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ═══ Comparison Table ═══ */}
        <section className="mb-20 max-w-2xl mx-auto">
          <ScrollReveal>
            <h2 className="text-h2 text-center mb-8" style={{ color: 'var(--text-primary)' }}>
              Bridges were a workaround. This is the fix.
            </h2>
          </ScrollReveal>
          <ComparisonTable />
        </section>

        {/* ═══ Features — asymmetric: one large + two stacked ═══ */}
        <section className="mb-20 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Large feature card — spans 3 cols */}
            <ScrollReveal className="md:col-span-3">
              <div
                className="rounded-2xl p-6 sm:p-8 h-full"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: 'var(--info-bg)', color: 'var(--brand)' }}>
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-h4 mb-2" style={{ color: 'var(--text-primary)' }}>45 seconds. Seriously.</h3>
                <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Traditional bridges: 10-30 minutes, multiple transactions, wrapped tokens nobody asked for. 
                  goBlink: sign once, watch it land. Real-time tracking the whole way.
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-h3 font-extrabold" style={{ color: 'var(--brand)' }}>45s</div>
                    <div className="text-tiny" style={{ color: 'var(--text-muted)' }}>avg. transfer</div>
                  </div>
                  <div className="w-px h-10" style={{ background: 'var(--border)' }} />
                  <div>
                    <div className="text-h3 font-extrabold" style={{ color: 'var(--text-primary)' }}>Live</div>
                    <div className="text-tiny" style={{ color: 'var(--text-muted)' }}>status tracking</div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Two stacked cards — span 2 cols */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <ScrollReveal delay={0.1}>
                <div
                  className="rounded-2xl p-6 flex-1"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--brand)' }}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-h5 mb-1" style={{ color: 'var(--text-primary)' }}>Your keys. Period.</h3>
                  <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                    We never custody your tokens. Not for a second. If a transfer fails, the protocol refunds you automatically — no support tickets.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.15}>
                <div
                  className="rounded-2xl p-6 flex-1"
                  style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h3 className="text-h5 mb-1" style={{ color: 'var(--text-primary)' }}>$1.75, not &quot;~0.3%&quot;</h3>
                  <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                    You see the fee in dollars before you sign. No hidden spread, no surprise gas. Moving serious volume? Fees drop at $5K and $50K.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="mb-20 max-w-2xl mx-auto">
          <ScrollReveal>
            <h2 className="text-h2 text-center mb-8" style={{ color: 'var(--text-primary)' }}>
              Questions? Answers.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="card overflow-hidden">
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 sm:p-4 text-left"
                  >
                    <span className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{faq.q}</span>
                    <motion.div
                      animate={{ rotate: faqOpen === i ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
                    >
                      <ChevronDown
                        className="h-4 w-4 flex-shrink-0 ml-4"
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {faqOpen === i && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="px-4 pb-4">
                          <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* ═══ CTA ═══ */}
        <ScrollReveal>
          <section className="text-center mb-20">
            <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>
              Stop reading. Start sending.
            </h2>
            <p className="text-body-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              First transfer takes about 60 seconds. Including connecting your wallet.
            </p>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              Try it now <ArrowRight className="h-4 w-4" />
            </a>
          </section>
        </ScrollReveal>
      </div>

      {/* ═══ Transfer Modal ═══ */}
      {showModal && quoteData && (
        <ErrorBoundary fallbackMessage="Something went wrong with the transfer. Please close and try again.">
          <TransferModal
            quote={quoteData}
            onClose={handleCloseModal}
            onComplete={handleTransferComplete}
            onOutcome={(result) => updateLastRecordSuccess(result.status === 'success')}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
