'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWalletContext, ChainType } from '@/contexts/WalletContext';
import { getChainLogo } from '@/lib/chain-logos';
import { Wallet, ChevronDown, X, Plus } from 'lucide-react';

const CHAIN_LABELS: Record<ChainType, string> = {
  evm: 'EVM', solana: 'Solana', sui: 'Sui', near: 'NEAR', bitcoin: 'Bitcoin',
  aptos: 'Aptos', starknet: 'Starknet', ton: 'TON', tron: 'Tron',
};

function formatAddress(address: string) {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function UnifiedConnectButton() {
  const { connectedWallets, openModal, disconnectChain, disconnectAll } = useWalletContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const count = connectedWallets.length;

  // Not connected — big CTA
  if (count === 0) {
    return (
      <button onClick={openModal}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl text-sm">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </button>
    );
  }

  // Connected — show primary wallet + dropdown
  const primary = connectedWallets[0];
  const primaryLogo = getChainLogo(primary.chain === 'evm' ? 'ethereum' : primary.chain);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
        {/* Primary chain icon */}
        {primaryLogo && (
          <img src={primaryLogo.icon} alt="" className="w-5 h-5 rounded-full"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <span className="font-medium text-gray-900 dark:text-white max-w-[100px] truncate">
          {formatAddress(primary.address)}
        </span>
        {count > 1 && (
          <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold">
            +{count - 1}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Connected Wallets
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{count}</span>
            </div>
          </div>

          {/* Wallet list */}
          <div className="py-1">
            {connectedWallets.map(({ chain, address }) => {
              const logo = getChainLogo(chain === 'evm' ? 'ethereum' : chain);
              return (
                <div key={chain} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Chain logo */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: logo?.bgColor || '#f3f4f6' }}>
                    {logo ? (
                      <img src={logo.icon} alt={logo.name} className="w-5 h-5 rounded-full"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span className="text-xs font-bold text-gray-500">{CHAIN_LABELS[chain]?.[0]}</span>
                    )}
                  </div>

                  {/* Chain + address */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{CHAIN_LABELS[chain]}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{formatAddress(address)}</div>
                  </div>

                  {/* Disconnect */}
                  <button onClick={(e) => { e.stopPropagation(); disconnectChain(chain); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title={`Disconnect ${CHAIN_LABELS[chain]}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 dark:border-gray-800 py-1">
            <button onClick={() => { openModal(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <Plus className="h-4 w-4" />
              Connect Another Chain
            </button>
            {count > 1 && (
              <button onClick={() => { disconnectAll(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <X className="h-4 w-4" />
                Disconnect All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
