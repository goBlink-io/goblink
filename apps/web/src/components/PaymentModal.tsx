'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Zap, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import TransferModal from './TransferModal';
import TokenSelector from './TokenSelector';
import { PaymentRequestData } from '@/lib/payment-requests';
import { ChainLogo } from '@/lib/chain-logos';
import { useWallet } from '@goblink/connect/react';
import type { ChainType } from '@goblink/connect';
import { getTokenBalance } from '@/lib/balances';
import { filterTokens } from '@/lib/token-filters';
import { formatTokenAmount as displayAmount } from '@/lib/format';
import type { Token } from '@goblink/shared';

interface QuoteInner {
  minAmountIn?: string;
  maxAmountIn?: string;
  amountInFormatted?: string;
  amountInUsd?: string;
  amountOutFormatted?: string;
  amountOutUsd?: string;
  timeEstimate?: string;
}

interface QuoteResponse {
  quote?: QuoteInner;
  feeInfo?: { bps?: string; percent?: string; usd?: string };
  _fromAssetId?: string;
  _fromChainId?: string;
}

// ── Supported chains (mirrors SwapForm) ──────────────────────────────────────
const SUPPORTED_CHAINS = [
  { id: 'aptos',    name: 'Aptos',     type: 'aptos'    as ChainType },
  { id: 'arbitrum', name: 'Arbitrum',  type: 'evm'      as ChainType },
  { id: 'base',     name: 'Base',      type: 'evm'      as ChainType },
  { id: 'bsc',      name: 'BNB Chain', type: 'evm'      as ChainType },
  { id: 'ethereum', name: 'Ethereum',  type: 'evm'      as ChainType },
  { id: 'near',     name: 'NEAR',      type: 'near'     as ChainType },
  { id: 'optimism', name: 'Optimism',  type: 'evm'      as ChainType },
  { id: 'polygon',  name: 'Polygon',   type: 'evm'      as ChainType },
  { id: 'solana',   name: 'Solana',    type: 'solana'   as ChainType },
  { id: 'starknet', name: 'Starknet',  type: 'starknet' as ChainType },
  { id: 'sui',      name: 'Sui',       type: 'sui'      as ChainType },
  { id: 'tron',     name: 'Tron',      type: 'tron'     as ChainType },
] as const;

type ChainId = typeof SUPPORTED_CHAINS[number]['id'];

function chainTypeForId(id: ChainId): ChainType {
  return SUPPORTED_CHAINS.find(c => c.id === id)!.type;
}

function formatTokenAmount(atomic: string, decimals: number, maxFraction = 6): string {
  try {
    const n = Number(BigInt(atomic)) / Math.pow(10, decimals);
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: maxFraction });
  } catch {
    return atomic;
  }
}

