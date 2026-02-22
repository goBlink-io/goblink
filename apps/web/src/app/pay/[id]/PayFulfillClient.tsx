'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { PaymentRequestData, shortAddress } from '@/lib/payment-requests';
import { ChainLogo } from '@/lib/chain-logos';

interface Props {
  data: PaymentRequestData | null;
  toLogo: ChainLogo | null;
}

function InvalidRequest() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="card p-10 max-w-sm w-full text-center">
        <div className="text-4xl mb-4">💸</div>
        <h1 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>Invalid Request</h1>
        <p className="text-body-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          This payment request link is invalid or has expired.
        </p>
        <Link href="/app" className="btn btn-primary inline-flex items-center gap-2">
          Go to goBlink <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function PayFulfillClient({ data, toLogo }: Props) {
  const [copied, setCopied] = useState(false);

  if (!data) return <InvalidRequest />;

  const requester = data.name || shortAddress(data.recipient);
  const chainName = toLogo?.name ?? (data.toChain.charAt(0).toUpperCase() + data.toChain.slice(1));

  // Build URL params to pre-fill the swap form on the main page
  const swapParams = new URLSearchParams({
    toChain: data.toChain,
    toToken: data.toToken,
    toAddress: data.recipient,
    amount: data.amount,
  });
  const swapUrl = `/?${swapParams.toString()}`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(data.recipient).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const date = new Date(data.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-gradient font-black text-2xl">goBlink</span>
            <Zap className="h-5 w-5" style={{ color: 'var(--brand)' }} />
          </Link>
        </div>

        {/* Request Card */}
        <div
          className="card p-6 mb-4"
          style={{ boxShadow: '0 8px 32px rgba(124,58,237,0.1), 0 2px 8px rgba(0,0,0,0.06)' }}
        >
          {/* Requester line */}
          <div className="text-center mb-5">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3"
              style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              💸 Payment Request · {date}
            </div>
            <h1 className="text-h3 mb-1" style={{ color: 'var(--text-primary)' }}>
              {requester} requests
            </h1>
            <div className="text-h2 font-black text-gradient">
              {data.amount} {data.toToken}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              {toLogo?.icon && (
                <img
                  src={toLogo.icon}
                  alt={chainName}
                  className="w-5 h-5 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>on {chainName}</span>
            </div>
          </div>

          {/* Memo */}
          {data.memo && (
            <div
              className="p-3 rounded-xl mb-4 text-center"
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
            >
              <p className="text-body-sm italic" style={{ color: 'var(--text-secondary)' }}>
                &ldquo;{data.memo}&rdquo;
              </p>
            </div>
          )}

          {/* Recipient address */}
          <div
            className="p-3 rounded-xl mb-5"
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
          >
            <div className="text-tiny font-medium mb-1" style={{ color: 'var(--text-muted)' }}>To address</div>
            <div className="flex items-center gap-2">
              <code
                className="flex-1 text-xs font-mono break-all"
                style={{ color: 'var(--text-primary)' }}
              >
                {data.recipient}
              </code>
              <button
                onClick={handleCopyAddress}
                className="p-1.5 rounded-lg transition-all hover:opacity-70 flex-shrink-0"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                title="Copy address"
              >
                {copied
                  ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--success)' }} />
                  : <Copy className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                }
              </button>
            </div>
          </div>

          {/* Pay CTA */}
          <Link
            href={swapUrl}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base text-white transition-all hover:opacity-90"
            style={{ background: 'var(--gradient)' }}
          >
            Pay with any token <ArrowRight className="h-5 w-5" />
          </Link>

          <p className="text-center text-tiny mt-3" style={{ color: 'var(--text-faint)' }}>
            Choose your source token & chain on the next screen
          </p>
        </div>

        {/* How it works note */}
        <div
          className="p-4 rounded-xl text-center"
          style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
        >
          <p className="text-tiny" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold">How it works:</span> goBlink converts your tokens cross-chain.
            The recipient gets exactly <strong>{data.amount} {data.toToken}</strong> on <strong>{chainName}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
