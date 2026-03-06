import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import LayoutShell from '@/components/LayoutShell';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { validateEnv } from '@/lib/env';

// Validate required environment variables at startup (server-side only)
if (typeof window === 'undefined') {
  validateEnv();
}

const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://goblink.io' 
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'goBlink — Move & Accept Crypto. Instantly.',
  description: 'Transfer tokens across 12 blockchains in seconds, or accept crypto payments for your business. Non-custodial, instant settlement, no bridges needed.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'goBlink',
  },
  openGraph: {
    title: 'goBlink — Move & Accept Crypto. Instantly.',
    description: 'Transfer tokens across 12 blockchains in seconds, or accept crypto payments for your business. Non-custodial, instant settlement, no bridges needed.',
    siteName: 'goBlink',
    url: baseUrl,
    images: [{ url: `${baseUrl}/og-image.jpg`, width: 1200, height: 630, alt: 'goBlink — Move & accept crypto instantly across 12 chains' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'goBlink — Move & Accept Crypto. Instantly.',
    description: 'Transfer tokens across 12 blockchains in seconds, or accept crypto payments for your business. Non-custodial, instant settlement, no bridges needed.',
    images: [`${baseUrl}/og-image.jpg`],
    creator: '@goBlink_io',
  },
  alternates: {
    canonical: baseUrl,
  },
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const themeScript = `
  (function() {
    try {
      var mode = localStorage.getItem('theme') || 'dark';
      var dark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (dark) document.documentElement.classList.add('dark');
    } catch(e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "goBlink",
              "url": "https://goblink.io",
              "description": "Transfer tokens across 12 blockchains in seconds, or accept crypto payments for your business. Non-custodial, instant settlement, no bridges needed.",
              "applicationCategory": "DeFi",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": ["Cross-chain transfers", "65+ tokens", "12 blockchains", "Non-custodial", "Auto-refund", "Payment requests", "Merchant payments", "Embeddable widget"]
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "goBlink",
              "url": "https://goblink.io",
              "logo": "https://goblink.io/icon-512.png",
              "sameAs": ["https://x.com/goBlink_io"],
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "admin@goblink.io",
                "contactType": "customer support"
              }
            }),
          }}
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <ClientLayout>
          <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            <LayoutShell>
              {children}
            </LayoutShell>

            {/* ── Footer ── */}
            <footer className="border-t mt-16 sm:mt-24" style={{ borderColor: 'var(--border)' }}>
              <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
                  {/* Product */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Product</h4>
                    <div className="flex flex-col gap-2.5">
                      <a href="/app" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Launch App</a>
                      <a href="/#features" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Features</a>
                      <a href="/pay" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Payment Links</a>
                      <a href="/history" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>History</a>
                      <a href="/api-docs" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>API Docs</a>
                    </div>
                  </div>
                  {/* Resources */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Resources</h4>
                    <div className="flex flex-col gap-2.5">
                      <a href="/widget" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Widget</a>
                      <a href="/embed" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Embed</a>
                    </div>
                  </div>
                  {/* Legal */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Legal</h4>
                    <div className="flex flex-col gap-2.5">
                      <a href="/terms" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Terms of Service</a>
                      <a href="/privacy" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</a>
                    </div>
                  </div>
                  {/* Social */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Connect</h4>
                    <div className="flex flex-col gap-2.5">
                      <a href="https://x.com/goBlink_io" target="_blank" rel="noopener noreferrer" className="text-sm hover:opacity-70 transition-opacity inline-flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        X / Twitter
                      </a>
                      <a href="mailto:admin@goblink.io" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Contact</a>
                    </div>
                  </div>
                </div>
                {/* Bottom bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2.5">
                    <img src="/icon-192.png" alt="goBlink" className="h-6 w-6 rounded-md" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>goBlink</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    &copy; 2026 goBlink. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </ClientLayout>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
