'use client';

import { useState } from 'react';
import SwapForm from '@/components/SwapForm';
import TransferModal from '@/components/TransferModal';
import RecentTransfers from '@/components/RecentTransfers';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { getChainsByType } from '@/lib/chain-logos';
import { Zap, Shield, DollarSign, ArrowRight, ChevronDown } from 'lucide-react';

export default function Home() {
  const [quoteData, setQuoteData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [, setTrackingAddress] = useState<string>('');
  const { history, addEntry } = useTransactionHistory();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

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
    setTimeout(() => { setQuoteData(null); setTrackingAddress(''); }, 300);
  };

  const chainGroups = getChainsByType();

  const faqs = [
    { q: 'How does goBlink work?', a: 'Select your tokens, enter an amount, and confirm. goBlink uses NEAR Intents to find the fastest route across chains. Your tokens arrive in seconds — no bridging, no wrapping, no complexity.' },
    { q: 'Is it safe?', a: 'goBlink is non-custodial — we never hold your funds. Transfers are routed through NEAR\'s intent-based protocol with built-in price protection. If a transfer can\'t complete, your funds are returned automatically.' },
    { q: 'What chains are supported?', a: '29 blockchains including Ethereum, Solana, NEAR, Bitcoin, Sui, Base, Arbitrum, Polygon, Aptos, Starknet, TON, Tron, and many more. New chains are added regularly.' },
    { q: 'What are the fees?', a: 'Transparent tiered pricing: 0.35% for transfers under $5K, 0.10% for $5K–$50K, and 0.05% for transfers over $50K. Minimum fee is $0.50. Fees are shown upfront as a dollar amount before you confirm.' },
    { q: 'Do I need an account?', a: 'No. Just connect your wallet and transfer. No sign-up, no email, no KYC. Your wallet is your identity.' },
  ];

  return (
    <div className="animate-fade-up">
      {/* ═══ Hero ═══ */}
      <section className="text-center mb-10 sm:mb-16">
        <h1 className="text-hero mb-4" style={{ color: 'var(--text-primary)' }}>
          Move Value Anywhere,{' '}
          <span className="text-gradient">Instantly</span>
        </h1>
        <p className="text-body-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Transfer tokens across 29 blockchains in seconds.
          One click, any chain, no bridges.
        </p>
      </section>

      {/* ═══ Swap Card ═══ */}
      <section className="max-w-[480px] mx-auto mb-10">
        <SwapForm
          onQuoteReceived={handleQuoteReceived}
          onSwapInitiated={() => {}}
        />
      </section>

      {/* ═══ Recent Transfers ═══ */}
      <section className="max-w-[480px] mx-auto mb-16">
        <RecentTransfers history={history} onSelect={() => {}} />
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section className="grid grid-cols-3 gap-4 sm:gap-8 mb-20 max-w-2xl mx-auto">
        {[
          { value: '29', label: 'Chains' },
          { value: '120+', label: 'Tokens' },
          { value: '<30s', label: 'Avg. Transfer' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-h2 text-gradient">{stat.value}</div>
            <div className="text-caption" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="mb-20 max-w-3xl mx-auto">
        <h2 className="text-h2 text-center mb-10" style={{ color: 'var(--text-primary)' }}>
          Three steps. That&apos;s it.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Pick your tokens', desc: 'Choose what you\'re sending and what you want to receive. Any chain, any token.' },
            { step: '2', title: 'Confirm', desc: 'Review the quote with transparent fees. Approve in your wallet.' },
            { step: '3', title: 'Done', desc: 'Tokens arrive in seconds. Track the transfer in real-time.' },
          ].map((item) => (
            <div key={item.step} className="relative card p-6 group hover:border-brand-600/30 dark:hover:border-brand-600/20 transition-all">
              <div className="text-tiny font-bold mb-3 inline-flex items-center justify-center w-7 h-7 rounded-full" style={{ background: 'var(--gradient)', color: 'white' }}>
                {item.step}
              </div>
              <h3 className="text-h5 mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
              <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Supported Chains ═══ */}
      <section className="mb-20">
        <h2 className="text-h2 text-center mb-3" style={{ color: 'var(--text-primary)' }}>
          29 Chains. One Interface.
        </h2>
        <p className="text-body-sm text-center mb-8" style={{ color: 'var(--text-muted)' }}>
          Send from any connected chain. Receive on all of them.
        </p>

        {/* Wallet-connected chains */}
        <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-3xl mx-auto">
          {chainGroups.wallet.map(chain => (
            <div key={chain.id} className="flex items-center gap-1.5 px-3 py-2 rounded-lg card text-body-sm hover:glow-blue transition-all cursor-default"
              title={chain.name}>
              <img src={chain.icon} alt={chain.name} className="w-5 h-5 rounded-full"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{chain.name}</span>
            </div>
          ))}
        </div>

        {/* Destination-only */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          <span className="text-tiny self-center mr-1" style={{ color: 'var(--text-faint)' }}>+ receive on</span>
          {chainGroups.destinationOnly.map(chain => (
            <div key={chain.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg opacity-60" style={{ background: 'var(--elevated)' }}
              title={`${chain.name} (receive only)`}>
              <img src={chain.icon} alt={chain.name} className="w-4 h-4 rounded-full"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>{chain.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Features ═══ */}
      <section className="mb-20 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div key={feature.title} className="card p-6 hover:glow-blue transition-all">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: feature.bg, color: feature.color }}>
                {feature.icon}
              </div>
              <h3 className="text-h5 mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
              <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Trust Bar ═══ */}
      <section className="mb-20 text-center">
        <div className="inline-flex items-center gap-6 px-6 py-3 rounded-full" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: 'var(--success)' }} />
            <span className="text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>Non-custodial</span>
          </div>
          <div className="w-px h-4" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: 'var(--brand)' }} />
            <span className="text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>Powered by NEAR Intents</span>
          </div>
          <div className="w-px h-4" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-2">
            <span className="text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>No account needed</span>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="mb-20 max-w-2xl mx-auto">
        <h2 className="text-h2 text-center mb-8" style={{ color: 'var(--text-primary)' }}>
          Questions? Answers.
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{faq.q}</span>
                <ChevronDown
                  className="h-4 w-4 flex-shrink-0 ml-4 transition-transform"
                  style={{ color: 'var(--text-muted)', transform: faqOpen === i ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              {faqOpen === i && (
                <div className="px-4 pb-4">
                  <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="text-center mb-20">
        <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>
          Ready to move?
        </h2>
        <p className="text-body-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Connect your wallet and make your first transfer in under a minute.
        </p>
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="btn btn-primary inline-flex items-center gap-2">
          Start Transferring <ArrowRight className="h-4 w-4" />
        </a>
      </section>

      {/* ═══ Transfer Modal ═══ */}
      {showModal && quoteData && (
        <TransferModal
          quote={quoteData}
          onClose={handleCloseModal}
          onComplete={handleTransferComplete}
        />
      )}
    </div>
  );
}
