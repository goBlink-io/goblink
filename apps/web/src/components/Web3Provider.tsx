'use client';

import { BlinkConnectProvider } from '@goblink/connect/react';
import type { ReactNode } from 'react';

const config = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '',
  appName: 'goBlink',
  appIcon: 'https://goblink.io/icon.png',
  appUrl: 'https://goblink.io',
  theme: 'dark' as const,
  features: {
    multiConnect: true,
    persistSession: true,
    socialLogin: true,
  },
};

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <BlinkConnectProvider config={config}>
      {children}
    </BlinkConnectProvider>
  );
}
