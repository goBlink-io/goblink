import type { Metadata } from 'next';
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
      <body className="font-sans">
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
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient)' }}>
                      <span className="text-white font-bold text-sm font-mono">gB</span>
                    </div>
                    <span className="text-h5">
                      <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>go</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Blink</span>
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
            <footer className="border-t mt-24" style={{ borderColor: 'var(--border)' }}>
              <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: 'var(--gradient)' }}>
                      <span className="text-white font-bold text-[10px] font-mono">gB</span>
                    </div>
                    <span className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>goBlink</span>
                  </div>
                  <p className="text-caption" style={{ color: 'var(--text-muted)' }}>
                    Move value anywhere, instantly. Powered by NEAR Intents.
                  </p>
                  <p className="text-tiny" style={{ color: 'var(--text-faint)' }}>
                    &copy; 2026 goBlink
                  </p>
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
