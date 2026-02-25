'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { getChainLogo } from '@/lib/chain-logos';

const EVM_CHAINS = [
  { id: 'base', name: 'Base' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'bsc', name: 'BNB Chain' },
];

const TOKENS_BY_CHAIN: Record<string, string[]> = {
  base:      ['USDC', 'USDT', 'DAI', 'ETH'],
  ethereum:  ['USDC', 'USDT', 'DAI', 'ETH'],
  arbitrum:  ['USDC', 'USDT', 'DAI', 'ETH'],
  optimism:  ['USDC', 'USDT', 'DAI', 'ETH'],
  polygon:   ['USDC', 'USDT', 'DAI', 'POL'],
  bsc:       ['USDC', 'USDT', 'DAI', 'BNB'],
};

type FrameType = 'pay' | 'tip';

export default function FarcasterFrameBuilder() {
  const [frameType, setFrameType] = useState<FrameType>('pay');
  const [chain, setChain] = useState('base');
  const [token, setToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');

  const tokens = TOKENS_BY_CHAIN[chain] || ['USDC'];
  const chainLogo = getChainLogo(chain);

  // Reset token if not available on new chain
  const handleChainChange = (newChain: string) => {
    setChain(newChain);
    const newTokens = TOKENS_BY_CHAIN[newChain] || ['USDC'];
    if (!newTokens.includes(token)) {
      setToken(newTokens[0]);
    }
    setGeneratedUrl('');
  };

  const isValidAddress = recipient.trim().startsWith('0x') && recipient.trim().length === 42;
  const isValidAmount = frameType === 'tip' || (amount && parseFloat(amount) > 0);
  const isValid = isValidAddress && isValidAmount;

  const handleGenerate = () => {
    if (!isValid) return;

    const base = 'https://goblink.io';
    const params = new URLSearchParams();
    params.set('to', recipient.trim());
    params.set('token', token);
    params.set('chain', chain);

    if (frameType === 'pay') {
      params.set('amount', amount.trim());
      setGeneratedUrl(`${base}/frames/pay?${params.toString()}`);
    } else {
      setGeneratedUrl(`${base}/frames/tip?${params.toString()}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleReset = () => {
    setGeneratedUrl('');
    setCopied(false);
  };

  const inputStyle = {
    background: 'var(--elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '0.375rem',
  };

  return (
    <div className="card p-6 space-y-5">
      {/* Frame type toggle */}
      <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {(['pay', 'tip'] as FrameType[]).map((type) => (
          <button
            key={type}
            onClick={() => { setFrameType(type); setGeneratedUrl(''); }}
            className="flex-1 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: frameType === type ? 'var(--brand)' : 'var(--elevated)',
              color: frameType === type ? 'white' : 'var(--text-muted)',
            }}
          >
            {type === 'pay' ? '💸 Pay Frame' : '🎁 Tip Frame'}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
        {frameType === 'pay'
          ? 'Create a payment frame — the payer clicks one button and signs the transaction inside Warpcast.'
          : 'Create a tip frame — the payer picks $1, $5, $10, or enters a custom amount.'}
      </p>

      {/* Recipient */}
      <div>
        <label style={labelStyle}>Recipient address <span style={{ color: 'var(--error)' }}>*</span></label>
        <input
          type="text"
          placeholder="0x..."
          value={recipient}
          onChange={e => { setRecipient(e.target.value); setGeneratedUrl(''); }}
          style={inputStyle}
          className="font-mono"
        />
        {recipient && !isValidAddress && (
          <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>
            Enter a valid EVM address (0x + 40 hex characters)
          </p>
        )}
      </div>

      {/* Chain + Token */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Chain <span style={{ color: 'var(--error)' }}>*</span></label>
          <div className="relative">
            <select
              value={chain}
              onChange={e => handleChainChange(e.target.value)}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: '2.5rem' }}
            >
              {EVM_CHAINS.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {chainLogo?.icon && (
              <img
                src={chainLogo.icon}
                alt={chainLogo.name}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full pointer-events-none"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Token <span style={{ color: 'var(--error)' }}>*</span></label>
          <select
            value={token}
            onChange={e => { setToken(e.target.value); setGeneratedUrl(''); }}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
          >
            {tokens.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Amount — only for Pay */}
      {frameType === 'pay' && (
        <div>
          <label style={labelStyle}>Amount <span style={{ color: 'var(--error)' }}>*</span></label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="any"
              value={amount}
              onChange={e => { setAmount(e.target.value); setGeneratedUrl(''); }}
              style={{ ...inputStyle, paddingRight: '4rem' }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            >
              {token}
            </span>
          </div>
        </div>
      )}

      {/* Generate / Result */}
      {!generatedUrl ? (
        <button
          onClick={handleGenerate}
          disabled={!isValid}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
          style={{
            background: isValid ? 'var(--gradient)' : 'var(--elevated)',
            color: isValid ? 'white' : 'var(--text-muted)',
            cursor: isValid ? 'pointer' : 'not-allowed',
          }}
        >
          Generate Frame Link
        </button>
      ) : (
        <div className="space-y-3">
          {/* Preview */}
          <div
            className="p-4 rounded-xl space-y-2"
            style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Your Farcaster Frame link
            </p>
            <p
              className="text-xs font-mono break-all"
              style={{ color: 'var(--brand)' }}
            >
              {generatedUrl}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Paste this in a Farcaster cast. Warpcast renders it as an interactive card.
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCopy}
              className="py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
              style={{ background: 'var(--elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              {copied ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--success)' }} /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
              style={{ background: 'var(--elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', textDecoration: 'none' }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Preview
            </a>
            <button
              onClick={handleReset}
              className="py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-80"
              style={{ background: 'var(--elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
