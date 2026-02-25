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
            Farcaster Frames
          </h1>
          <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            Create a frame. Paste it in a cast. Anyone can pay or tip — right inside Warpcast.
          </p>
        </div>

        <FarcasterFrameBuilder />

        {/* How it works */}
        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            How it works
          </h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Fill in your address, chain, and token' },
              { step: '2', text: 'Copy the generated link' },
              { step: '3', text: 'Paste it in a Farcaster cast' },
              { step: '4', text: 'Viewers see an interactive card — one tap to pay' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--brand)', color: 'white' }}
                >
                  {step}
                </span>
                <p className="text-sm pt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-tiny" style={{ color: 'var(--text-faint)' }}>
            Frames work on EVM chains only (Base, Ethereum, Arbitrum, Optimism, Polygon, BNB).
            <br />
            Transactions are signed directly in Warpcast — no external wallet needed.
          </p>
        </div>
      </div>
    </div>
  );
}
