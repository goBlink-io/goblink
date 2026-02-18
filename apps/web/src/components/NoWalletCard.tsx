'use client';

import { useState } from 'react';
import { Clipboard, Shield, ArrowRight } from 'lucide-react';
import { getWalletGuide } from '@/lib/wallet-guides';
import WalletSetupGuide from './WalletSetupGuide';

interface NoWalletCardProps {
  chainId: string;
  chainName: string;
  /** Chains where the user already has a wallet connected */
  connectedChains: { id: string; name: string }[];
  /** Called when user picks "enter address manually" — focuses the address input */
  onEnterManually: () => void;
  /** Called when user picks a different chain from the connected list */
  onSwitchChain: (chainId: string) => void;
  /** Called when guided setup completes and user wants to connect wallet */
  onConnectWallet: () => void;
}

export default function NoWalletCard({
  chainId, chainName, connectedChains, onEnterManually, onSwitchChain, onConnectWallet,
}: NoWalletCardProps) {
  const [showGuide, setShowGuide] = useState(false);

  const walletConfig = getWalletGuide(chainId);
  const hasGuide = walletConfig && walletConfig.wallets.length > 0;

  return (
    <>
      <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--warning)' }} />
          <p className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            No wallet connected on {chainName}
          </p>
        </div>

        <p className="text-tiny mb-4" style={{ color: 'var(--text-muted)' }}>
          Choose how to receive your funds:
        </p>

        <div className="space-y-2">
          {/* Option 1: Enter address manually */}
          <button onClick={onEnterManually}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.005] active:scale-[0.99]"
            style={{ borderColor: 'var(--border)', background: 'transparent' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--info-bg)' }}>
              <Clipboard className="h-4 w-4" style={{ color: 'var(--info-text)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-body-sm" style={{ color: 'var(--text-primary)' }}>
                Enter an address
              </span>
              <p className="text-tiny" style={{ color: 'var(--text-muted)' }}>
                Paste any {chainName} address — yours, a friend&apos;s, or an exchange.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
          </button>

          {/* Option 2: Set up a wallet (only if we have guides) */}
          {hasGuide && (
            <button onClick={() => setShowGuide(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.005] active:scale-[0.99]"
              style={{ borderColor: 'var(--brand)', background: 'rgba(37, 99, 235, 0.05)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brand)', color: 'white' }}>
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-body-sm" style={{ color: 'var(--text-primary)' }}>
                  Set up a {chainName} wallet
                </span>
                <p className="text-tiny" style={{ color: 'var(--text-muted)' }}>
                  We&apos;ll walk you through it step by step. Takes about 2 minutes.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
            </button>
          )}

          {/* Option 3: Switch to a connected chain */}
          {connectedChains.length > 0 && (
            <div>
              <p className="text-tiny font-medium mt-3 mb-2" style={{ color: 'var(--text-faint)' }}>
                Or send to a chain you&apos;re already on:
              </p>
              <div className="flex flex-wrap gap-2">
                {connectedChains.map((chain) => (
                  <button key={chain.id} onClick={() => onSwitchChain(chain.id)}
                    className="px-3 py-1.5 rounded-lg text-tiny font-medium transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success)' }}>
                    {chain.name} ✓
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guided setup modal */}
      {showGuide && walletConfig && (
        <WalletSetupGuide
          chainConfig={walletConfig}
          onComplete={() => {
            setShowGuide(false);
            onConnectWallet();
          }}
          onClose={() => setShowGuide(false)}
        />
      )}
    </>
  );
}
