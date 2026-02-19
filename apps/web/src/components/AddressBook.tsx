'use client';

import { useState, useCallback } from 'react';
import { X, Copy, Check, Trash2, BookUser } from 'lucide-react';
import { useUserProfile, SavedAddress } from '@/hooks/useUserProfile';
import { CHAIN_LOGOS } from '@/lib/chain-logos';

interface AddressBookProps {
  isOpen: boolean;
  onClose: () => void;
}

function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function AddressRow({
  entry,
  onRemove,
}: {
  entry: SavedAddress;
  onRemove: (address: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(entry.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [entry.address]);

  const chainLogo = CHAIN_LOGOS[entry.chain];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-90"
      style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
    >
      {/* Chain logo */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
        style={{ background: chainLogo?.bgColor || 'var(--surface)' }}>
        {chainLogo?.icon ? (
          <img
            src={chainLogo.icon}
            alt={chainLogo.name}
            className="w-6 h-6 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-tiny font-bold uppercase">{entry.chain.slice(0, 2)}</span>
        )}
      </div>

      {/* Label + address */}
      <div className="flex-1 min-w-0">
        <div className="text-body-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
          {entry.label}
        </div>
        <div className="font-mono text-tiny truncate" style={{ color: 'var(--text-muted)' }}>
          {truncateAddress(entry.address)} · {chainLogo?.name || entry.chain}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleCopy}
          title="Copy address"
          className="p-1.5 rounded-lg transition-all hover:opacity-80 active:scale-90"
          style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onRemove(entry.address)}
          title="Remove address"
          className="p-1.5 rounded-lg transition-all hover:opacity-80 active:scale-90"
          style={{ color: 'var(--text-faint)' }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function AddressBook({ isOpen, onClose }: AddressBookProps) {
  const { profile, hydrated, removeAddress } = useUserProfile();
  const [filterChain, setFilterChain] = useState<string>('');

  if (!isOpen) return null;

  const addresses = filterChain
    ? profile.savedAddresses.filter(a => a.chain === filterChain)
    : profile.savedAddresses;

  const chainOptions = [...new Set(profile.savedAddresses.map(a => a.chain))];

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <BookUser className="h-5 w-5" style={{ color: 'var(--brand)' }} />
            <h2 className="text-h4">Address Book</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chain filter */}
        {chainOptions.length > 1 && (
          <div className="px-5 pt-3 pb-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterChain('')}
                className="px-3 py-1 rounded-full text-tiny font-semibold transition-all"
                style={{
                  background: !filterChain ? 'var(--brand)' : 'var(--elevated)',
                  color: !filterChain ? '#fff' : 'var(--text-secondary)',
                }}
              >
                All
              </button>
              {chainOptions.map(chain => (
                <button
                  key={chain}
                  onClick={() => setFilterChain(filterChain === chain ? '' : chain)}
                  className="px-3 py-1 rounded-full text-tiny font-semibold transition-all capitalize"
                  style={{
                    background: filterChain === chain ? 'var(--brand)' : 'var(--elevated)',
                    color: filterChain === chain ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {CHAIN_LOGOS[chain]?.name || chain}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Address list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {!hydrated ? (
            <div className="text-center py-8">
              <div className="animate-pulse h-4 w-32 rounded mx-auto" style={{ background: 'var(--elevated)' }} />
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-10">
              <BookUser className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="text-body-sm" style={{ color: 'var(--text-muted)' }}>
                {filterChain ? 'No addresses saved for this chain.' : 'No saved addresses yet.'}
              </p>
              <p className="text-tiny mt-1" style={{ color: 'var(--text-faint)' }}>
                After a transfer, tap &ldquo;Save address&rdquo; to add it here.
              </p>
            </div>
          ) : (
            addresses.map(entry => (
              <AddressRow key={entry.address} entry={entry} onRemove={removeAddress} />
            ))
          )}
        </div>

        {/* Footer */}
        {profile.savedAddresses.length > 0 && (
          <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-tiny text-center" style={{ color: 'var(--text-faint)' }}>
              {profile.savedAddresses.length}/{20} addresses saved
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
