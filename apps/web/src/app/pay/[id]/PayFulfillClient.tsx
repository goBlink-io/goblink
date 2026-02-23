'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Copy, Check, Clock, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { PaymentRequestData, shortAddress } from '@/lib/payment-requests';
import { ChainLogo } from '@/lib/chain-logos';
import PaymentModal from '@/components/PaymentModal';

const LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface LinkStatus {
  status: 'active' | 'processing' | 'paid' | 'failed' | 'expired' | 'invalid' | 'loading';
  expiresAt?: string;
  paid_at?: string;
  send_tx_hash?: string;
  fulfillment_tx_hash?: string;
  payer_address?: string;
  payer_chain?: string;
  deposit_address?: string;
}

interface Props {
  data: PaymentRequestData | null;
  toLogo: ChainLogo | null;
  linkId: string;
}

function StatusCard({ icon, title, subtitle, children }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="card p-10 max-w-sm w-full text-center space-y-4">
        <div className="flex justify-center">{icon}</div>
        <h1 className="text-h3" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
        {children}
        <Link href="/" className="inline-flex items-center gap-2 text-body-sm font-medium" style={{ color: 'var(--brand)' }}>
          Go to goBlink <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function TxRow({ label, hash, chain }: { label: string; hash?: string | null; chain?: string }) {
  if (!hash) return null;
  const short = `${hash.slice(0, 8)}…${hash.slice(-6)}`;
  // Build explorer URL based on chain
  const explorerUrl = chain === 'near'
    ? `https://nearblocks.io/txns/${hash}`
    : chain === 'sui'
    ? `https://suiscan.xyz/mainnet/tx/${hash}`
    : chain === 'solana'
    ? `https://solscan.io/tx/${hash}`
    : null;

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-tiny" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-tiny font-mono" style={{ color: 'var(--text-primary)' }}>{short}</span>
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" style={{ color: 'var(--text-faint)' }} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function PayFulfillClient({ data, toLogo, linkId }: Props) {
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>({ status: 'loading' });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/pay/${linkId}/status`);
      const json = await res.json();
      setLinkStatus(json);
    } catch {
      setLinkStatus({ status: 'active' }); // fail open
    }
  }, [linkId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll when processing to pick up the fulfillment tx hash
  useEffect(() => {
    if (linkStatus.status !== 'processing') return;
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [linkStatus.status, fetchStatus]);

  if (!data) {
    return (
      <StatusCard
        icon={<span className="text-4xl">💸</span>}
        title="Invalid Request"
        subtitle="This payment request link is invalid or could not be decoded."
      />
    );
  }

  const requester = data.name || shortAddress(data.recipient);
  const chainName = toLogo?.name ?? (data.toChain.charAt(0).toUpperCase() + data.toChain.slice(1));
  const expiresAt = new Date(data.createdAt + LINK_TTL_MS);

  // ── Expired ──────────────────────────────────────────────────────────────────
  if (linkStatus.status === 'expired' || Date.now() > data.createdAt + LINK_TTL_MS) {
    return (
      <StatusCard
        icon={<Clock className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />}
        title="Link Expired"
        subtitle={`This payment request expired on ${expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. Payment links are valid for 7 days.`}
      />
    );
  }

  // ── Paid ─────────────────────────────────────────────────────────────────────
  if (linkStatus.status === 'paid') {
    const paidDate = linkStatus.paid_at
      ? new Date(linkStatus.paid_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
      : null;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="card p-8 max-w-sm w-full space-y-5">
          {/* Header */}
          <div className="text-center">
            <CheckCircle2 className="h-14 w-14 mx-auto mb-3" style={{ color: 'var(--success)' }} />
            <h1 className="text-h3 mb-1" style={{ color: 'var(--text-primary)' }}>Payment Complete</h1>
            <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
              {requester} received exactly <strong>{data.amount} {data.toToken}</strong> on {chainName}.
            </p>
            {paidDate && (
              <p className="text-tiny mt-1" style={{ color: 'var(--text-faint)' }}>Paid {paidDate}</p>
            )}
          </div>

          {/* Transaction details */}
          <div className="p-4 rounded-xl space-y-0.5" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
            <p className="text-tiny font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Transaction Details</p>
            {linkStatus.payer_address && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-tiny" style={{ color: 'var(--text-muted)' }}>Paid by</span>
                <span className="text-tiny font-mono" style={{ color: 'var(--text-primary)' }}>
                  {linkStatus.payer_address.slice(0, 8)}…{linkStatus.payer_address.slice(-6)}
                </span>
              </div>
            )}
            <TxRow label="Send tx" hash={linkStatus.send_tx_hash} chain={linkStatus.payer_chain} />
            <TxRow label="Receive tx" hash={linkStatus.fulfillment_tx_hash} chain={data.toChain} />
            <div className="flex items-center justify-between py-1.5">
              <span className="text-tiny" style={{ color: 'var(--text-muted)' }}>Recipient</span>
              <span className="text-tiny font-mono" style={{ color: 'var(--text-primary)' }}>
                {shortAddress(data.recipient)}
              </span>
            </div>
          </div>

          <Link href="/" className="btn btn-primary w-full flex items-center justify-center gap-2">
            Create your own payment link <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Processing ───────────────────────────────────────────────────────────────
  // Don't short-circuit while the modal is open — TransferModal needs to stay
  // mounted so it can call onOutcome → onPaymentConfirmed → promote to 'paid'.
  if (linkStatus.status === 'processing' && !modalOpen) {
    return (
      <StatusCard
        icon={<Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--brand)' }} />}
        title="Payment Processing"
        subtitle="The transaction has been submitted. This page will update when confirmed."
      >
        {linkStatus.send_tx_hash && (
          <div className="p-3 rounded-xl text-left" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
            <TxRow label="Send tx" hash={linkStatus.send_tx_hash} chain={linkStatus.payer_chain} />
          </div>
        )}
      </StatusCard>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (linkStatus.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--brand)' }} />
      </div>
    );
  }

  // ── Active — normal payment UI ───────────────────────────────────────────────
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(data.recipient).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const date = new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const daysLeft = Math.ceil((data.createdAt + LINK_TTL_MS - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <>
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
          <div className="card p-6 mb-4" style={{ boxShadow: '0 8px 32px rgba(124,58,237,0.1), 0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3"
                style={{ background: 'rgba(37,99,235,0.08)', color: 'var(--brand)', border: '1px solid rgba(37,99,235,0.15)' }}>
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
                  <img src={toLogo.icon} alt={chainName} className="w-5 h-5 rounded-full"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>on {chainName}</span>
              </div>
            </div>

            {data.memo && (
              <div className="p-3 rounded-xl mb-4 text-center" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
                <p className="text-body-sm italic" style={{ color: 'var(--text-secondary)' }}>&ldquo;{data.memo}&rdquo;</p>
              </div>
            )}

            <div className="p-3 rounded-xl mb-5" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <div className="text-tiny font-medium mb-1" style={{ color: 'var(--text-muted)' }}>To address</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono break-all" style={{ color: 'var(--text-primary)' }}>
                  {data.recipient}
                </code>
                <button onClick={handleCopyAddress}
                  className="p-1.5 rounded-lg transition-all hover:opacity-70 flex-shrink-0"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {copied
                    ? <Check className="h-3.5 w-3.5" style={{ color: 'var(--success)' }} />
                    : <Copy className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--brand)' }}
            >
              Pay with any token <ArrowRight className="h-5 w-5" />
            </button>

            <p className="text-center text-tiny mt-3" style={{ color: 'var(--text-faint)' }}>
              Choose your source token & chain on the next screen
            </p>
          </div>

          {/* Expiry notice */}
          <div className="p-4 rounded-xl text-center" style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}>
            <p className="text-tiny" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold">How it works:</span> goBlink converts your tokens cross-chain.
              The recipient gets exactly <strong>{data.amount} {data.toToken}</strong> on <strong>{chainName}</strong>.
            </p>
            <p className="text-tiny mt-1" style={{ color: 'var(--text-faint)' }}>
              <Clock className="h-3 w-3 inline mr-1" />
              Link expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {modalOpen && (
        <PaymentModal
          data={data}
          toLogo={toLogo}
          onClose={() => setModalOpen(false)}
          onPaymentSent={(sendTxHash, depositAddress, payerAddress, payerChain) => {
            // Mark as processing in DB + refresh local status
            fetch(`/api/pay/${linkId}/complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sendTxHash, depositAddress, payerAddress, payerChain }),
            }).then(() => fetchStatus()).catch(() => {});
          }}
          onPaymentConfirmed={(fulfillmentTxHash) => {
            // Promote to paid in DB + refresh local status
            fetch(`/api/pay/${linkId}/complete`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fulfillmentTxHash, outcome: 'paid' }),
            }).then(() => fetchStatus()).catch(() => {});
          }}
        />
      )}
    </>
  );
}
