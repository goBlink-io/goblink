'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Token } from '@goblink/shared';
import { useWalletContext } from '@/contexts/WalletContext';
import { useToast } from '@/contexts/ToastContext';
import { getTokenBalance } from '@/lib/balances';
import TokenSelector from './TokenSelector';
import NoWalletCard from './NoWalletCard';
import SmartTransactionNudge from './SmartTransactionNudge';
import { Skeleton } from './ui/Skeleton';
import { useSmartFirstTransaction } from '@/hooks/useSmartFirstTransaction';
import { useSmartDefaults } from '@/hooks/useSmartDefaults';

interface SwapFormProps {
  onQuoteReceived: (quote: any) => void;
  refreshKey?: number;
  onSwapInitiated: (depositAddress: string) => void;
}

// Available chains for selection
const SUPPORTED_CHAINS = [
  { id: 'aptos', name: 'Aptos', type: 'aptos' as const },
  { id: 'arbitrum', name: 'Arbitrum', type: 'evm' as const },
  { id: 'base', name: 'Base', type: 'evm' as const },
  { id: 'berachain', name: 'Berachain', type: 'evm' as const },
  { id: 'bsc', name: 'BNB Chain', type: 'evm' as const },
  { id: 'ethereum', name: 'Ethereum', type: 'evm' as const },
  { id: 'monad', name: 'Monad', type: 'evm' as const },
  { id: 'near', name: 'NEAR', type: 'near' as const },
  { id: 'optimism', name: 'Optimism', type: 'evm' as const },
  { id: 'polygon', name: 'Polygon', type: 'evm' as const },
  { id: 'solana', name: 'Solana', type: 'solana' as const },
  { id: 'starknet', name: 'Starknet', type: 'starknet' as const },
  { id: 'sui', name: 'Sui', type: 'sui' as const },
  { id: 'ton', name: 'TON', type: 'ton' as const },
  { id: 'tron', name: 'Tron', type: 'tron' as const },
] as const;

