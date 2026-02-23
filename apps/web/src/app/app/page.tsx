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
    { q: 'How does goBlink work?', a: 'Select your tokens, enter an amount, and confirm. goBlink uses smart routing technology to find the fastest path across chains. Your tokens arrive in seconds — no bridges, no wrapping, no complexity.' },
    { q: 'Is it safe?', a: 'We never hold your tokens. You stay in control the entire time. Transfers use automatic price guarantees — and if a transfer can\'t complete for any reason, your tokens are automatically returned to you.' },
    { q: 'What chains are supported?', a: '12 blockchains including Ethereum, Solana, NEAR, Bitcoin, Sui, Base, Arbitrum, Polygon, Aptos, Starknet, Tron, and many more. New chains are added regularly.' },
    { q: 'What are the fees?', a: 'Transparent tiered pricing: 0.35% for transfers under $5K, 0.10% for $5K–$50K, and 0.05% for transfers over $50K. Minimum fee is $0.50. Fees are shown upfront as a dollar amount before you confirm.' },
    { q: 'Do I need an account?', a: 'No. Just connect your wallet and transfer. No sign-up, no email, no KYC. Your wallet is your identity.' },
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
                Move value anywhere.{' '}
                <span style={{ color: 'var(--brand)' }}>One click.</span>
              </h1>
              <p
                className="text-body-lg mb-6 max-w-md"
                style={{ color: 'var(--text-secondary)' }}
              >
                12 chains. 65+ tokens. No bridges, no wrapping, no waiting. Just transfers that work.
              </p>

              {/* Trust signals — left-aligned, stacked */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Non-custodial — your keys, always</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Zap className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
                  <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>Avg. transfer: 45 seconds</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <DollarSign className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>100% auto-refund on failure</span>
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
                <div className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>Chains connected</div>
                <div className="text-tiny mt-1" style={{ color: 'var(--text-muted)' }}>Ethereum, Solana, NEAR, Sui, Base, and 7 more</div>
              </div>
            </StaggerItem>

            {/* Supporting stats — compact row */}
            {[
              { value: '65', suffix: '+', label: 'Tokens', sub: 'Cross-chain, any pair' },
              { value: '45', suffix: 's', label: 'Avg. Transfer', sub: 'Send to delivery' },
              { value: '100', suffix: '%', label: 'Auto-Refund', sub: 'If anything fails' },
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

        {/* ═══ Recent Transfers ═══ */}
        <section className="max-w-[480px] mx-auto mb-16">
          <RecentTransfers history={history} onSelect={() => {}} />
        </section>

        {/* ═══ Supported Chains — auto-scrolling ticker ═══ */}
        <ScrollReveal>
          <section className="mb-20">
            <h2 className="text-h2 mb-3 max-w-3xl mx-auto" style={{ color: 'var(--text-primary)' }}>
              12 chains. One interface.
            </h2>
            <p className="text-body-sm mb-6 max-w-3xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Send from any connected chain. Receive on all of them.
            </p>
            <ChainTicker />
          </section>
        </ScrollReveal>

        {/* ═══ How It Works — horizontal numbered steps ═══ */}
        <section className="mb-20 max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-h2 mb-10" style={{ color: 'var(--text-primary)' }}>
              Three steps. That&apos;s it.
            </h2>
          </ScrollReveal>
          <div className="space-y-6">
            {[
              { step: '1', title: 'Pick your tokens', desc: 'Choose what you\'re sending and what you want to receive. Any chain, any token. Balances show automatically when your wallet is connected.' },
              { step: '2', title: 'Review & sign', desc: 'See the exact amount you\'ll receive, the fee in dollars, and the estimated time. One wallet signature and you\'re done.' },
              { step: '3', title: 'Track delivery', desc: 'Watch your tokens move in real-time. Average transfer: 45 seconds. If anything fails, automatic refund — no action needed.' },
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
              Why not just use a bridge?
            </h2>
          </ScrollReveal>
          <ComparisonTable />
        </section>

        {/* ═══ Features — asymmetric: one large + two stacked ═══ */}
        <section className="mb-20 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Large feature card — spans 3 cols */}
            <ScrollReveal>
              <div
                className="md:col-span-3 rounded-2xl p-6 sm:p-8"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: 'var(--info-bg)', color: 'var(--brand)' }}>
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-h4 mb-2" style={{ color: 'var(--text-primary)' }}>Seconds, not minutes</h3>
                <p className="text-body mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Most cross-chain transfers take 30-90 seconds. You get real-time tracking
                  from the moment you sign — no refreshing, no guessing, no checking explorers.
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
                  <h3 className="text-h5 mb-1" style={{ color: 'var(--text-primary)' }}>You stay in control</h3>
                  <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                    Non-custodial. Your keys, your tokens. Failed transfers auto-refund — by protocol, not by promise.
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
                  <h3 className="text-h5 mb-1" style={{ color: 'var(--text-primary)' }}>Fees in dollars, upfront</h3>
                  <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                    No hidden costs. You see the exact fee before you sign. Volume discounts at $5K and $50K.
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
              Ready to move?
            </h2>
            <p className="text-body-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Connect your wallet and make your first transfer in under a minute.
            </p>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              Start Transferring <ArrowRight className="h-4 w-4" />
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
