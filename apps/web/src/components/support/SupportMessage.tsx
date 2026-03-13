'use client';

import React from 'react';
import { ChatMessage } from '@/lib/support/types';

interface SupportMessageProps {
  message: ChatMessage;
  onAction?: (action: string, data?: string) => void;
}

export default function SupportMessage({ message, onAction }: SupportMessageProps) {
  const isBot = message.sender === 'bot';
  
  // ── Severity colors ──
  const getSeverityStyles = () => {
    if (!message.severity || !isBot) return '';
    
    switch (message.severity) {
      case 'error':
        return 'border-red-500/30 bg-red-500/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'success':
        return 'border-green-500/30 bg-green-500/5';
      default:
        return 'border-blue-500/30 bg-blue-500/5';
    }
  };
  
  // ── Format timestamp ──
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  
  return (
    <div className={`flex gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {/* Bot avatar */}
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" 
             style={{ background: 'linear-gradient(135deg, var(--brand-light) 0%, var(--violet) 100%)', color: 'white' }}>
          gB
        </div>
      )}
      
      {/* Message bubble */}
      <div className={`max-w-[80%] ${isBot ? 'items-start' : 'items-end'} flex flex-col gap-1`}>
        <div 
          className={`rounded-2xl px-4 py-2.5 border ${
            isBot 
              ? `${getSeverityStyles()} backdrop-blur-sm`
              : 'bg-gradient-to-br from-blue-600 to-violet-600 text-white border-transparent'
          }`}
        >
          <p className="text-sm leading-relaxed" style={{ color: isBot ? 'var(--text-primary)' : 'white' }}>
            {message.text}
          </p>
          
          {/* Action buttons */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.actions.map((action) => (
                <button
                  key={`${action.action}-${action.label}`}
                  onClick={() => onAction?.(action.action, action.data)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: isBot ? 'var(--gradient)' : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <span className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>
          {formatTime(message.timestamp)}
        </span>
      </div>
      
      {/* User avatar (placeholder) */}
      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
             style={{ background: 'var(--gradient)', color: 'white' }}>
          U
        </div>
      )}
    </div>
  );
}
