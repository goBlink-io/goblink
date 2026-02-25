'use client';

import { useState, useMemo } from 'react';
import { Check, Copy, ExternalLink, ArrowRight } from 'lucide-react';
import { getChainLogo } from '@/lib/chain-logos';

// Source chains — EVM only (Farcaster wallets are EVM)
const SOURCE_CHAINS = [
  { id: 'base', name: 'Base' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'bsc', name: 'BNB Chain' },
];

// Destination chains — ANY chain goBlink supports
const DEST_CHAINS = [
  { id: 'base', name: 'Base' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'bsc', name: 'BNB Chain' },
  { id: 'solana', name: 'Solana' },
  { id: 'near', name: 'NEAR' },
  { id: 'sui', name: 'Sui' },
  { id: 'aptos', name: 'Aptos' },
  { id: 'tron', name: 'Tron' },
];

const SOURCE_TOKENS: Record<string, string[]> = {
  base:      ['USDC', 'USDT', 'DAI', 'ETH'],
  ethereum:  ['USDC', 'USDT', 'DAI', 'ETH'],
  arbitrum:  ['USDC', 'USDT', 'DAI', 'ETH'],
  optimism:  ['USDC', 'USDT', 'DAI', 'ETH'],
  polygon:   ['USDC', 'USDT', 'DAI', 'POL'],
  bsc:       ['USDC', 'USDT', 'DAI', 'BNB'],
};

const DEST_TOKENS: Record<string, string[]> = {
  base:      ['USDC', 'USDT', 'DAI', 'ETH'],
  ethereum:  ['USDC', 'USDT', 'DAI', 'ETH'],
  arbitrum:  ['USDC', 'USDT', 'DAI', 'ETH'],
  optimism:  ['USDC', 'USDT', 'DAI', 'ETH'],
  polygon:   ['USDC', 'USDT', 'DAI', 'POL'],
  bsc:       ['USDC', 'USDT', 'DAI', 'BNB'],
  solana:    ['USDC', 'USDT', 'SOL'],
  near:      ['USDC', 'USDT', 'NEAR'],
  sui:       ['USDC', 'SUI'],
  aptos:     ['APT'],
  tron:      ['USDT', 'TRX'],
};

type FrameType = 'pay' | 'tip';

