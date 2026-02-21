import { Metadata } from 'next';
import Link from 'next/link';
import { Zap, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'API Docs · goBlink',
  description: 'goBlink API documentation — integrate cross-chain transfers into your app.',
  openGraph: {
    title: 'API Docs · goBlink',
    description: 'Integrate cross-chain transfers into your app with the goBlink API.',
    type: 'website',
    siteName: 'goBlink',
  },
};

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center max-w-md">
        {/* Icon */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
          style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)' }}
        >
          <BookOpen className="h-10 w-10" style={{ color: 'var(--brand)' }} />
        </div>

        {/* Heading */}
        <h1 className="text-h1 mb-3" style={{ color: 'var(--text-primary)' }}>
          API Docs
        </h1>
        <p className="text-body-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
          Coming Soon
        </p>
        <p className="text-body-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          We&apos;re building comprehensive documentation for the goBlink API &amp; SDK.
          Integrate cross-chain transfers into your app with just a few lines of code.
        </p>

        {/* Divider */}
        <div
          className="w-16 h-px mx-auto mb-8"
          style={{ background: 'var(--border)' }}
        />

        {/* Back link */}
        <Link
          href="/"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          Back to goBlink <Zap className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
