'use client';

import { useState, useMemo, useEffect } from 'react';
import { Check, Copy, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import { getChainLogo } from '@/lib/chain-logos';
import { filterTokens } from '@/lib/token-filters';

// Same chain list as SwapForm — single source of truth
const SUPPORTED_CHAINS = [
  { id: 'aptos', name: 'Aptos', type: 'aptos' },
  { id: 'arbitrum', name: 'Arbitrum', type: 'evm' },
  { id: 'base', name: 'Base', type: 'evm' },
  { id: 'bsc', name: 'BNB Chain', type: 'evm' },
  { id: 'ethereum', name: 'Ethereum', type: 'evm' },
  { id: 'near', name: 'NEAR', type: 'near' },
  { id: 'optimism', name: 'Optimism', type: 'evm' },
  { id: 'polygon', name: 'Polygon', type: 'evm' },
  { id: 'solana', name: 'Solana', type: 'solana' },
  { id: 'starknet', name: 'Starknet', type: 'starknet' },
  { id: 'sui', name: 'Sui', type: 'sui' },
  { id: 'tron', name: 'Tron', type: 'tron' },
] as const;

interface Token {
  assetId: string;
  defuseAssetId?: string;
  symbol: string;
  name?: string;
  icon?: string;
  blockchain?: string;
  decimals?: number;
}

type FrameType = 'pay' | 'tip';

export default function FarcasterFrameBuilder() {
  const [frameType, setFrameType] = useState<FrameType>('pay');
  const [sourceChain, setSourceChain] = useState('base');
  const [sourceTokenId, setSourceTokenId] = useState('');
  const [destChain, setDestChain] = useState('solana');
  const [destTokenId, setDestTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);

  // Fetch tokens from API — same source as SwapForm
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch('/api/tokens');
        if (!res.ok) throw new Error('Failed to fetch tokens');
        const data = await res.json();
        setTokens(filterTokens(data));
      } catch (err) {
        console.error('Failed to load tokens:', err);
      } finally {
        setTokensLoading(false);
      }
    };
    fetchTokens();
  }, []);

  // Filter tokens by chain — same logic as SwapForm
  const sourceTokens = useMemo(() => {
    return tokens.filter(t => (t.blockchain || 'near').toLowerCase() === sourceChain);
  }, [tokens, sourceChain]);

  const destTokens = useMemo(() => {
    return tokens.filter(t => (t.blockchain || 'near').toLowerCase() === destChain);
  }, [tokens, destChain]);

  // Auto-select first token when chain changes
  useEffect(() => {
    if (sourceTokens.length > 0 && !sourceTokens.find(t => t.assetId === sourceTokenId)) {
      // Prefer USDC, then first token
      const usdc = sourceTokens.find(t => t.symbol === 'USDC');
      setSourceTokenId(usdc ? usdc.assetId : sourceTokens[0].assetId);
    }
  }, [sourceTokens, sourceTokenId]);

  useEffect(() => {
    if (destTokens.length > 0 && !destTokens.find(t => t.assetId === destTokenId)) {
      const usdc = destTokens.find(t => t.symbol === 'USDC');
      setDestTokenId(usdc ? usdc.assetId : destTokens[0].assetId);
    }
  }, [destTokens, destTokenId]);

  const selectedSourceToken = useMemo(() => sourceTokens.find(t => t.assetId === sourceTokenId), [sourceTokens, sourceTokenId]);
  const selectedDestToken = useMemo(() => destTokens.find(t => t.assetId === destTokenId), [destTokens, destTokenId]);

  const sourceChainLogo = getChainLogo(sourceChain);
  const destChainLogo = getChainLogo(destChain);

  const isCrossChain = useMemo(() => {
    return sourceChain !== destChain || sourceTokenId !== destTokenId;
  }, [sourceChain, destChain, sourceTokenId, destTokenId]);

  // Validate recipient based on destination chain
  const isValidAddress = useMemo(() => {
    const addr = recipient.trim();
    if (!addr) return false;
    const chainType = SUPPORTED_CHAINS.find(c => c.id === destChain)?.type;
    if (chainType === 'evm') return addr.startsWith('0x') && addr.length === 42;
    if (chainType === 'solana') return addr.length >= 32 && addr.length <= 44 && !addr.startsWith('0x');
    if (chainType === 'near') return addr.endsWith('.near') || addr.length === 64;
    if (chainType === 'sui') return addr.startsWith('0x') && addr.length === 66;
    if (chainType === 'aptos') return addr.startsWith('0x') && addr.length === 66;
    if (destChain === 'tron') return addr.startsWith('T') && addr.length === 34;
    if (destChain === 'starknet') return addr.startsWith('0x') && addr.length >= 64;
    return addr.length > 5;
  }, [recipient, destChain]);

  const isValidAmount = frameType === 'tip' || (amount && parseFloat(amount) > 0);
  const isValid = isValidAddress && isValidAmount && !!selectedSourceToken && !!selectedDestToken;

  const handleGenerate = () => {
    if (!isValid || !selectedSourceToken || !selectedDestToken) return;

    const base = 'https://goblink.io';
    const params = new URLSearchParams();
    params.set('to', recipient.trim());
    // Pass defuseAssetId for 1Click resolution, plus human-readable for display
    params.set('sourceChain', sourceChain);
    params.set('sourceToken', selectedSourceToken.symbol);
    params.set('sourceAssetId', selectedSourceToken.defuseAssetId || selectedSourceToken.assetId);
    params.set('destChain', destChain);
    params.set('destToken', selectedDestToken.symbol);
    params.set('destAssetId', selectedDestToken.defuseAssetId || selectedDestToken.assetId);
    if (selectedSourceToken.decimals) params.set('sourceDecimals', String(selectedSourceToken.decimals));
    if (selectedDestToken.decimals) params.set('destDecimals', String(selectedDestToken.decimals));
    if (isCrossChain) params.set('crossChain', 'true');

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
    const chainType = SUPPORTED_CHAINS.find(c => c.id === destChain)?.type;
    if (chainType === 'evm') return '0x...';
    if (chainType === 'solana') return 'Solana address...';
    if (chainType === 'near') return 'name.near or account ID';
    if (chainType === 'sui') return '0x... (66 chars)';
    if (chainType === 'aptos') return '0x... (66 chars)';
    if (destChain === 'tron') return 'T...';
    if (destChain === 'starknet') return '0x...';
    return 'Recipient address';
  }, [destChain]);

  if (tokensLoading) {
    return (
      <div className="card p-6 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading tokens...</span>
      </div>
    );
  }

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
          ? 'Create a payment frame — one button, one signature, done. Any chain to any chain.'
          : 'Create a tip frame — $1, $5, $10, or custom. Any chain to any chain.'}
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
            Invalid address for {SUPPORTED_CHAINS.find(c => c.id === destChain)?.name || destChain}
          </p>
        )}
      </div>

      {/* Destination: where funds arrive */}
      <div>
        <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Receive on</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={destChain}
              onChange={e => { setDestChain(e.target.value); setGeneratedUrl(''); }}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: '2.5rem' }}
            >
              {SUPPORTED_CHAINS.map(c => (
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
          <select
            value={destTokenId}
            onChange={e => { setDestTokenId(e.target.value); setGeneratedUrl(''); }}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
          >
            {destTokens.map(t => (
              <option key={t.assetId} value={t.assetId}>{t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Source: what the payer sends */}
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
          <div className="relative">
            <select
              value={sourceChain}
              onChange={e => { setSourceChain(e.target.value); setGeneratedUrl(''); }}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: '2.5rem' }}
            >
              {SUPPORTED_CHAINS.map(c => (
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
          <select
            value={sourceTokenId}
            onChange={e => { setSourceTokenId(e.target.value); setGeneratedUrl(''); }}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
          >
            {sourceTokens.map(t => (
              <option key={t.assetId} value={t.assetId}>{t.symbol}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cross-chain indicator */}
      {isCrossChain && selectedSourceToken && selectedDestToken && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', color: 'var(--brand)' }}
        >
          <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Payer sends <strong>{selectedSourceToken.symbol}</strong> on {SUPPORTED_CHAINS.find(c => c.id === sourceChain)?.name} →
            Recipient gets <strong>{selectedDestToken.symbol}</strong> on {SUPPORTED_CHAINS.find(c => c.id === destChain)?.name}
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
              {selectedDestToken?.symbol || ''}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            Amount in {selectedDestToken?.symbol || 'tokens'} the recipient receives
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
              {isCrossChain && ' Cross-chain routing handled by goBlink.'}
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
