'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSupportContext } from '@/contexts/SupportContext';
import { useWallet } from '@goblink/connect/react';
import { ChatMessage } from '@/lib/support/types';
import { getResponseForMessage, getQuickReplies, getFallbackMessage } from '@/lib/support/matcher';
import SupportMessageComponent from './SupportMessage';

interface SupportChatProps {
  onClose: () => void;
}

export default function SupportChat({ onClose }: SupportChatProps) {
  const { appState } = useSupportContext();
  const { connect } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const quickReplies = getQuickReplies();
  
  // ── Auto-scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  // ── Initial greeting ──
  useEffect(() => {
    const greeting: ChatMessage = {
      id: 'greeting',
      text: "👋 Hi! I'm here to help with your goBlink transfers. What can I help you with?",
      sender: 'bot',
      timestamp: Date.now(),
      severity: 'info',
    };
    setMessages([greeting]);
  }, []);
  
  // ── Handle sending message ──
  const handleSend = async (overrideText?: string) => {
    const text = overrideText ?? input;
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Show typing indicator
    setIsTyping(true);

    // Brief delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 600));

    // Get response
    const response = getResponseForMessage(text, appState) || getFallbackMessage();

    const botMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      text: response.text,
      sender: 'bot',
      timestamp: Date.now(),
      severity: response.severity,
      actions: response.actions,
    };

    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
  };

  // ── Handle quick reply ──
  const handleQuickReply = (message: string) => {
    handleSend(message);
  };
  
  // ── Handle action buttons ──
  const handleAction = (action: string, data?: string) => {
    switch (action) {
      case 'connect-wallet':
        connect();
        break;
      case 'open-link':
        if (data) window.open(data, '_blank');
        break;
      case 'retry':
        // Refresh the page or trigger a re-quote
        window.location.reload();
        break;
      case 'copy':
        if (data) {
          navigator.clipboard.writeText(data);
          // Show a brief confirmation
          setMessages(prev => [...prev, {
            id: `bot-${Date.now()}`,
            text: '✓ Copied to clipboard!',
            sender: 'bot',
            timestamp: Date.now(),
            severity: 'success',
          }]);
        }
        break;
    }
  };
  
  // ── Handle Enter key ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
               style={{ background: 'var(--gradient)', color: 'white' }}>
            gB
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>goBlink Support</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Always here to help</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-zinc-800/50 transition-colors flex items-center justify-center"
          aria-label="Close support chat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <SupportMessageComponent
            key={msg.id}
            message={msg}
            onAction={handleAction}
          />
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                 style={{ background: 'var(--gradient)', color: 'white' }}>
              gB
            </div>
            <div className="flex gap-1 px-4 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/50">
              <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick replies */}
      {messages.length <= 2 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickReply(reply.message)}
                className="px-3 py-1.5 text-xs rounded-full border transition-all hover:scale-105 active:scale-95"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  background: 'var(--surface)',
                }}
              >
                {reply.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2.5 rounded-xl border outline-none transition-colors text-sm"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: input.trim() ? 'var(--gradient)' : 'var(--surface)',
              color: 'white',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
