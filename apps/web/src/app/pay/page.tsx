import { Metadata } from 'next';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import PaymentRequestForm from '@/components/PaymentRequestForm';

export const metadata: Metadata = {
  title: 'Request Payment · goBlink',
  description: 'Create a cross-chain payment request link. Share it with anyone and get paid in any token on any chain.',
  openGraph: {
    title: 'Request Cross-Chain Payment · goBlink',
    description: 'Generate a payment link and get paid in any token, from any chain.',
    type: 'website',
    siteName: 'goBlink',
  },
};

export default function PayPage() {
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
            Request Payment
          </h1>
          <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
            Create a link. Share it. Get paid in any token from any chain.
          </p>
        </div>

        <PaymentRequestForm />

        <div className="mt-6 text-center">
          <p className="text-tiny" style={{ color: 'var(--text-faint)' }}>
            Links are self-contained — no account needed. The payer selects their source token.
          </p>
        </div>
      </div>
    </div>
  );
}
