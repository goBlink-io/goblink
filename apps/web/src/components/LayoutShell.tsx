'use client';

import { usePathname } from 'next/navigation';
import LandingNav from './LandingNav';
import AppMenu from './AppMenu';
import UnifiedConnectButton from './UnifiedConnectButton';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return (
      <>
        <LandingNav />
        <main>{children}</main>
      </>
    );
  }

  return (
    <>
      {/* App nav — sticky with wallet + menu */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="flex items-center gap-2.5 group">
                <img src="/icon-192.png" alt="goBlink" className="h-8 w-8 rounded-lg" />
                <span className="text-h5 flex items-center">
                  <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>go</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Blink</span>
                  <span
                    className="ml-0.5 inline-block w-[3px] h-5 rounded-sm animate-cursor-blink"
                    style={{ background: 'var(--brand)' }}
                  />
                </span>
              </a>
              <a
                href="/history"
                className="text-body-sm font-medium hover:opacity-70 transition-opacity hidden sm:block"
                style={{ color: 'var(--text-secondary)' }}
              >
                History
              </a>
            </div>
            <div className="flex items-center gap-2">
              <AppMenu />
              <UnifiedConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* App main — constrained */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>
    </>
  );
}
