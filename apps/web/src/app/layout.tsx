import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/components/Web3Provider';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import UnifiedConnectButton from '@/components/UnifiedConnectButton';
import ThemeToggle from '@/components/ThemeToggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'goBlink - Cross-Chain Transfers Made Simple',
  description: 'Send and convert tokens across 20+ blockchains in seconds. No bridges, no complexity.',
};

// Inline script to prevent flash of wrong theme on load
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
        <Web3Provider>
        <ToastProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                      goBlink
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <UnifiedConnectButton />
                  </div>
                </div>
              </div>
            </nav>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 py-8">
              <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
                <p>Cross-chain transfers made simple</p>
                <p className="mt-2">Supporting 20+ blockchains including Ethereum, Bitcoin, Solana, NEAR, and more</p>
                <p className="mt-2 text-xs">&copy; 2026 goBlink. Powered by NEAR Intents.</p>
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
