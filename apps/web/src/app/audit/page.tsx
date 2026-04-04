import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'goBlink Audit — Smart Contract Security',
  description:
    'Automated smart contract security audits powered by formal verification. Multi-chain support for Sui, EVM, NEAR, Solana, and Aptos.',
};

export default function AuditPage() {
  return (
    <div className="max-w-3xl mx-auto text-center py-24 px-4">
      {/* Shield icon */}
      <div
        className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full"
        style={{
          background: 'var(--elevated)',
          border: '2px solid var(--brand)',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M24 4L6 12V22C6 33.1 13.68 43.38 24 46C34.32 43.38 42 33.1 42 22V12L24 4Z"
            stroke="var(--brand)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M24 4L6 12V22C6 33.1 13.68 43.38 24 46C34.32 43.38 42 33.1 42 22V12L24 4Z"
            fill="var(--brand)"
            opacity="0.08"
          />
          <path
            d="M17 24L22 29L31 20"
            stroke="var(--brand)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1
        className="text-h1 mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        goBlink Audit
      </h1>

      <p
        className="text-body mb-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        Automated smart contract security audits powered by formal verification.
      </p>

      <p
        className="text-body-sm mb-12"
        style={{ color: 'var(--text-muted)' }}
      >
        Multi-chain support for Sui, EVM, NEAR, Solana, and Aptos.
      </p>

      {/* Coming soon badge */}
      <div
        className="inline-flex items-center gap-2 rounded-full px-6 py-3 mb-12"
        style={{
          background: 'var(--elevated)',
          border: '1px solid var(--border)',
        }}
      >
        <span
          className="relative flex h-2.5 w-2.5"
        >
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: 'var(--brand)' }}
          />
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{ background: 'var(--brand)' }}
          />
        </span>
        <span
          className="text-body-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          Coming Soon
        </span>
      </div>

      {/* Feature preview */}
      <div className="grid gap-4 sm:grid-cols-3 mb-12">
        {[
          {
            title: 'Formal Verification',
            desc: 'Mathematical proofs, not just pattern matching',
          },
          {
            title: '5 Chains',
            desc: 'Sui · EVM · NEAR · Solana · Aptos',
          },
          {
            title: 'Instant Reports',
            desc: 'Automated analysis with actionable findings',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl p-6"
            style={{
              background: 'var(--elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <h3
              className="text-body font-semibold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {item.title}
            </h3>
            <p
              className="text-body-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="text-body-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: 'var(--brand)' }}
      >
        ← Back to goBlink
      </Link>
    </div>
  );
}
