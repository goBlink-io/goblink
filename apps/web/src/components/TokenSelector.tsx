'use client';

import { useState, useRef, useEffect } from 'react';

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

export default function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  balances,
  loadingBalances,
  label,
  placeholder = 'Select a token'
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getTokenDisplayName = (symbol: string) => {
    // Replace OMFT/OMDEP suffixes for cleaner display
    return symbol.replace(/\.(omft|omdep)$/, '');
  };

  const selectedTokenData = tokens.find(t => t.assetId === selectedToken);

  const filteredTokens = searchTerm
    ? tokens.filter(token => 
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tokens;

  return (
    <div className="mb-2 relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {/* Selected token display / trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        {selectedTokenData ? (
          <div className="flex items-center gap-3 flex-1">
            {selectedTokenData.icon ? (
              <img 
                src={selectedTokenData.icon} 
                alt={selectedTokenData.symbol}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to a placeholder if image fails to load
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="16" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="14" font-family="Arial"%3E' + selectedTokenData.symbol.charAt(0) + '%3C/text%3E%3C/svg%3E';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                {getTokenDisplayName(selectedTokenData.symbol).charAt(0)}
              </div>
            )}
            <div className="flex flex-col items-start">
              <span className="font-semibold text-gray-900">
                {getTokenDisplayName(selectedTokenData.symbol)}
              </span>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>
                  Balance: {loadingBalances ? '...' : (balances[selectedTokenData.assetId] || '0.00')}
                </span>
                {(selectedTokenData.priceUsd || selectedTokenData.price) && (
                  <>
                    <span>•</span>
                    <span>
                      ${Number(selectedTokenData.priceUsd || selectedTokenData.price).toFixed(
                        Number(selectedTokenData.priceUsd || selectedTokenData.price) < 0.01 ? 6 : 2
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}

        {/* Dropdown arrow */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tokens..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Token list */}
          <div className="overflow-y-auto max-h-80">
            {filteredTokens.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No tokens found
              </div>
            ) : (
              filteredTokens.map((token) => {
                const balance = balances[token.assetId] || '0.00';
                const price = token.priceUsd || token.price;
                const isSelected = token.assetId === selectedToken;

                return (
                  <button
                    key={token.assetId}
                    type="button"
                    onClick={() => {
                      onSelect(token.assetId);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                      isSelected ? 'bg-blue-100' : ''
                    }`}
                  >
                    {/* Token icon */}
                    {token.icon ? (
                      <img 
                        src={token.icon} 
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          // Fallback to placeholder
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="18" font-family="Arial"%3E' + token.symbol.charAt(0) + '%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {getTokenDisplayName(token.symbol).charAt(0)}
                      </div>
                    )}

                    {/* Token info */}
                    <div className="flex-1 flex flex-col items-start min-w-0">
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-semibold text-gray-900 truncate">
                          {getTokenDisplayName(token.symbol)}
                        </span>
                        {token.name && (
                          <span className="text-xs text-gray-400 truncate">
                            {token.name}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>
                          Balance: {loadingBalances ? '...' : balance}
                        </span>
                        {price && (
                          <>
                            <span>•</span>
                            <span>
                              ${Number(price).toFixed(Number(price) < 0.01 ? 6 : 2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <svg
                        className="w-5 h-5 text-blue-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
