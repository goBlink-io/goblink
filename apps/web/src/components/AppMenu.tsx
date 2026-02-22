'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreHorizontal, ChevronDown, ChevronRight, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';

export default function AppMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDevelopersOpen, setIsDevelopersOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { mode, setMode } = useTheme();

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

  const THEME_OPTIONS: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun,     label: 'Light' },
    { value: 'auto',  icon: Monitor, label: 'Auto'  },
    { value: 'dark',  icon: Moon,    label: 'Dark'  },
  ];

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
          {/* Appearance — 3-way segmented control */}
          <div className="px-4 py-3">
            <span className="block text-xs font-medium mb-2.5" style={{ color: 'var(--text-muted)' }}>
              Appearance
            </span>
            <div
              className="grid grid-cols-3 gap-1 p-1 rounded-xl"
              style={{ background: 'var(--bg-primary)' }}
              role="group"
              aria-label="Appearance"
            >
              {THEME_OPTIONS.map(({ value, icon: Icon, label }) => {
                const active = mode === value;
                return (
                  <button
                    key={value}
                    onClick={() => setMode(value)}
                    aria-pressed={active}
                    aria-label={label}
                    className="flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: active ? 'var(--gradient)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-muted)',
                      boxShadow: active ? '0 1px 6px rgba(37,99,235,0.25)' : 'none',
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
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

          {/* Report an Issue */}
          <a
            href="mailto:admin@goblink.io?subject=Bug Report&body=Describe the issue you encountered:"
            className="flex items-center px-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px]"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
              Report an Issue
            </span>
          </a>

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

          {/* Follow on X */}
          <a
            href="https://x.com/goBlink_io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px]"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
              Follow on X
            </span>
            <svg className="ml-auto h-4 w-4" style={{ color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />

          {/* Terms of Service */}
          <Link
            href="/terms"
            className="flex items-center px-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px]"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
              Terms of Service
            </span>
          </Link>

          {/* Privacy Policy */}
          <Link
            href="/privacy"
            className="flex items-center px-4 py-3 hover:bg-zinc-800/50 transition-colors min-h-[44px]"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
              Privacy Policy
            </span>
          </Link>
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
