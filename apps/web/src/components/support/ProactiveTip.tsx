'use client';

import React, { useState, useEffect } from 'react';
import { SupportMessage } from '@/lib/support/types';

interface ProactiveTipProps {
  tip: SupportMessage | null;
  onDismiss: () => void;
  onAction?: (action: string, data?: string) => void;
}

export default function ProactiveTip({ tip, onDismiss, onAction }: ProactiveTipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // ── Show/hide animation ──
  useEffect(() => {
    if (tip) {
      setIsVisible(true);
      
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [tip]);
  
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(), 300); // Wait for animation
  };
  
  if (!tip) return null;
  
  // ── Severity styles ──
  const getSeverityColor = () => {
    switch (tip.severity) {
      case 'error': return 'border-red-500/50 bg-red-500/10';
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'success': return 'border-green-500/50 bg-green-500/10';
      default: return 'border-blue-500/50 bg-blue-500/10';
    }
  };
  
  return (
    <div
      className={`fixed bottom-24 right-6 max-w-sm z-40 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div
        className={`rounded-2xl border backdrop-blur-md shadow-xl p-4 ${getSeverityColor()}`}
        style={{ background: 'color-mix(in srgb, var(--surface) 95%, transparent)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                 style={{ background: 'var(--gradient)', color: 'white' }}>
              gB
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Tip</span>
          </div>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full hover:bg-zinc-700/50 transition-colors flex items-center justify-center flex-shrink-0"
            aria-label="Dismiss tip"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Message */}
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
          {tip.text}
        </p>
        
        {/* Actions */}
        {tip.actions && tip.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tip.actions.map((action) => (
              <button
                key={`${action.action}-${action.label}`}
                onClick={() => {
                  onAction?.(action.action, action.data);
                  handleDismiss();
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'var(--gradient)',
                  color: 'white',
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
