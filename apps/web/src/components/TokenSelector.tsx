'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Check, ChevronDown, X } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';

/** Format balance for display — full precision kept internally, truncated visually */
function formatBal(raw: string): string {
  const n = parseFloat(raw);
  if (isNaN(n) || n === 0) return '0.00';
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(4);
  // For small values, show up to 6 significant digits
  const s = n.toPrecision(6);
  return parseFloat(s).toString();
}

interface Token {
  assetId: string;
  symbol: string;
  name?: string;
  icon?: string;
  priceUsd?: string | number;
  price?: string | number;
  blockchain?: string;
  decimals?: number;
}

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: string;
  onSelect: (assetId: string) => void;
  balances: Record<string, string>;
  loadingBalances: boolean;
  label: string;
  placeholder?: string;
}

const cleanSymbol = (s: string) => s.replace(/\.(omft|omdep)$/, '');

export default function TokenSelector({
  tokens, selectedToken, onSelect, balances, loadingBalances, label, placeholder = 'Select a token'
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const selected = tokens.find(t => t.assetId === selectedToken);
  const filtered = (search
    ? tokens.filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name?.toLowerCase().includes(search.toLowerCase()))
    : tokens
  ).slice().sort((a, b) => a.symbol.localeCompare(b.symbol));

  const close = () => { setIsOpen(false); setSearch(''); };

  return (
    <div className="mb-2">
      <label className="block text-caption font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>

      {/* Trigger */}
      <button type="button" onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors"
        style={{ background: 'var(--elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
        {selected ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {selected.icon ? (
              <img src={selected.icon} alt="" className="w-7 h-7 rounded-full flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: 'var(--gradient)' }}>
                {cleanSymbol(selected.symbol)[0]}
              </div>
            )}
            <div className="flex flex-col items-start min-w-0">
              <span className="font-semibold text-body-sm truncate">{cleanSymbol(selected.symbol)}</span>
              <span className="text-tiny truncate" style={{ color: 'var(--text-muted)' }}>
                {loadingBalances ? '...' : `Bal: ${formatBal(balances[selected.assetId] || '0')}`}
                {(selected.priceUsd || selected.price) && ` · $${Number(selected.priceUsd || selected.price).toFixed(Number(selected.priceUsd || selected.price) < 0.01 ? 6 : 2)}`}
              </span>
            </div>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Full-screen bottom sheet on mobile, centered modal on desktop */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          
          {/* Panel — bottom sheet mobile, centered desktop */}
          <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full sm:mx-4"
            style={{ maxHeight: '85vh' }}>
            <div className="rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '85vh' }}>
              
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-h5" style={{ color: 'var(--text-primary)' }}>{label}</h3>
                <button onClick={close} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  <input ref={searchRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tokens..."
                    className="input w-full pl-9 h-11 text-body-sm"
                  />
                </div>
              </div>

              {/* Token list */}
              <div className="overflow-y-auto flex-1 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                {tokens.length === 0 ? (
                  <div className="px-4 py-3 space-y-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-20 mb-1.5" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="px-4 py-12 text-center text-body-sm" style={{ color: 'var(--text-muted)' }}>No tokens found</div>
                ) : (
                  filtered.map((token) => {
                    const bal = balances[token.assetId] || '0.00';
                    const price = token.priceUsd || token.price;
                    const isSel = token.assetId === selectedToken;

                    return (
                      <button key={token.assetId} type="button"
                        onClick={() => { onSelect(token.assetId); close(); }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors active:scale-[0.99]"
                        style={{ background: isSel ? 'var(--elevated)' : 'transparent' }}>
                        {token.icon ? (
                          <img src={token.icon} alt="" className="w-10 h-10 rounded-full flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: 'var(--gradient)' }}>
                            {cleanSymbol(token.symbol)[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-body-sm" style={{ color: 'var(--text-primary)' }}>{cleanSymbol(token.symbol)}</span>
                            {token.name && <span className="text-tiny truncate" style={{ color: 'var(--text-faint)' }}>{token.name}</span>}
                          </div>
                          <div className="text-tiny" style={{ color: 'var(--text-muted)' }}>
                            {loadingBalances ? '...' : `Bal: ${formatBal(bal)}`}
                            {price && ` · $${Number(price).toFixed(Number(price) < 0.01 ? 6 : 2)}`}
                          </div>
                        </div>
                        {isSel && <Check className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--brand)' }} />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
