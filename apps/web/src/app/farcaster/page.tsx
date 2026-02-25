import { Metadata } from 'next';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import FarcasterFrameBuilder from '@/components/FarcasterFrameBuilder';

export const metadata: Metadata = {
  title: 'Farcaster Frames · goBlink',
  description: 'Create payment and tip frames for Farcaster. Share a link, get paid — no app needed.',
  openGraph: {
    title: 'Create Farcaster Payment Frames · goBlink',
    description: 'Generate pay and tip frames. One click in Warpcast — done.',
    type: 'website',
    siteName: 'goBlink',
  },
};

export default function FarcasterPage() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-gradient font-black text-2xl">goBlink</span>
            <Zap className="h-5 w-5" style={{ color: 'var(--brand)' }} />
          </Link>
          <h1 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>
            Get paid on Farcaster
          </h1>
          <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            Create a payment link, drop it in a cast, and anyone can pay you — without leaving Warpcast.
          </p>
        </div>

        <FarcasterFrameBuilder />

        {/* How it works */}
        <div className="mt-10 space-y-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            How it works
          </h2>
          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Choose how you want to get paid',
                text: 'Pick the chain and token you want to receive. Want USDC on Solana? SOL? NEAR? Your call.',
              },
              {
                step: '2',
                title: 'Set what the payer sends',
                text: 'Pick the chain and token the payer will use. They can pay with USDC on Base even if you\'re receiving SOL on Solana — goBlink handles the swap automatically.',
              },
              {
                step: '3',
                title: 'Copy and paste your link',
                text: 'Drop the link in any Farcaster cast. Warpcast turns it into a card with a pay button right in the feed.',
              },
              {
                step: '4',
                title: 'They tap, sign, done',
                text: 'The person taps the button, confirms in their wallet, and you get paid. No app downloads, no wallet setup, no extra steps.',
              },
            ].map(({ step, title, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: 'var(--brand)', color: 'white' }}
                >
                  {step}
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ-style tips */}
        <div className="mt-10 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Good to know
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'What\'s a "Pay" frame vs a "Tip" frame?',
                a: 'A Pay frame has a fixed amount — like an invoice. A Tip frame lets the person choose how much to send ($1, $5, $10, or custom).',
              },
              {
                q: 'Does the payer need a specific wallet?',
                a: 'They need an EVM wallet connected to Warpcast (most people already do). They sign the transaction right inside the app.',
              },
              {
                q: 'What if I want to receive on Solana or NEAR?',
                a: 'That works. The payer sends from any EVM chain and goBlink routes it cross-chain automatically. You get the token you picked on the chain you picked.',
              },
              {
                q: 'Are there fees?',
                a: 'goBlink charges a small fee (0.35% for transfers under $5K). No hidden costs.',
              },
            ].map(({ q, a }, i) => (
              <div
                key={i}
                className="p-3 rounded-xl"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{q}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-tiny" style={{ color: 'var(--text-faint)' }}>
            The payer signs an EVM transaction inside Warpcast.
            Cross-chain delivery is handled by goBlink — powered by NEAR Intents.
          </p>
        </div>
      </div>
    </div>
  );
}
