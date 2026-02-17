import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/components/Web3Provider';
import { ToastProvider } from '@/contexts/ToastContext';
import UnifiedConnectButton from '@/components/UnifiedConnectButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'goBlink - Cross-Chain Transfers Made Simple',
  description: 'Send and convert tokens across 20+ blockchains in seconds. No bridges, no complexity.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
        <ToastProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      goBlink
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <UnifiedConnectButton />
                  </div>
                </div>
              </div>
            </nav>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="mt-16 border-t border-gray-200 bg-white/50 py-8">
              <div className="container mx-auto px-4 text-center text-sm text-gray-600">
                <p>Cross-chain transfers made simple</p>
                <p className="mt-2">Supporting 20+ blockchains including Ethereum, Bitcoin, Solana, NEAR, and more</p>
                <p className="mt-2 text-xs">&copy; 2026 goBlink. Powered by NEAR Intents.</p>
              </div>
            </footer>
          </div>
        </ToastProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