function toAtomicAmount(human: string, decimals: number): string {
  try {
    const n = parseFloat(human);
    if (isNaN(n)) return '0';
    return BigInt(Math.round(n * Math.pow(10, decimals))).toString();
  } catch { return '0'; }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface PaymentModalProps {
  data: PaymentRequestData;
  toLogo: ChainLogo | null;
  onClose: () => void;
  /** Called when user signs the tx — mark link as processing */
  onPaymentSent?: (sendTxHash: string | undefined, depositAddress: string, payerAddress: string, payerChain: string) => void;
  /** Called when 1Click confirms on-chain success — mark link as paid */
  onPaymentConfirmed?: (fulfillmentTxHash: string | undefined) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PaymentModal({ data, toLogo, onClose, onPaymentSent, onPaymentConfirmed }: PaymentModalProps) {
  const { getAddress, connect } = useWallet();

  // Token list (all chains)
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);

  // Destination token metadata (resolved from token list)
  const [destToken, setDestToken] = useState<Token | null>(null);

  // FROM selection
  const [fromChainId, setFromChainId] = useState<ChainId>('solana');
  const [fromAssetId, setFromAssetId] = useState<string>('');

  // Balance state
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Quote state
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Transfer modal
  const [transferQuote, setTransferQuote] = useState<Record<string, unknown> | null>(null);

  const quoteAbortRef = useRef<AbortController | null>(null);

  const chainName = toLogo?.name ?? (data.toChain.charAt(0).toUpperCase() + data.toChain.slice(1));
  const requester = data.name || `${data.recipient.slice(0, 8)}…${data.recipient.slice(-6)}`;

  // ── Load tokens once ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/tokens')
      .then(r => r.json())
      .then((tokens: Token[]) => {
        setAllTokens(filterTokens(tokens));
        setTokensLoading(false);

        // Resolve destination token (with fallback for wrapped aliases like wNEAR→NEAR)
        const ALIASES: Record<string, string[]> = {
          'WNEAR': ['NEAR'],
          'NEAR': ['WNEAR'],
          'WETH': ['ETH'],
          'ETH': ['WETH'],
          'WBTC': ['BTC'],
        };
        const toUpper = (data.toToken || '').toUpperCase();
        const candidates = [toUpper, ...(ALIASES[toUpper] || [])];
        const dest = tokens.find(t =>
          candidates.includes((t.symbol || '').toUpperCase()) &&
          (t.blockchain || 'near').toLowerCase() === data.toChain.toLowerCase()
        );
        setDestToken(dest || null);

        // Default from token: USDC on Solana (good cross-chain entry point)
        const defaultFrom = tokens.find(t =>
          t.symbol === 'USDC' &&
          (t.blockchain || 'near').toLowerCase() === 'solana'
        );
        if (defaultFrom) setFromAssetId(defaultFrom.assetId);
      })
      .catch(() => setTokensLoading(false));
  }, [data.toChain, data.toToken]);

  // ── Tokens available for the selected from-chain ────────────────────────────
  const fromTokens = allTokens.filter(t =>
    (t.blockchain || 'near').toLowerCase() === fromChainId.toLowerCase()
  );

  // ── Wallet address for from chain ───────────────────────────────────────────
  const fromAddress = getAddress(chainTypeForId(fromChainId));

  // ── Auto-quote (EXACT_OUTPUT) ────────────────────────────────────────────────
  const fetchQuote = useCallback(async (asset: string, chainId: ChainId) => {
    if (!asset || !destToken) return;

    const destAtomicAmount = toAtomicAmount(data.amount, destToken.decimals);
    if (destAtomicAmount === '0') return;

    // Cancel any in-flight quote
    quoteAbortRef.current?.abort();
    const ctrl = new AbortController();
    quoteAbortRef.current = ctrl;

    setQuoting(true);
    setQuoteError(null);
    setQuote(null);

    try {
      // refundTo: use payer's wallet if connected, else use recipient (fine for dry run)
      const refundTo = fromAddress || data.recipient;

      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          dry: true,
          originAsset: allTokens.find(t => t.assetId === asset)?.defuseAssetId || asset,
          destinationAsset: destToken.defuseAssetId || destToken.assetId,
          amount: destAtomicAmount,
          recipient: data.recipient,
          refundTo,
          swapType: 'EXACT_OUTPUT',
          slippageTolerance: 100,
          deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'No quote available');
      }

      const result = await res.json();
      setQuote({ ...result, _fromAssetId: asset, _fromChainId: chainId });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setQuoteError(err.message || 'Could not get a quote for this pair. Try a different token.');
    } finally {
      setQuoting(false);
    }
  }, [destToken, data.amount, data.recipient, fromAddress, allTokens]);

  // Re-quote whenever from chain/token changes (and tokens are loaded)
  useEffect(() => {
    if (!tokensLoading && fromAssetId && destToken) {
      fetchQuote(fromAssetId, fromChainId);
    }
  }, [fromAssetId, fromChainId, tokensLoading, destToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset from token when chain changes
  useEffect(() => {
    const first = allTokens.find(t => (t.blockchain || 'near').toLowerCase() === fromChainId);
    setFromAssetId(first?.assetId || '');
  }, [fromChainId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch balances for FROM chain whenever address or token list changes
  useEffect(() => {
    if (!fromAddress || fromTokens.length === 0) {
      setBalances({});
      return;
    }
    let cancelled = false;
    const fetchBalances = async () => {
      setLoadingBalances(true);
      const newBalances: Record<string, string> = {};
      await Promise.all(
        fromTokens.map(async (token) => {
          try {
            const balance = await getTokenBalance(fromAddress, {
              blockchain: token.blockchain,
              contractAddress: token.contractAddress,
              assetId: token.assetId,
              decimals: token.decimals,
              symbol: token.symbol,
            });
            newBalances[token.assetId] = balance;
          } catch {
            newBalances[token.assetId] = '0.00';
          }
        })
      );
      if (!cancelled) {
        setBalances(newBalances);
        setLoadingBalances(false);
      }
    };
    setBalances({});
    fetchBalances();
    return () => { cancelled = true; };
  }, [fromAddress, fromChainId, fromTokens.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build transfer quote for TransferModal ───────────────────────────────────
  const handlePreview = () => {
    if (!quote || !destToken) return;
    const fromToken = allTokens.find(t => t.assetId === fromAssetId);
    if (!fromToken) return;

    // QuoteResponse nests swap details under .quote (the Quote type)
    const quoteInner = quote.quote || {};
    const refundTo = fromAddress || data.recipient;
    const destAtomicAmount = toAtomicAmount(data.amount, destToken.decimals);

    // amountInFormatted = API-computed send amount; use maxAmountIn if present for EXACT_OUTPUT
    const displayAmountIn = quoteInner.maxAmountIn
      ? formatTokenAmount(quoteInner.maxAmountIn, fromToken.decimals)
      : quoteInner.amountInFormatted || '?';

    setTransferQuote({
      // TransferModal destructures { quote: quoteData } — spread the inner Quote object
      // then override display fields for EXACT_OUTPUT context
      quote: {
        ...quoteInner,
        amountInFormatted: displayAmountIn,
        amountInUsd: quoteInner.amountInUsd || null,
        amountOutFormatted: data.amount,       // recipient gets exactly this
        amountOutUsd: quoteInner.amountOutUsd || null,
      },
      quoteRequest: {
        originAsset: fromToken.defuseAssetId || fromToken.assetId,
        destinationAsset: destToken.defuseAssetId || destToken.assetId,
        amount: destAtomicAmount,    // EXACT_OUTPUT: desired output amount
        recipient: data.recipient,
        refundTo,
        swapType: 'EXACT_OUTPUT',
        slippageTolerance: 100,
        deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        depositType: 'ORIGIN_CHAIN',
        recipientType: 'DESTINATION_CHAIN',
        refundType: 'ORIGIN_CHAIN',
        dry: true,
      },
      originTokenMetadata: fromToken,
      destinationTokenMetadata: destToken,
      fromChain: fromChainId,
      toChain: data.toChain,
      feeInfo: quote.feeInfo || null,
      // Tag as payment modal transaction for logging/support
      source: 'payment',
      paymentRequestId: `${data.recipient}:${data.toChain}:${data.toToken}:${data.amount}`,
    });
  };

  // ── Derived UI state ──────────────────────────────────────────────────────────
  const fromToken = allTokens.find(t => t.assetId === fromAssetId);
  // QuoteResponse nests swap details under .quote (the inner Quote type)
  const quoteInner = quote?.quote || null;
  const hasQuote = !!quoteInner && !!quoteInner.minAmountIn;
  const canPreview = hasQuote && !!fromAddress;

  // Use amountInFormatted (API-computed) as primary; fall back to minAmountIn
  // formatTokenAmount caps floating-point precision to readable sig figs
  const sendFormatted = displayAmount(
    quoteInner?.amountInFormatted
    || (quoteInner?.minAmountIn && fromToken ? formatTokenAmount(quoteInner.minAmountIn, fromToken.decimals) : null)
    || '?'
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div
          className="relative w-full sm:max-w-md max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              {toLogo?.icon && (
                <img src={toLogo.icon} alt={chainName} className="w-8 h-8 rounded-full"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div>
                <div className="text-tiny font-medium" style={{ color: 'var(--text-muted)' }}>
                  {requester} requests
                </div>
                <div className="font-bold text-body-sm" style={{ color: 'var(--text-primary)' }}>
                  {data.amount} {data.toToken}
                  <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>on {chainName}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl transition-opacity hover:opacity-70" aria-label="Close">
              <X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Info pill */}
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}
            >
              <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
              <p className="text-tiny" style={{ color: 'var(--text-secondary)' }}>
                Pay with <strong>any token from any chain.</strong> The recipient gets
                exactly <strong>{data.amount} {data.toToken}</strong> on {chainName} — guaranteed.
              </p>
            </div>

            {/* FROM chain */}
            <div>
              <label className="block text-caption font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Your chain
              </label>
              <div className="relative">
                <select
                  value={fromChainId}
                  onChange={e => setFromChainId(e.target.value as ChainId)}
                  className="input w-full h-11 text-body-sm font-semibold appearance-none pr-8"
                >
                  {SUPPORTED_CHAINS.filter(c => c.id !== data.toChain).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* FROM token */}
            <div>
              <label className="block text-caption font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Your token
              </label>
              {tokensLoading ? (
                <div className="h-11 rounded-xl animate-pulse" style={{ background: 'var(--elevated)' }} />
              ) : (
                <TokenSelector
                  tokens={fromTokens}
                  selectedToken={fromAssetId}
                  onSelect={setFromAssetId}
                  balances={balances}
                  loadingBalances={loadingBalances}
                  label="Token"
                  placeholder="Select a token..."
                />
              )}
            </div>

            {/* Quote result */}
            {(quoting || hasQuote || quoteError) && (
              <div
                className="rounded-xl p-4"
                style={{ background: 'var(--elevated)', border: '1px solid var(--border)' }}
              >
                {quoting && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-body-sm">Getting best rate…</span>
                  </div>
                )}

                {quoteError && !quoting && (
                  <div className="flex items-center justify-between">
                    <p className="text-body-sm" style={{ color: 'var(--error)' }}>{quoteError}</p>
                    <button onClick={() => fetchQuote(fromAssetId, fromChainId)}
                      className="p-1.5 rounded-lg hover:opacity-70"
                      style={{ color: 'var(--text-muted)' }}>
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {hasQuote && !quoting && (
                  <div className="space-y-3">
                    {/* Cost breakdown — Line1 = Line3 − Line2 */}
                    {(() => {
                      const sym        = fromToken?.symbol || '';
                      const feeBps     = quote?.feeInfo?.bps    ? parseFloat(quote.feeInfo.bps)    : 0;
                      const feePercent = quote?.feeInfo?.percent || '0';
                      // amountIn from the API is the BASE swap cost (fee not yet added)
                      // Line 1: base = amountInFormatted from the API
                      const baseTokens = parseFloat(sendFormatted) || 0;
                      const baseUsd    = quoteInner?.amountInUsd ? parseFloat(quoteInner.amountInUsd) : null;
                      // Line 2: fee on top of base
                      const feeTokens  = feeBps > 0 ? baseTokens * feeBps / 10000 : 0;
                      const feeUsd     = quote?.feeInfo?.usd ? parseFloat(quote.feeInfo.usd) : null;
                      // Line 3: total = base + fee (this is what goes to the wallet)
                      const totalTokens = baseTokens + feeTokens;
                      const totalUsd    = (baseUsd !== null && feeUsd !== null) ? baseUsd + feeUsd : baseUsd;
                      const fmt = (n: number) => displayAmount(n);
                      return (
                        <div className="space-y-1.5">
                          {/* Line 1: Estimated swap cost (API amountIn = base before fee) */}
                          <div className="flex items-center justify-between">
                            <span className="text-caption" style={{ color: 'var(--text-muted)' }}>Estimated cost</span>
                            <div className="text-right">
                              <span className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {fmt(baseTokens)} {sym}
                              </span>
                              {baseUsd !== null && (
                                <span className="text-tiny ml-1" style={{ color: 'var(--text-muted)' }}>
                                  ≈ ${baseUsd.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Line 2: goBlink fee added on top */}
                          {feeBps > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
                                goBlink fee ({feePercent}%)
                              </span>
                              <div className="text-right">
                                <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>
                                  {fmt(feeTokens)} {sym}
                                </span>
                                {feeUsd !== null && feeUsd > 0 && (
                                  <span className="text-tiny ml-1" style={{ color: 'var(--text-muted)' }}>
                                    ≈ ${feeUsd.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Line 3: Total = base + fee (matches what wallet will request) */}
                          <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                            <span className="text-caption font-semibold" style={{ color: 'var(--text-primary)' }}>You send</span>
                            <div className="text-right">
                              <span className="font-bold text-body-sm" style={{ color: 'var(--text-primary)' }}>
                                {fmt(totalTokens)} {sym}
                              </span>
                              {totalUsd !== null && (
                                <span className="text-tiny ml-1" style={{ color: 'var(--text-muted)' }}>
                                  ≈ ${totalUsd.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Divider with arrow */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t" style={{ borderColor: 'var(--border)' }} />
                      <Zap className="h-3.5 w-3.5" style={{ color: 'var(--brand)' }} />
                      <div className="flex-1 border-t" style={{ borderColor: 'var(--border)' }} />
                    </div>

                    {/* They receive */}
                    <div className="flex items-center justify-between">
                      <span className="text-caption" style={{ color: 'var(--text-muted)' }}>They receive</span>
                      <span className="font-bold text-body-sm" style={{ color: 'var(--success)' }}>
                        exactly {data.amount} {data.toToken}
                      </span>
                    </div>

                    {/* Time estimate */}
                    {quoteInner?.timeEstimate && (
                      <p className="text-tiny text-center" style={{ color: 'var(--text-faint)' }}>
                        Estimated delivery: ~{Math.max(60, parseInt(quoteInner.timeEstimate, 10))}s
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Wallet / CTA */}
            {!fromAddress ? (
              <button
                onClick={() => connect()}
                className="w-full py-4 rounded-xl font-bold text-base text-white"
                style={{ background: 'var(--gradient)' }}
              >
                Connect Wallet to Pay
              </button>
            ) : (
              <button
                onClick={handlePreview}
                disabled={!canPreview}
                className="w-full py-4 rounded-xl font-bold text-base text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canPreview ? 'var(--gradient)' : 'var(--elevated)' }}
              >
                {quoting ? 'Getting quote…' : hasQuote ? 'Preview Transfer' : 'Select a token to see quote'}
              </button>
            )}

            {/* Connected wallet line */}
            {fromAddress && (
              <p className="text-center text-tiny -mt-2" style={{ color: 'var(--text-faint)' }}>
                Paying from:{' '}
                <span className="font-mono">{fromAddress.slice(0, 8)}…{fromAddress.slice(-6)}</span>
                {' · '}Any overpayment is auto-refunded.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* TransferModal on top */}
      {transferQuote && (
        <TransferModal
          quote={transferQuote}
          onClose={() => {
            setTransferQuote(null);
            onClose();
          }}
          onComplete={(depositAddress, txHash) => {
            // Don't close — let TransferModal show tracking/success UI.
            // Fire the "payment sent" callback so the link is marked processing.
            if (onPaymentSent && depositAddress) {
              const payerAddress = fromAddress || '';
              const payerChain = fromChainId || '';
              onPaymentSent(txHash, depositAddress, payerAddress, payerChain);
            }
          }}
          onOutcome={(outcome: { status: string; fulfillmentTxHash?: string }) => {
            if (outcome?.status === 'success' && onPaymentConfirmed) {
              onPaymentConfirmed(outcome.fulfillmentTxHash);
            }
          }}
        />
      )}
    </>
  );
}
