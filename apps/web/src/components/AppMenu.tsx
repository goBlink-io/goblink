'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreHorizontal, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AppMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDevelopersOpen, setIsDevelopersOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { setMode, resolvedTheme } = useTheme();

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleDarkModeToggle = () => {
    // Simple toggle: if dark, go to light; if light or auto, go to dark
    if (resolvedTheme === 'dark') {
      setMode('light');
    } else {
      setMode('dark');
    }
  };

  return (
    <div className="relative">
      {/* Menu Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--elevated)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        title="Menu"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full sm:mt-2 w-[calc(100vw-16px)] sm:w-72 max-w-72 rounded-xl shadow-lg border overflow-hidden z-50"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            animation: 'menuFadeIn 150ms ease-out',
          }}
        >
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px]">
            <span className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
              Dark Mode
            </span>
            <button
              onClick={handleDarkModeToggle}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{
                background: resolvedTheme === 'dark' ? 'var(--gradient)' : '#4B5563',
              }}
              aria-label="Toggle dark mode"
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                style={{
                  transform: resolvedTheme === 'dark' ? 'translateX(24px)' : 'translateX(4px)',
                }}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />

          {/* History Link (mobile only) */}
          <Link
            href="/history"
            className="flex items-center px-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px] sm:hidden"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
              History
            </span>
          </Link>

          {/* Request Payment */}
          <Link
            href="/pay"
            className="flex items-center px-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px]"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
              Request Payment
            </span>
          </Link>

          {/* Developers (expandable) */}
          <div>
            <button
              onClick={() => setIsDevelopersOpen(!isDevelopersOpen)}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px]"
            >
              <span className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
                Developers
              </span>
              {isDevelopersOpen ? (
                <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              )}
            </button>

            {/* Developers Submenu */}
            {isDevelopersOpen && (
              <div className="bg-zinc-900/30">
                <Link
                  href="/widget"
                  className="flex items-center pl-8 pr-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px]"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                    Embed Widget
                  </span>
                </Link>
                <Link
                  href="/api-docs"
                  className="flex items-center pl-8 pr-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px]"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                    API Docs
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Request Feature */}
          <Link
            href="/features"
            className="flex items-center px-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px]"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
              Request Feature
            </span>
          </Link>

          {/* Docs - removed for now, users have chatbot */}
          {/* Terms/Privacy - removed for now */}
        </div>
      )}

      {/* Keyframes for animation */}
      <style jsx>{`
        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
