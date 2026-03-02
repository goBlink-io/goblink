'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  Zap,
  Store,
  Link2,
  BookOpen,
  FileText,
} from 'lucide-react';

const PRODUCTS = [
  {
    label: 'goBlink Swap',
    description: 'Cross-chain transfers in one click',
    href: '/app',
    external: false,
    icon: Zap,
  },
  {
    label: 'goBlink Merchant',
    description: 'Non-custodial crypto payments for businesses',
    href: 'https://merchant.goblink.io',
    external: true,
    icon: Store,
  },
  {
    label: 'goBlink Connect',
    description: 'Universal multi-chain wallet SDK',
    href: 'https://connect.goblink.io',
    external: true,
    icon: Link2,
  },
  {
    label: 'goBlink Book',
    description: 'Documentation platform for dev teams',
    href: 'https://book.goblink.io',
    external: true,
    icon: BookOpen,
  },
  {
    label: 'goBlink Docs',
    description: 'API reference & guides',
    href: 'https://docs.goblink.io',
    external: true,
    icon: FileText,
  },
];

const FLAT_LINKS = [
  { label: 'Features', href: '#features', external: false },
  { label: 'Pricing', href: '#pricing', external: false },
];

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setProductsOpen(true), 150);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setProductsOpen(false), 150);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
      style={{
        background: scrolled || mobileOpen
          ? 'color-mix(in srgb, var(--surface) 85%, transparent)'
          : 'transparent',
        backdropFilter: scrolled || mobileOpen ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled || mobileOpen ? 'blur(12px)' : 'none',
        borderBottom: scrolled
          ? '1px solid var(--border)'
          : '1px solid transparent',
      }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5">
            <img src="/icon-192.png" alt="goBlink" className="h-8 w-8 rounded-lg" />
            <span className="text-h5 flex items-center">
              <span className="font-normal" style={{ color: 'var(--text-secondary)' }}>go</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Blink</span>
              <span
                className="ml-0.5 inline-block w-[3px] h-5 rounded-sm animate-cursor-blink"
                style={{ background: 'var(--brand)' }}
              />
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {/* Products dropdown */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="text-sm font-medium transition-colors inline-link flex items-center gap-1"
                style={{ color: productsOpen ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => {
                  if (!productsOpen) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onClick={() => setProductsOpen((v) => !v)}
              >
                Products
                <ChevronDown
                  className="h-3.5 w-3.5 transition-transform duration-200"
                  style={{ transform: productsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {/* Dropdown panel */}
              <div
                className="absolute top-full left-1/2 pt-2"
                style={{
                  transform: 'translateX(-50%)',
                  pointerEvents: productsOpen ? 'auto' : 'none',
                }}
              >
                <div
                  className="rounded-xl p-2 transition-all duration-200"
                  style={{
                    minWidth: '320px',
                    background: 'color-mix(in srgb, var(--surface) 90%, transparent)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    opacity: productsOpen ? 1 : 0,
                    transform: productsOpen ? 'translateY(0)' : 'translateY(-8px)',
                  }}
                >
                  {PRODUCTS.map((product) => {
                    const Icon = product.icon;
                    return (
                      <a
                        key={product.label}
                        href={product.href}
                        {...(product.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--elevated)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Icon
                          className="h-5 w-5 mt-0.5 shrink-0"
                          style={{ color: 'var(--brand)' }}
                        />
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {product.label}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {product.description}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Flat links */}
            {FLAT_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium transition-colors inline-link"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="hidden md:inline-flex btn btn-primary items-center gap-2 !px-5 !py-2.5 text-sm font-semibold"
            >
              Launch App <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--elevated)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden pb-4 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex flex-col gap-1 pt-3">
              {/* Mobile Products section */}
              <button
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => setMobileProductsOpen((v) => !v)}
              >
                Products
                <ChevronDown
                  className="h-4 w-4 transition-transform duration-200"
                  style={{ transform: mobileProductsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-200"
                style={{
                  maxHeight: mobileProductsOpen ? `${PRODUCTS.length * 72}px` : '0px',
                  opacity: mobileProductsOpen ? 1 : 0,
                }}
              >
                <div className="pl-3 flex flex-col gap-0.5">
                  {PRODUCTS.map((product) => {
                    const Icon = product.icon;
                    return (
                      <a
                        key={product.label}
                        href={product.href}
                        {...(product.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Icon
                          className="h-5 w-5 mt-0.5 shrink-0"
                          style={{ color: 'var(--brand)' }}
                        />
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {product.label}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {product.description}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Flat links */}
              {FLAT_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}

              <Link
                href="/app"
                className="mt-2 btn btn-primary flex items-center justify-center gap-2 !px-5 !py-2.5 text-sm font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                Launch App <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