export default function SwapForm({ onQuoteReceived, refreshKey }: SwapFormProps) {
  const { getAddressForChain, connectedWallets, isChainConnected, openModal } = useWalletContext();
  const { toast } = useToast();
  const recipientRef = useRef<HTMLInputElement>(null);

  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [toBalances, setToBalances] = useState<Record<string, string>>({});
  const [loadingToBalances, setLoadingToBalances] = useState(false);
  
  const [fromChain, setFromChain] = useState<string>('near');
  const [toChain, setToChain] = useState<string>('near');

  // Smart defaults — pre-fill from user's most common route
  const { getSuggestedRoute, isHydrated: defaultsHydrated } = useSmartDefaults();
  const [originAsset, setOriginAsset] = useState('');
  const [destinationAsset, setDestinationAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [refundTo, setRefundTo] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const getChainIdFromType = (chainType: string | null): string => {
    switch (chainType) {
      case 'near': return 'near';
      case 'evm': return 'ethereum';
      case 'solana': return 'solana';
      case 'sui': return 'sui';
      case 'aptos': return 'aptos';
      case 'starknet': return 'starknet';
      case 'ton': return 'ton';
      case 'tron': return 'tron';
      default: return 'near';
    }
  };

  // Auto-set from chain when first wallet connects
  useEffect(() => {
    if (connectedWallets.length > 0) {
      const first = connectedWallets[0];
      const chainId = getChainIdFromType(first.chain);
      setFromChain(chainId);
    }
  }, [connectedWallets.length]);

  useEffect(() => {
    fetchTokens();
  }, []);

  // Apply smart defaults on mount — but only if no URL params override
  useEffect(() => {
    if (!defaultsHydrated) return;
    // Don't override if URL params present (payment request links)
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (params.has('from') || params.has('to') || params.has('fromChain') || params.has('toChain')) return;

    const suggested = getSuggestedRoute();
    if (!suggested) return;
    setFromChain(suggested.fromChain);
    setToChain(suggested.toChain);
  }, [defaultsHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTokens = async () => {
    setTokensLoading(true);
    try {
      // Fetch tokens immediately (fast — no pricing data)
      const tokensResponse = await fetch('/api/tokens');
      if (!tokensResponse.ok) throw new Error(`API responded with status ${tokensResponse.status}`);
      const tokensData = await tokensResponse.json();
      setTokens(tokensData);
      
      // Set defaults immediately
      if (tokensData.length > 0) {
        const near = tokensData.find((t: Token) => t.symbol === 'NEAR' && t.assetId.includes('wrap.near')) || tokensData.find((t: Token) => t.symbol === 'wNEAR');
        const usdc = tokensData.find((t: Token) => t.symbol === 'USDC' && t.assetId.includes('17208628'));
        if (near) setOriginAsset(near.assetId);
        if (usdc) setDestinationAsset(usdc.assetId);
      }
      
      setTokensLoading(false);
      
      // Fetch prices in parallel (fills in after)
      fetch('/api/tokens/prices')
        .then(async (pricesResponse) => {
          if (!pricesResponse.ok) return;
          const pricesData = await pricesResponse.json();
          
          // Merge prices into tokens
          const priceMap = new Map<string, string>(
            pricesData.map((p: { assetId: string; priceUsd?: string }) => [p.assetId, p.priceUsd || ''])
          );
          setTokens((prev) =>
            prev.map((token) => {
              const newPrice = priceMap.get(token.assetId);
              return {
                ...token,
                priceUsd: newPrice || token.priceUsd,
              };
            })
          );
        })
        .catch((err) => {
          console.warn('Failed to fetch prices:', err);
          // Non-critical — tokens still work without prices
        });
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      toast('Failed to load tokens. Please refresh.', 'error');
      setTokensLoading(false);
    }
  };

  const fromAddress = useCallback(() => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === fromChain);
    return chain ? getAddressForChain(chain.type) : null;
  }, [fromChain, getAddressForChain]);

  const toAddress = useCallback(() => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === toChain);
    return chain ? getAddressForChain(chain.type) : null;
  }, [toChain, getAddressForChain]);

  // Chains where user has a wallet connected (for NoWalletCard "switch chain" option)
  const connectedChainOptions = useMemo(() => {
    return SUPPORTED_CHAINS.filter(c => {
      if (c.id === toChain) return false; // Don't suggest current chain
      return isChainConnected(c.type);
    }).map(c => ({ id: c.id, name: c.name }));
  }, [toChain, isChainConnected]);

  const fromTokens = useMemo(() => {
    return tokens.filter(token => {
      const tokenChain = (token.blockchain || 'near').toLowerCase();
      return tokenChain === fromChain;
    });
  }, [tokens, fromChain]);

  const toTokens = useMemo(() => {
    return tokens.filter(token => {
      const tokenChain = (token.blockchain || 'near').toLowerCase();
      return tokenChain === toChain;
    });
  }, [tokens, toChain]);

  // Smart First Transaction — contextual nudges for new/returning users
  const selectedFromToken = useMemo(() => fromTokens.find(t => t.assetId === originAsset), [fromTokens, originAsset]);
  const estimatedUsd = useMemo(() => {
    if (!amount || !selectedFromToken) return 0;
    const price = parseFloat(selectedFromToken.priceUsd || '') || selectedFromToken.price || 0;
    if (price <= 0) return 0;
    return parseFloat(amount) * price;
  }, [amount, selectedFromToken]);
  // Detect if user is on their usual route
  const isUsualRoute = useMemo(() => {
    const suggested = getSuggestedRoute();
    if (!suggested) return false;
    return suggested.fromChain === fromChain && suggested.toChain === toChain;
  }, [fromChain, toChain, getSuggestedRoute]);

  const { nudge, dismiss: dismissNudge } = useSmartFirstTransaction(
    fromChain,
    toChain,
    selectedFromToken?.symbol || '',
    estimatedUsd,
  );

  useEffect(() => {
    const addr = fromAddress();
    if (addr) setRefundTo(addr);
    else setRefundTo('');
  }, [fromChain, fromAddress]);

  useEffect(() => {
    const addr = toAddress();
    if (addr) {
      setRecipient(addr);
    } else {
      const prevAddr = recipient;
      const isAutoPopulated = connectedWallets.some(c => c.address === prevAddr);
      if (isAutoPopulated) setRecipient('');
    }
  }, [toChain, toAddress]);

  useEffect(() => {
    const isOriginTokenValid = fromTokens.some(t => t.assetId === originAsset);
    if (!isOriginTokenValid && fromTokens.length > 0) setOriginAsset(fromTokens[0].assetId);
  }, [fromChain, fromTokens]);

  useEffect(() => {
    const isDestTokenValid = toTokens.some(t => t.assetId === destinationAsset);
    if (!isDestTokenValid && toTokens.length > 0) setDestinationAsset(toTokens[0].assetId);
  }, [toChain, toTokens]);

  useEffect(() => {
    const fetchBalances = async () => {
      const address = fromAddress();
      if (!address || fromTokens.length === 0) { setBalances({}); return; }
      setLoadingBalances(true);
      const newBalances: Record<string, string> = {};
      await Promise.all(
        fromTokens.map(async (token) => {
          try {
            const balance = await getTokenBalance(address, {
              blockchain: token.blockchain,
              contractAddress: token.contractAddress,
              decimals: token.decimals,
              symbol: token.symbol,
            });
            newBalances[token.assetId] = balance;
          } catch {
            newBalances[token.assetId] = '0.00';
          }
        })
      );
      setBalances(newBalances);
      setLoadingBalances(false);
    };
    setBalances({});
    fetchBalances();
  }, [fromAddress(), fromTokens, fromChain, refreshKey]);

  // Fetch destination chain balances
  useEffect(() => {
    const fetchToBalances = async () => {
      const address = toAddress();
      if (!address || toTokens.length === 0) { setToBalances({}); return; }
      setLoadingToBalances(true);
      const newBalances: Record<string, string> = {};
      await Promise.all(
        toTokens.map(async (token) => {
          try {
            const balance = await getTokenBalance(address, {
              blockchain: token.blockchain,
              contractAddress: token.contractAddress,
              decimals: token.decimals,
              symbol: token.symbol,
            });
            newBalances[token.assetId] = balance;
          } catch {
            newBalances[token.assetId] = '0.00';
          }
        })
      );
      setToBalances(newBalances);
      setLoadingToBalances(false);
    };
    setToBalances({});
    fetchToBalances();
  }, [toAddress(), toTokens, toChain, refreshKey]);

  const convertToSmallestUnit = (amount: string, decimals: number): string => {
    amount = amount.trim();
    const parts = amount.split('.');
    const wholePart = parts[0] || '0';
    const decimalPart = parts[1] || '';
    const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
    const result = (wholePart + paddedDecimal).replace(/^0+/, '') || '0';
    return result;
  };

  const handleGetQuote = async () => {
    setFormError(null);
    if (!originAsset || !destinationAsset || !amount || !recipient || !refundTo) {
      setFormError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const originToken = fromTokens.find(t => t.assetId === originAsset) || tokens.find(t => t.assetId === originAsset);
      const destinationToken = toTokens.find(t => t.assetId === destinationAsset) || tokens.find(t => t.assetId === destinationAsset);
      if (!originToken) throw new Error('Origin token not found');
      if (!destinationToken) throw new Error('Destination token not found');

      const amountInSmallestUnit = convertToSmallestUnit(amount, originToken.decimals);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originAsset: (originToken as any).defuseAssetId || originAsset,
          destinationAsset: (destinationToken as any).defuseAssetId || destinationAsset,
          amount: amountInSmallestUnit,
          recipient,
          refundTo,
          dry: true,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Unable to get a quote right now. Please try again.');
      }
      const data = await response.json();
      const enrichedData = {
        ...data,
        fromChain,
        toChain,
        originTokenMetadata: {
          symbol: originToken.symbol,
          decimals: originToken.decimals,
          assetId: originToken.assetId,
          blockchain: originToken.blockchain,
          contractAddress: originToken.contractAddress,
          icon: originToken.icon,
        },
        destinationTokenMetadata: {
          symbol: destinationToken.symbol,
          decimals: destinationToken.decimals,
          assetId: destinationToken.assetId,
          blockchain: destinationToken.blockchain,
          contractAddress: destinationToken.contractAddress,
          icon: destinationToken.icon,
        },
      };
      toast('Quote ready — review and confirm below', 'success');
      onQuoteReceived(enrichedData);
    } catch (error: any) {
      let errorMessage = 'Unable to get a quote right now. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setFormError(errorMessage);
      toast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const swapTokens = () => {
    const tempChain = fromChain;
    setFromChain(toChain);
    setToChain(tempChain);
    const tempAsset = originAsset;
    setOriginAsset(destinationAsset);
    setDestinationAsset(tempAsset);
  };

  const formatAddress = (address: string | null) => {
    if (!address) return 'Not connected';
    if (address.length < 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (tokensLoading) {
    return (
      <div className="card p-5 sm:p-6">
        <h2 className="text-h3 mb-5">Transfer</h2>
        <div className="space-y-4">
          <div><Skeleton className="h-4 w-16 mb-2" /><Skeleton className="h-11 w-full mb-2" /><Skeleton className="h-12 w-full mb-2" /><Skeleton className="h-11 w-full" /></div>
          <div className="flex justify-center"><Skeleton className="h-10 w-10 rounded-full" /></div>
          <div><Skeleton className="h-4 w-16 mb-2" /><Skeleton className="h-11 w-full mb-2" /><Skeleton className="h-12 w-full" /></div>
          <Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-h3">Transfer</h2>
        {isUsualRoute && (
          <span
            className="text-tiny font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'var(--info-bg)', color: 'var(--info-text)' }}
          >
            ★ Your usual route
          </span>
        )}
      </div>

      {/* From Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>You send</label>
          <div className="text-tiny" style={{ color: 'var(--text-muted)' }}>
            {fromAddress() ? (
              <span className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                <span className="font-mono">{formatAddress(fromAddress())}</span>
              </span>
            ) : (
              <span style={{ color: 'var(--warning)' }}>Connect wallet</span>
            )}
          </div>
        </div>

        <div className="mb-2">
          <select value={fromChain} onChange={(e) => setFromChain(e.target.value)}
            className="input w-full h-11 text-body-sm font-semibold">
            {SUPPORTED_CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>{chain.name}</option>
            ))}
          </select>
        </div>

        <TokenSelector tokens={fromTokens} selectedToken={originAsset} onSelect={setOriginAsset}
          balances={balances} loadingBalances={loadingBalances} label="Token" placeholder="Select a token..." />

        <div>
          <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0" className="input w-full h-12 text-h4 mb-2" />
          
          {originAsset && balances[originAsset] && parseFloat(balances[originAsset]) > 0 && (
            <div className="flex gap-1.5">
              {[25, 50, 75, 100].map((pct) => (
                <button key={pct} type="button"
                  onClick={() => {
                    const sel = fromTokens.find(t => t.assetId === originAsset);
                    if (!sel) return;
                    const bal = parseFloat(balances[originAsset] || '0');
                    let amt = bal * (pct / 100);
                    if (pct === 100) {
                      const natives = ['NEAR', 'SUI', 'SOL', 'ETH', 'BNB', 'MATIC', 'BERA', 'MON', 'APT', 'STRK', 'TON', 'TRX'];
                      if (natives.includes(sel.symbol)) {
                        const reserves: Record<string, number> = { NEAR: 0.1, SUI: 0.01, SOL: 0.001, ETH: 0.01, BNB: 0.002, MATIC: 0.1, BERA: 0.01, MON: 0.01, APT: 0.01, STRK: 0.01, TON: 0.05, TRX: 5 };
                        const reserve = reserves[sel.symbol] || 0;
                        amt = bal > reserve ? bal - reserve : bal;
                      }
                    }
                    setAmount(amt.toFixed(6).replace(/\.?0+$/, ''));
                  }}
                  className="flex-1 h-11 text-tiny font-semibold rounded-lg transition-all active:scale-95"
                  style={{ background: 'var(--elevated)', color: 'var(--text-secondary)' }}>
                  {pct}%
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Flip */}
      <div className="flex justify-center -my-1 relative z-10">
        <button onClick={swapTokens}
          className="w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all active:scale-90 active:rotate-180"
          style={{ background: 'var(--surface)', borderColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* To Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>You receive</label>
          <div className="text-tiny" style={{ color: 'var(--text-muted)' }}>
            {toAddress() ? (
              <span className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                <span className="font-mono">{formatAddress(toAddress())}</span>
              </span>
            ) : (
              <span style={{ color: 'var(--text-faint)' }}>No wallet</span>
            )}
          </div>
        </div>

        <div className="mb-2">
          <select value={toChain} onChange={(e) => setToChain(e.target.value)}
            className="input w-full h-11 text-body-sm font-semibold">
            {SUPPORTED_CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>{chain.name}</option>
            ))}
          </select>
        </div>

        <TokenSelector tokens={toTokens} selectedToken={destinationAsset} onSelect={setDestinationAsset}
          balances={toBalances} loadingBalances={loadingToBalances} label="Token" placeholder="Select a token..." />

        {/* No wallet on destination chain — three-path card */}
        {!toAddress() && (
          <NoWalletCard
            chainId={toChain}
            chainName={SUPPORTED_CHAINS.find(c => c.id === toChain)?.name || toChain}
            connectedChains={connectedChainOptions}
            onEnterManually={() => {
              setTimeout(() => recipientRef.current?.focus(), 100);
            }}
            onSwitchChain={(chainId) => setToChain(chainId)}
            onConnectWallet={() => openModal()}
          />
        )}
      </div>

      {/* Receiving Address */}
      <div className="mb-4">
        <label className="flex items-baseline gap-2 text-caption font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Receiving Address
          {!toAddress() && <span className="text-tiny" style={{ color: 'var(--warning)' }}>(enter manually)</span>}
        </label>
        <input ref={recipientRef} type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)}
          placeholder={toAddress() ? "Auto-filled from wallet" : "Enter receiving address"}
          className="input w-full h-11 font-mono text-body-sm" />
        {toAddress() && recipient === toAddress() && (
          <p className="text-tiny mt-1" style={{ color: 'var(--text-muted)' }}>Sending to your wallet on {toChain}</p>
        )}
      </div>

      {/* Return Address */}
      <div className="mb-5">
        <label className="flex items-baseline gap-2 text-caption font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Return Address <span className="text-tiny" style={{ color: 'var(--text-faint)' }}>(auto)</span>
        </label>
        <input type="text" value={refundTo} readOnly placeholder="Connect wallet on sending chain"
          className="input w-full h-11 font-mono text-body-sm opacity-60 cursor-not-allowed" />
        <p className="text-tiny mt-1" style={{ color: 'var(--text-faint)' }}>
          Funds returned here if transfer can&apos;t complete
        </p>
      </div>

      {/* Smart Transaction Nudge */}
      {nudge && (
        <SmartTransactionNudge
          nudge={nudge}
          onDismiss={dismissNudge}
          onUseSuggestion={(suggestedAmount) => setAmount(suggestedAmount)}
        />
      )}

      {/* Error */}
      {formError && (
        <div className="mb-4 p-3 rounded-xl text-body-sm" style={{ background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error)' }}>
          {formError}
        </div>
      )}

      {/* CTA */}
      <button onClick={handleGetQuote}
        disabled={loading || !originAsset || !destinationAsset || !amount || !recipient || !refundTo}
        className="btn btn-primary w-full h-12 text-body-sm">
        {loading ? 'Getting Preview...' : 'Preview Transfer'}
      </button>

      {/* Tip */}
      <div className="mt-4 p-3 rounded-xl text-body-sm" style={{ background: 'var(--info-bg)', color: 'var(--info-text)' }}>
        <strong>Tip:</strong> Connect wallets on both chains to auto-fill addresses.
      </div>
    </div>
  );
}
