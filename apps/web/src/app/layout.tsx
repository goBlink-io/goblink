import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Web3Provider } from '@/components/Web3Provider';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import UnifiedConnectButton from '@/components/UnifiedConnectButton';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'goBlink — Move Value Anywhere, Instantly',
  description: 'Transfer tokens across 29 blockchains in seconds. One click, any chain, no bridges.',
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
    title: 'goBlink — Move Value Anywhere, Instantly',
    description: 'Transfer tokens across 29 blockchains in seconds. One click, any chain, no bridges.',
    siteName: 'goBlink',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'goBlink — Move value anywhere, instantly' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'goBlink — Move Value Anywhere, Instantly',
    description: 'Transfer tokens across 29 blockchains in seconds.',
    images: ['/og-image.png'],
    creator: '@goBlink_io',
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
      <body className="font-sans noise-overlay">
        <ThemeProvider>
        <Web3Provider>
        <ToastProvider>
          <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* ── Navbar ── */}
            <nav className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--surface) 80%, transparent)', borderColor: 'var(--border)' }}>
              <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                  {/* Logo */}
                  <a href="/" className="flex items-center gap-2.5 group">
                    <img src="/icon-192.png" alt="goBlink" className="h-8 w-8 rounded-lg" />
                    <span className="text-h5 flex items-center">
                      <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>go</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Blink</span>
                      <span className="ml-0.5 inline-block w-[3px] h-5 rounded-sm animate-cursor-blink" style={{ background: 'var(--gradient)' }} />
                    </span>
                  </a>

                  {/* Right side */}
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
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
                <div className="flex flex-col items-center gap-4 text-center sm:text-left sm:flex-row sm:justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/icon-192.png" alt="goBlink" className="h-6 w-6 rounded-md" />
                    <span className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>goBlink</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <a href="/pay" className="text-caption py-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                      Request Payment
                    </a>
                    <a href="/widget" className="text-caption py-1 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                      Embed Widget
                    </a>
                  </div>
                  <div>
                    <p className="text-caption" style={{ color: 'var(--text-muted)' }}>
                      Powered by NEAR Intents
                    </p>
                    <p className="text-tiny mt-1" style={{ color: 'var(--text-faint)' }}>
                      &copy; 2026 goBlink
                    </p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ToastProvider>
        </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
