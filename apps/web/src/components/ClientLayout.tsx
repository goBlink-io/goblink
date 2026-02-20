'use client';

import { ReactNode } from 'react';
import { Web3Provider } from '@/components/Web3Provider';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SupportProvider } from '@/contexts/SupportContext';
import dynamic from 'next/dynamic';

// Lazy-load the support widget to not impact initial page load
const SupportWidget = dynamic(() => import('@/components/support/SupportWidget'), {
  ssr: false,
  loading: () => null,
});

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <Web3Provider>
        <SupportProvider>
          <ToastProvider>
            {children}
            <SupportWidget />
          </ToastProvider>
        </SupportProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}
