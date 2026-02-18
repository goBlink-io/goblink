'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, ChevronRight, Check, Shield, ArrowLeft } from 'lucide-react';
import { type ChainWalletConfig, type WalletGuide, detectWallet } from '@/lib/wallet-guides';

interface WalletSetupGuideProps {
  chainConfig: ChainWalletConfig;
  onComplete: () => void;
  onClose: () => void;
}

type Step = 'choose' | 'install' | 'create' | 'connect';
const STEP_LABELS: Record<Step, string> = {
  choose: 'Choose wallet',
  install: 'Install',
  create: 'Create wallet',
  connect: 'Connect',
};
const STEPS: Step[] = ['choose', 'install', 'create', 'connect'];

export default function WalletSetupGuide({ chainConfig, onComplete, onClose }: WalletSetupGuideProps) {
  const [currentStep, setCurrentStep] = useState<Step>('choose');
  const [selectedWallet, setSelectedWallet] = useState<WalletGuide | null>(null);
  const [walletDetected, setWalletDetected] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);

  // Poll for wallet extension detection
  useEffect(() => {
    if (currentStep !== 'install' || !selectedWallet) return;

    const checkInstalled = () => {
      if (detectWallet(selectedWallet)) {
        setWalletDetected(true);
      }
    };

    checkInstalled();
    const interval = setInterval(checkInstalled, 1500);
    return () => clearInterval(interval);
  }, [currentStep, selectedWallet]);

  const handleSelectWallet = useCallback((wallet: WalletGuide) => {
    setSelectedWallet(wallet);
    setWalletDetected(detectWallet(wallet));

    // If already installed, skip install step
    if (detectWallet(wallet)) {
      setCurrentStep('create');
    } else if (!wallet.chromeUrl) {
      // Web-based wallet (e.g., MyNearWallet) — skip install, go to create
      setCurrentStep('create');
    } else {
      setCurrentStep('install');
    }
  }, []);

  const goBack = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1]);
    }
  };

  const primary = chainConfig.wallets.find(w => w.primary);
  const others = chainConfig.wallets.filter(w => !w.primary);
  const steps = selectedWallet?.setupSteps || chainConfig.defaultSteps;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full sm:mx-4"
        style={{ maxHeight: '90vh' }}>
        <div className="rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              {currentStep !== 'choose' && (
                <button onClick={goBack} className="p-1 rounded-lg transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}>
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h3 className="text-h5" style={{ color: 'var(--text-primary)' }}>
                Set up a {chainConfig.chainName} wallet
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => (
                <div key={step} className="flex-1 flex items-center gap-1">
                  <div className="flex-1 h-1 rounded-full transition-colors"
                    style={{
                      background: i <= stepIndex ? 'var(--brand)' : 'var(--elevated)',
                    }} />
                </div>
              ))}
            </div>
            <p className="text-tiny mt-2" style={{ color: 'var(--text-muted)' }}>
              Step {stepIndex + 1} of {STEPS.length} — {STEP_LABELS[currentStep]}
            </p>
          </div>

          {/* Content */}
          <div className="px-5 pb-5 overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>

            {/* ── Step 1: Choose Wallet ── */}
            {currentStep === 'choose' && (
              <div className="mt-3 space-y-3">
                {primary && (
                  <div>
                    <p className="text-tiny font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                      ✨ We recommend
                    </p>
                    <button onClick={() => handleSelectWallet(primary)}
                      className="w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                      style={{ background: 'var(--elevated)', borderColor: 'var(--brand)' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{primary.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-body" style={{ color: 'var(--text-primary)' }}>
                              {primary.name}
                            </span>
                            {primary.users && (
                              <span className="text-tiny px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--info-bg)', color: 'var(--info-text)' }}>
                                {primary.users} users
                              </span>
                            )}
                          </div>
                          <p className="text-tiny mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {primary.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
                      </div>
                    </button>
                  </div>
                )}

                {others.length > 0 && (
                  <div>
                    <p className="text-tiny font-medium mb-2" style={{ color: 'var(--text-faint)' }}>
                      Other options
                    </p>
                    <div className="space-y-2">
                      {others.map((wallet) => (
                        <button key={wallet.name} onClick={() => handleSelectWallet(wallet)}
                          className="w-full p-3 rounded-xl border text-left transition-all hover:scale-[1.005] active:scale-[0.99]"
                          style={{ background: 'transparent', borderColor: 'var(--border)' }}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{wallet.icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-body-sm" style={{ color: 'var(--text-primary)' }}>
                                {wallet.name}
                              </span>
                              <p className="text-tiny" style={{ color: 'var(--text-muted)' }}>
                                {wallet.description}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Install Extension ── */}
            {currentStep === 'install' && selectedWallet && (
              <div className="mt-3 space-y-4">
                <div className="text-center py-2">
                  <span className="text-4xl">{selectedWallet.icon}</span>
                  <h4 className="text-h5 mt-2" style={{ color: 'var(--text-primary)' }}>
                    Install {selectedWallet.name}
                  </h4>
                </div>

                {selectedWallet.chromeUrl && (
                  <a href={selectedWallet.chromeUrl} target="_blank" rel="noopener noreferrer"
                    className="btn btn-primary w-full h-12 text-body-sm flex items-center justify-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Install from Chrome Web Store
                  </a>
                )}

                <div className="p-4 rounded-xl text-center"
                  style={{ background: 'var(--elevated)' }}>
                  {walletDetected ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--success-bg)' }}>
                        <Check className="h-5 w-5" style={{ color: 'var(--success)' }} />
                      </div>
                      <p className="font-semibold text-body-sm" style={{ color: 'var(--success-text)' }}>
                        {selectedWallet.name} detected!
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-center mb-2">
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                          style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
                      </div>
                      <p className="text-body-sm" style={{ color: 'var(--text-muted)' }}>
                        Waiting for {selectedWallet.name}...
                      </p>
                      <p className="text-tiny mt-1" style={{ color: 'var(--text-faint)' }}>
                        Install the extension, then this will update automatically
                      </p>
                    </div>
                  )}
                </div>

                <button onClick={() => setCurrentStep('create')}
                  disabled={!walletDetected}
                  className="btn btn-primary w-full h-11 text-body-sm"
                  style={{ opacity: walletDetected ? 1 : 0.4 }}>
                  Continue
                </button>

                {/* Manual override for web-based wallets or if detection fails */}
                {!walletDetected && (
                  <button onClick={() => setCurrentStep('create')}
                    className="w-full text-center text-tiny py-2 transition-colors hover:opacity-80"
                    style={{ color: 'var(--text-faint)' }}>
                    I already installed it — continue anyway
                  </button>
                )}
              </div>
            )}

            {/* ── Step 3: Create & Secure ── */}
            {currentStep === 'create' && selectedWallet && (
              <div className="mt-3 space-y-4">
                <div className="text-center py-2">
                  <span className="text-4xl">{selectedWallet.icon}</span>
                  <h4 className="text-h5 mt-2" style={{ color: 'var(--text-primary)' }}>
                    Create your wallet
                  </h4>
                </div>

                {/* Step-by-step guidance */}
                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--elevated)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-tiny font-bold"
                        style={{ background: 'var(--brand)', color: 'white' }}>
                        {i + 1}
                      </div>
                      <p className="text-body-sm pt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Security reminder */}
                <div className="p-4 rounded-xl flex gap-3"
                  style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)' }}>
                  <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                  <div>
                    <p className="font-semibold text-body-sm" style={{ color: 'var(--warning-text)' }}>
                      Security reminder
                    </p>
                    <p className="text-tiny mt-1" style={{ color: 'var(--warning-text)' }}>
                      Your recovery phrase is the <strong>only</strong> way to recover your wallet.
                      Write it on paper. Never share it. Never screenshot it.
                    </p>
                    <p className="text-tiny mt-2 font-semibold" style={{ color: 'var(--warning-text)' }}>
                      goBlink will NEVER ask for your recovery phrase.
                    </p>
                  </div>
                </div>

                {/* Open wallet to create */}
                {selectedWallet.url && (
                  <a href={selectedWallet.chromeUrl || selectedWallet.url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-primary w-full h-12 text-body-sm flex items-center justify-center gap-2">
                    Open {selectedWallet.name} to create wallet
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                <button onClick={() => setCurrentStep('connect')}
                  className="btn w-full h-11 text-body-sm"
                  style={{ background: 'var(--elevated)', color: 'var(--text-primary)' }}>
                  I&apos;ve created my wallet — next
                </button>
              </div>
            )}

            {/* ── Step 4: Connect ── */}
            {currentStep === 'connect' && selectedWallet && (
              <div className="mt-3 space-y-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
                    style={{ background: 'var(--success-bg)' }}>
                    <Check className="h-8 w-8" style={{ color: 'var(--success)' }} />
                  </div>
                  <h4 className="text-h5" style={{ color: 'var(--text-primary)' }}>
                    Wallet created!
                  </h4>
                  <p className="text-body-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                    Now let&apos;s connect {selectedWallet.name} to goBlink so we can auto-fill your receiving address.
                  </p>
                </div>

                <button onClick={onComplete}
                  className="btn btn-primary w-full h-12 text-body-sm">
                  Connect {selectedWallet.name}
                </button>

                <button onClick={onClose}
                  className="w-full text-center text-tiny py-2 transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-faint)' }}>
                  I&apos;ll connect later — just let me enter an address
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
