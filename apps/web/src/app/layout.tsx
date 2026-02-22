import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import UnifiedConnectButton from '@/components/UnifiedConnectButton';
import AppMenu from '@/components/AppMenu';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://goblink.io' 
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'goBlink — Move Value Anywhere, Instantly. Try It Now',
  description: 'Transfer tokens across 26 blockchains in under 60 seconds. One click, any chain, no bridges. Non-custodial with auto-refund on failure. Try it free.',
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
    title: 'goBlink — Move Value Anywhere, Instantly. Try It Now',
    description: 'Transfer tokens across 26 blockchains in under 60 seconds. One click, any chain, no bridges. Non-custodial with auto-refund on failure. Try it free.',
    siteName: 'goBlink',
    url: baseUrl,
    images: [{ url: `${baseUrl}/og-image.jpg`, width: 1200, height: 630, alt: 'goBlink — Transfer tokens across 26 chains in seconds. Try it now at goblink.io' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'goBlink — Move Value Anywhere, Instantly. Try It Now',
    description: 'Transfer tokens across 26 blockchains in under 60 seconds. One click, any chain, no bridges. Non-custodial with auto-refund on failure. Try it free.',
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
      var mode = localStorage.getItem('theme') || 'auto';
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
      </head>
      <body className="font-sans noise-overlay" suppressHydrationWarning>
        <ClientLayout>
          <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--surface) 80%, transparent)', borderColor: 'var(--border)' }}>
              <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                  {/* Logo & Nav */}
                  <div className="flex items-center gap-6">
                    <a href="/" className="flex items-center gap-2.5 group">
                      <img src="/icon-192.png" alt="goBlink" className="h-8 w-8 rounded-lg" />
                      <span className="text-h5 flex items-center">
                        <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>go</span>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Blink</span>
                        <span className="ml-0.5 inline-block w-[3px] h-5 rounded-sm animate-cursor-blink" style={{ background: 'var(--gradient)' }} />
                      </span>
                    </a>
                    <a href="/history" className="text-body-sm font-medium hover:opacity-70 transition-opacity hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                      History
                    </a>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2">
                    <AppMenu />
                    <UnifiedConnectButton />
                  </div>
                </div>
              </div>
            </nav>

            {/* ── Main ── */}
            <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
              {children}
            </main>

            {/* ── Footer ── */}
            <footer className="border-t mt-16 sm:mt-24" style={{ borderColor: 'var(--border)' }}>
              <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex flex-col items-center gap-6 text-center sm:text-left sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/icon-192.png" alt="goBlink" className="h-6 w-6 rounded-md" />
                    <span className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>goBlink</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <a href="/terms" className="text-caption py-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                      Terms
                    </a>
                    <a href="/privacy" className="text-caption py-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                      Privacy
                    </a>
                    <a href="https://x.com/goBlink_io" target="_blank" rel="noopener noreferrer" className="py-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }} aria-label="Follow goBlink on X">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  </div>
                  <div>
                    <p className="text-tiny" style={{ color: 'var(--text-faint)' }}>
                      &copy; 2026 goBlink
                    </p>
                  </div>
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
