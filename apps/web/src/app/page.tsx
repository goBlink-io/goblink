'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SwapForm from '@/components/SwapForm';
import TransferModal from '@/components/TransferModal';
import RecentTransfers from '@/components/RecentTransfers';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { useSmartFirstTransaction } from '@/hooks/useSmartFirstTransaction';
import { useSmartDefaults } from '@/hooks/useSmartDefaults';
import { Zap, Shield, DollarSign, ArrowRight, ChevronDown } from 'lucide-react';
import GradientMesh from '@/components/ui/GradientMesh';
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
    { q: 'What chains are supported?', a: '26 blockchains including Ethereum, Solana, NEAR, Bitcoin, Sui, Base, Arbitrum, Polygon, Aptos, Starknet, Tron, and many more. New chains are added regularly.' },
    { q: 'What are the fees?', a: 'Transparent tiered pricing: 0.35% for transfers under $5K, 0.10% for $5K–$50K, and 0.05% for transfers over $50K. Minimum fee is $0.50. Fees are shown upfront as a dollar amount before you confirm.' },
    { q: 'Do I need an account?', a: 'No. Just connect your wallet and transfer. No sign-up, no email, no KYC. Your wallet is your identity.' },
  ];

  return (
    <div className="relative">
      {/* ═══ Gradient Mesh Background ═══ */}
      <GradientMesh />

      <div className="relative z-10 animate-fade-up">
        {/* ═══════════════════════════════════════════════
             ABOVE THE FOLD: tagline + swap card + trust bar
             ═══════════════════════════════════════════════ */}

        {/* ═══ Hero ═══ — compact so swap card is visible on load */}
        <section className="text-center mb-6 sm:mb-8 pt-2">
          <motion.h1
            className="text-hero mb-3"
            style={{ color: 'var(--text-primary)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            Move Value Anywhere,{' '}
            <span className="text-gradient">Instantly</span>
          </motion.h1>
          <motion.p
            className="text-body-lg max-w-xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            Transfer tokens across 26 blockchains in seconds.
            One click, any chain, no bridges.
          </motion.p>
        </section>

        {/* ═══ Swap Card — the unmistakable focal point ═══ */}
        <motion.section
          className="max-w-[480px] mx-auto mb-5 glow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <ErrorBoundary fallbackMessage="We couldn't load the transfer form. Please refresh the page.">
            <SwapForm
              onQuoteReceived={handleQuoteReceived}
              refreshKey={balanceRefreshKey}
              onSwapInitiated={() => {}}
            />
          </ErrorBoundary>
        </motion.section>

        {/* ═══ Trust Bar — right below swap card, still above fold ═══ */}
        <motion.section
          className="mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 px-4 py-3 sm:py-3 rounded-2xl sm:rounded-full mx-auto max-w-fit" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
              <span className="text-xs sm:text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>Non-custodial — your keys, your tokens</span>
            </div>
            <div className="hidden sm:block w-px h-4" style={{ background: 'var(--border)' }} />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
              <span className="text-xs sm:text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>No bridges. No waiting.</span>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════
             BELOW THE FOLD
             ══════════════════════════════════════ */}

        {/* ═══ Social Proof Counter ═══ */}
        <motion.section
          className="flex justify-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Active now</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>Last transfer: {lastTransferSecs}s ago</span>
          </div>
        </motion.section>

        {/* ═══ Stats Bar ═══ */}
        <section className="mb-20 max-w-3xl mx-auto">
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
            {[
              { value: '26', label: 'Chains' },
              { value: '65', label: 'Tokens' },
              { value: '45', label: 'Avg. Transfer (s)' },
              { value: '100', label: '% Auto-Refund on Failure' },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="text-center">
                  <div className="stat-value text-gradient">
                    <AnimatedCounter value={stat.value} />
                    {stat.value === '65' ? '+' : stat.value === '45' ? 's' : stat.value === '100' ? '%' : ''}
                  </div>
                  <div className="text-caption mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
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
            <h2 className="text-h2 text-center mb-3" style={{ color: 'var(--text-primary)' }}>
              26 Chains. One Interface.
            </h2>
            <p className="text-body-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>
              Send from any connected chain. Receive on all of them.
            </p>
            <ChainTicker />
          </section>
        </ScrollReveal>

        {/* ═══ How It Works ═══ */}
        <section className="mb-20 max-w-3xl mx-auto">
          <ScrollReveal>
            <h2 className="text-h2 text-center mb-10" style={{ color: 'var(--text-primary)' }}>
              Three steps. That&apos;s it.
            </h2>
          </ScrollReveal>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Pick your tokens', desc: 'Choose what you\'re sending and what you want to receive. Any chain, any token.' },
              { step: '2', title: 'Confirm', desc: 'Review the quote with transparent fees. Approve in your wallet.' },
              { step: '3', title: 'Done', desc: 'Tokens arrive in seconds. Track the transfer in real-time.' },
            ].map((item) => (
              <StaggerItem key={item.step}>
                <div className="relative card card-lift p-6 group hover:border-brand-600/30 dark:hover:border-brand-600/20 transition-all">
                  <div className="text-tiny font-bold mb-3 inline-flex items-center justify-center w-7 h-7 rounded-full" style={{ background: 'var(--gradient)', color: 'white' }}>
                    {item.step}
                  </div>
                  <h3 className="text-h5 mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
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

        {/* ═══ Features ═══ */}
        <section className="mb-20 max-w-3xl mx-auto">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="h-6 w-6" />,
                title: 'Lightning Fast',
                desc: 'Transfers complete in seconds, not minutes. Real-time tracking from send to receive.',
                color: 'var(--brand)',
                bg: 'var(--info-bg)',
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: 'You Stay in Control',
                desc: 'Non-custodial and transparent. Your keys, your tokens. Failed transfers auto-refund.',
                color: '#7C3AED',
                bg: 'rgba(124, 58, 237, 0.08)',
              },
              {
                icon: <DollarSign className="h-6 w-6" />,
                title: 'Transparent Fees',
                desc: 'Flat dollar-amount fees shown upfront. No hidden costs. Volume discounts built in.',
                color: 'var(--success)',
                bg: 'var(--success-bg)',
              },
            ].map((feature) => (
              <StaggerItem key={feature.title}>
                <div className="card card-lift glow-card p-6 hover:glow-blue transition-all h-full">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: feature.bg, color: feature.color }}>
                    {feature.icon}
                  </div>
                  <h3 className="text-h5 mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                  <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
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
            onOutcome={(success: boolean) => updateLastRecordSuccess(success)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