export default function FarcasterFrameBuilder() {
  const [frameType, setFrameType] = useState<FrameType>('pay');
  const [sourceChain, setSourceChain] = useState('base');
  const [sourceToken, setSourceToken] = useState('USDC');
  const [destChain, setDestChain] = useState('base');
  const [destToken, setDestToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');

  const sourceTokens = SOURCE_TOKENS[sourceChain] || ['USDC'];
  const destTokens = DEST_TOKENS[destChain] || ['USDC'];
  const sourceChainLogo = getChainLogo(sourceChain);
  const destChainLogo = getChainLogo(destChain);

  const isCrossChain = useMemo(() => {
    return sourceChain !== destChain || sourceToken !== destToken;
  }, [sourceChain, destChain, sourceToken, destToken]);

  const handleSourceChainChange = (chain: string) => {
    setSourceChain(chain);
    const tokens = SOURCE_TOKENS[chain] || ['USDC'];
    if (!tokens.includes(sourceToken)) setSourceToken(tokens[0]);
    setGeneratedUrl('');
  };

  const handleDestChainChange = (chain: string) => {
    setDestChain(chain);
    const tokens = DEST_TOKENS[chain] || ['USDC'];
    if (!tokens.includes(destToken)) setDestToken(tokens[0]);
    setGeneratedUrl('');
  };

  // Validate recipient based on destination chain
  const isValidAddress = useMemo(() => {
    const addr = recipient.trim();
    if (!addr) return false;
    const evmChains = ['base', 'ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc'];
    if (evmChains.includes(destChain)) return addr.startsWith('0x') && addr.length === 42;
    if (destChain === 'solana') return addr.length >= 32 && addr.length <= 44;
    if (destChain === 'near') return addr.endsWith('.near') || addr.length === 64;
    if (destChain === 'sui') return addr.startsWith('0x') && addr.length === 66;
    if (destChain === 'aptos') return addr.startsWith('0x') && addr.length === 66;
    if (destChain === 'tron') return addr.startsWith('T') && addr.length === 34;
    return addr.length > 5;
  }, [recipient, destChain]);

  const isValidAmount = frameType === 'tip' || (amount && parseFloat(amount) > 0);
  const isValid = isValidAddress && isValidAmount;

  const handleGenerate = () => {
    if (!isValid) return;

    const base = 'https://goblink.io';
    const params = new URLSearchParams();
    params.set('to', recipient.trim());

    if (isCrossChain) {
      params.set('sourceChain', sourceChain);
      params.set('sourceToken', sourceToken);
      params.set('destChain', destChain);
      params.set('destToken', destToken);
      params.set('crossChain', 'true');
    } else {
      params.set('token', destToken);
      params.set('chain', destChain);
    }

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

  const addressPlaceholder = useMemo(() => {
    const evmChains = ['base', 'ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc'];
    if (evmChains.includes(destChain)) return '0x...';
    if (destChain === 'solana') return 'Solana address...';
    if (destChain === 'near') return 'name.near or account ID';
    if (destChain === 'sui') return '0x... (66 chars)';
    if (destChain === 'aptos') return '0x... (66 chars)';
    if (destChain === 'tron') return 'T...';
    return 'Recipient address';
  }, [destChain]);

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
          ? 'Create a payment frame — one button, one signature, done. Works cross-chain.'
          : 'Create a tip frame — $1, $5, $10, or custom. Works cross-chain.'}
      </p>

      {/* Recipient */}
      <div>
        <label style={labelStyle}>Recipient address <span style={{ color: 'var(--error)' }}>*</span></label>
        <input
          type="text"
          placeholder={addressPlaceholder}
          value={recipient}
          onChange={e => { setRecipient(e.target.value); setGeneratedUrl(''); }}
          style={inputStyle}
          className="font-mono"
        />
        {recipient && !isValidAddress && (
          <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>
            Invalid address for {DEST_CHAINS.find(c => c.id === destChain)?.name || destChain}
          </p>
        )}
      </div>

      {/* Destination: where funds arrive */}
      <div>
        <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>
          Receive on
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="relative">
              <select
                value={destChain}
                onChange={e => { handleDestChainChange(e.target.value); setGeneratedUrl(''); }}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: '2.5rem' }}
              >
                {DEST_CHAINS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {destChainLogo?.icon && (
                <img
                  src={destChainLogo.icon}
                  alt={destChainLogo.name}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full pointer-events-none"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
          </div>
          <div>
            <select
              value={destToken}
              onChange={e => { setDestToken(e.target.value); setGeneratedUrl(''); }}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              {destTokens.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Source: what the payer sends (always EVM) */}
      <div>
        <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>
          Payer sends from
          {isCrossChain && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--brand)' }}>
              CROSS-CHAIN
            </span>
          )}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="relative">
              <select
                value={sourceChain}
                onChange={e => { handleSourceChainChange(e.target.value); setGeneratedUrl(''); }}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: '2.5rem' }}
              >
                {SOURCE_CHAINS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {sourceChainLogo?.icon && (
                <img
                  src={sourceChainLogo.icon}
                  alt={sourceChainLogo.name}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full pointer-events-none"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
          </div>
          <div>
            <select
              value={sourceToken}
              onChange={e => { setSourceToken(e.target.value); setGeneratedUrl(''); }}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            >
              {sourceTokens.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cross-chain indicator */}
      {isCrossChain && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', color: 'var(--brand)' }}
        >
          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Payer sends <strong>{sourceToken}</strong> on {SOURCE_CHAINS.find(c => c.id === sourceChain)?.name} →
            Recipient gets <strong>{destToken}</strong> on {DEST_CHAINS.find(c => c.id === destChain)?.name}
          </span>
        </div>
      )}

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
              {destToken}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            Amount in {destToken} the recipient receives
          </p>
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
          <div
            className="p-4 rounded-xl space-y-2"
            style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Your Farcaster Frame link
            </p>
            <p className="text-xs font-mono break-all" style={{ color: 'var(--brand)' }}>
              {generatedUrl}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              Paste this in a Farcaster cast. Warpcast renders it as an interactive card.
              {isCrossChain && ' Cross-chain routing is handled automatically by goBlink.'}
            </p>
          </div>

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
