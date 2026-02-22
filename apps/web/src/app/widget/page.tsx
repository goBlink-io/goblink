import { Metadata } from 'next';
import Link from 'next/link';
import { Zap, Code, Globe, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Embeddable Widget · goBlink',
  description: 'Add cross-chain transfers to your site with a single line of code. The goBlink widget is free to embed.',
  openGraph: {
    title: 'Embed goBlink on Your Site',
    description: 'Add instant cross-chain transfers to any website or app.',
    type: 'website',
    siteName: 'goBlink',
  },
};

const BASE_EMBED_URL = 'https://goblink.io/embed';

const EXAMPLE_CONFIGS = [
  {
    label: 'Default (any chain)',
    code: `<iframe
  src="${BASE_EMBED_URL}"
  width="500"
  height="480"
  style="border:none;border-radius:16px;"
  allow="clipboard-write"
></iframe>`,
  },
  {
    label: 'Pre-fill destination (Base USDC)',
    code: `<iframe
  src="${BASE_EMBED_URL}?toChain=base&toToken=USDC"
  width="500"
  height="480"
  style="border:none;border-radius:16px;"
  allow="clipboard-write"
></iframe>`,
  },
  {
    label: 'Pre-fill recipient address',
    code: `<iframe
  src="${BASE_EMBED_URL}?toChain=ethereum&toToken=USDC&toAddress=0xYourAddress"
  width="500"
  height="480"
  style="border:none;border-radius:16px;"
  allow="clipboard-write"
></iframe>`,
  },
];

const PARAMS = [
  { param: 'fromChain', type: 'string', desc: 'Pre-select the source chain (e.g. ethereum, solana)' },
  { param: 'toChain', type: 'string', desc: 'Pre-select the destination chain (e.g. base, arbitrum)' },
  { param: 'toToken', type: 'string', desc: 'Pre-select the destination token symbol (e.g. USDC, ETH)' },
  { param: 'toAddress', type: 'string', desc: 'Pre-fill the recipient address' },
];

export default function WidgetPage() {
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-gradient font-black text-2xl">goBlink</span>
            <Zap className="h-5 w-5" style={{ color: 'var(--brand)' }} />
          </Link>
          <h1 className="text-h1 mb-4" style={{ color: 'var(--text-primary)' }}>
            Add goBlink to{' '}
            <span className="text-gradient">your site</span>
          </h1>
          <p className="text-body-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            One line of code. Instant cross-chain transfers for your users.
            No sign-up, no API key required.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: <Code className="h-5 w-5" />, title: 'One line embed', desc: 'Drop in an iframe. Done.' },
            { icon: <Globe className="h-5 w-5" />, title: '26 chains', desc: 'Your users pay from anywhere.' },
            { icon: <Layers className="h-5 w-5" />, title: 'Customizable', desc: 'Pre-fill chain, token, address.' },
          ].map(b => (
            <div key={b.title} className="card p-5 text-center">
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3"
                style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--brand)' }}
              >
                {b.icon}
              </div>
              <h3 className="text-h5 mb-1" style={{ color: 'var(--text-primary)' }}>{b.title}</h3>
              <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Live Preview */}
        <div className="mb-12">
          <h2 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>Live Preview</h2>
          <p className="text-body-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            This is exactly what your users will see:
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--elevated)' }}
          >
            <div
              className="px-4 py-2.5 flex items-center gap-2"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400 opacity-80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
                <div className="w-3 h-3 rounded-full bg-green-400 opacity-80" />
              </div>
              <span className="text-tiny font-mono" style={{ color: 'var(--text-muted)' }}>
                your-site.com
              </span>
            </div>
            <div className="p-6 flex justify-center">
              <iframe
                src="/embed"
                width="480"
                height="460"
                style={{ border: 'none', borderRadius: '12px', maxWidth: '100%' }}
                title="goBlink embed preview"
                allow="clipboard-write"
              />
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mb-12">
          <h2 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>Code Examples</h2>
          <div className="space-y-5">
            {EXAMPLE_CONFIGS.map(config => (
              <div key={config.label}>
                <p className="text-body-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {config.label}
                </p>
                <pre
                  className="p-4 rounded-xl text-xs overflow-x-auto"
                  style={{
                    background: 'var(--elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontFamily: 'ui-monospace, monospace',
                    lineHeight: '1.6',
                    whiteSpace: 'pre',
                  }}
                >
                  {config.code}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* URL Params table */}
        <div className="mb-12">
          <h2 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>Configuration</h2>
          <p className="text-body-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Customize the widget with URL parameters:
          </p>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--elevated)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Parameter</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Type</th>
                  <th className="text-left p-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {PARAMS.map((p, i) => (
                  <tr
                    key={p.param}
                    style={{ borderBottom: i < PARAMS.length - 1 ? '1px solid var(--border)' : undefined }}
                  >
                    <td className="p-3">
                      <code
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--brand)', fontFamily: 'monospace' }}
                      >
                        {p.param}
                      </code>
                    </td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text-muted)' }}>{p.type}</td>
                    <td className="p-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{p.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="btn btn-primary inline-flex items-center gap-2 mr-3"
          >
            Try goBlink <Zap className="h-4 w-4" />
          </Link>
          <Link
            href="/pay"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-80"
            style={{ background: 'var(--elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            Request Payment →
          </Link>
        </div>
      </div>
    </div>
  );
}
