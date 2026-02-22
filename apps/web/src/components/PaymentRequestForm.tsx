'use client';

import { useState } from 'react';
import { ArrowRight, Check, Copy, Link as LinkIcon } from 'lucide-react';
import { PaymentRequestData, generatePaymentUrl } from '@/lib/payment-requests';
import { getChainLogo } from '@/lib/chain-logos';

const SUPPORTED_CHAINS = [
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'base', name: 'Base' },
  { id: 'bsc', name: 'BNB Chain' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'near', name: 'NEAR' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'solana', name: 'Solana' },
  { id: 'sui', name: 'Sui' },
];

const POPULAR_TOKENS = ['DAI', 'ETH', 'NEAR', 'SOL', 'SUI', 'USDC', 'USDT', 'WETH'];

interface Props {
  onGenerated?: (url: string, data: PaymentRequestData) => void;
}

export default function PaymentRequestForm({ onGenerated }: Props) {
  const [toChain, setToChain] = useState('base');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');

  const chainLogo = getChainLogo(toChain);

  const isValid = toChain && toToken && amount && parseFloat(amount) > 0 && recipient.trim().length > 5;

  const handleGenerate = () => {
    if (!isValid) return;
    const data: PaymentRequestData = {
      recipient: recipient.trim(),
      toChain,
      toToken,
      amount: amount.trim(),
      memo: memo.trim() || undefined,
      name: name.trim() || undefined,
      createdAt: Date.now(),
    };
    const url = generatePaymentUrl(data);
    setGeneratedUrl(url);
    onGenerated?.(url, data);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
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

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '0.375rem',
  };

  return (
    <div className="card p-6 space-y-4">
      <div>
        <label style={labelStyle}>Your name or alias <span style={{ color: 'var(--text-faint)' }}>(optional)</span></label>
        <input
          type="text"
          placeholder="e.g. Alice"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Your receive address <span style={{ color: 'var(--error)' }}>*</span></label>
        <input
          type="text"
          placeholder="0x... or wallet address"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          style={inputStyle}
          className="font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Receive on chain <span style={{ color: 'var(--error)' }}>*</span></label>
          <div className="relative">
            <select
              value={toChain}
              onChange={e => setToChain(e.target.value)}
              style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: '2.5rem' }}
            >
              {SUPPORTED_CHAINS.map(c => (
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
            value={toToken}
            onChange={e => setToToken(e.target.value)}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
          >
            {POPULAR_TOKENS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Amount <span style={{ color: 'var(--error)' }}>*</span></label>
        <div className="relative">
          <input
            type="number"
            placeholder="0.00"
            min="0"
            step="any"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ ...inputStyle, paddingRight: '4rem' }}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          >
            {toToken}
          </span>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Memo <span style={{ color: 'var(--text-faint)' }}>(optional)</span></label>
        <input
          type="text"
          placeholder="e.g. Invoice #42, Dinner split, etc."
          value={memo}
          onChange={e => setMemo(e.target.value)}
          style={inputStyle}
        />
      </div>

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
          Generate Payment Link <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <div className="space-y-3">
          <div
            className="p-3 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)' }}
          >
            <LinkIcon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand)' }} />
            <span
              className="flex-1 text-xs font-mono break-all truncate"
              style={{ color: 'var(--brand)' }}
            >
              {generatedUrl}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
              style={{ background: 'var(--elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              {copied ? <Check className="h-4 w-4" style={{ color: 'var(--success)' }} /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button
              onClick={() => setGeneratedUrl('')}
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
