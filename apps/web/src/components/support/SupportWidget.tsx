'use client';

import React, { useState, useEffect } from 'react';
import { useSupportContext } from '@/contexts/SupportContext';
import { useWallet } from '@goblink/connect/react';
import { evaluateRules } from '@/lib/support/rules';
import SupportChat from './SupportChat';
import ProactiveTip from './ProactiveTip';

export default function SupportWidget() {
  const { appState } = useSupportContext();
  const { connect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [proactiveTip, setProactiveTip] = useState<any>(null);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());
  
  // ── Check for proactive tips ──
  useEffect(() => {
    // Don't show tips if chat is open
    if (isOpen) return;
    
    const tip = evaluateRules(appState, true);
    
    if (tip) {
      // Create a unique ID for this tip based on content
      const tipId = tip.text.slice(0, 50);
      
      // Don't show if already dismissed this session
      if (!dismissedTips.has(tipId)) {
        setProactiveTip(tip);
      }
    }
  }, [appState, isOpen, dismissedTips]);
  
  // ── Handle tip dismiss ──
  const handleDismissTip = () => {
    if (proactiveTip) {
      const tipId = proactiveTip.text.slice(0, 50);
      setDismissedTips(prev => new Set(prev).add(tipId));
    }
    setProactiveTip(null);
  };
  
  // ── Handle tip actions ──
  const handleTipAction = (action: string, data?: string) => {
    switch (action) {
      case 'connect-wallet':
        connect();
        break;
      case 'open-link':
        if (data) window.open(data, '_blank');
        break;
      case 'retry':
        window.location.reload();
        break;
      case 'copy':
        if (data) navigator.clipboard.writeText(data);
        break;
    }
  };
  
  return (
    <>
      {/* Proactive Tip */}
      <ProactiveTip
        tip={proactiveTip}
        onDismiss={handleDismissTip}
        onAction={handleTipAction}
      />
      
      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isOpen 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{
          width: '90vw',
          maxWidth: '350px',
          height: '500px',
          maxHeight: '80vh',
        }}
      >
        <div
          className="h-full rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border)',
          }}
        >
          <SupportChat onClose={() => setIsOpen(false)} />
        </div>
      </div>
      
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'rotate-90' : 'rotate-0'
        }`}
        style={{
          background: 'var(--gradient)',
          color: 'white',
        }}
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
      >
        {isOpen ? (
          // Close icon
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Chat icon
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        
        {/* Notification dot for proactive tips */}
        {!isOpen && proactiveTip && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </>
  );
}
