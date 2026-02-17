'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Token } from '@goblink/shared';
import { useWalletContext } from '@/contexts/WalletContext';
import { useToast } from '@/contexts/ToastContext';
import { getTokenBalance } from '@/lib/balances';
import TokenSelector from './TokenSelector';

interface SwapFormProps {
  onQuoteReceived: (quote: any) => void;
  onSwapInitiated: (depositAddress: string) => void;
}

// Available chains for selection
const SUPPORTED_CHAINS = [
  { id: 'near', name: 'NEAR', type: 'near' as const },
  { id: 'ethereum', name: 'Ethereum', type: 'evm' as const },
  { id: 'polygon', name: 'Polygon', type: 'evm' as const },
  { id: 'optimism', name: 'Optimism', type: 'evm' as const },
  { id: 'arbitrum', name: 'Arbitrum', type: 'evm' as const },
  { id: 'base', name: 'Base', type: 'evm' as const },
  { id: 'bsc', name: 'BNB Chain', type: 'evm' as const },
  { id: 'berachain', name: 'Berachain', type: 'evm' as const },
  { id: 'monad', name: 'Monad', type: 'evm' as const },
  { id: 'solana', name: 'Solana', type: 'solana' as const },
  { id: 'sui', name: 'Sui', type: 'sui' as const },
  { id: 'aptos', name: 'Aptos', type: 'aptos' as const },
  { id: 'starknet', name: 'Starknet', type: 'starknet' as const },
  { id: 'ton', name: 'TON', type: 'ton' as const },
  { id: 'tron', name: 'Tron', type: 'tron' as const },
] as const;

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className || ''}`} />;
}

export default function SwapForm({ onQuoteReceived }: SwapFormProps) {
  const { walletState, getAddressForChain, getConnectedChains } = useWalletContext();
  const { toast } = useToast();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  
  const [fromChain, setFromChain] = useState<string>('near');
  const [toChain, setToChain] = useState<string>('near');
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

  useEffect(() => {
    if (walletState.isConnected && walletState.chain) {
      const chainId = getChainIdFromType(walletState.chain);
      setFromChain(chainId);
    }
  }, [walletState.isConnected, walletState.chain]);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setTokensLoading(true);
    try {
      const response = await fetch('/api/tokens');
      if (!response.ok) throw new Error(`API responded with status ${response.status}`);
      const data = await response.json();
      setTokens(data);
      if (data.length > 0) {
        const wnear = data.find((t: Token) => t.symbol === 'wNEAR');
        const usdc = data.find((t: Token) => t.symbol === 'USDC' && t.assetId.includes('17208628'));
        if (wnear) setOriginAsset(wnear.assetId);
        if (usdc) setDestinationAsset(usdc.assetId);
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      toast('Failed to load tokens. Please refresh.', 'error');
    } finally {
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
      const isAutoPopulated = getConnectedChains().some(c => c.address === prevAddr);
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
  }, [fromAddress(), fromTokens, fromChain]);

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
      const originToken = tokens.find(t => t.assetId === originAsset);
      const destinationToken = tokens.find(t => t.assetId === destinationAsset);
      if (!originToken) throw new Error('Origin token not found');
      if (!destinationToken) throw new Error('Destination token not found');

      const amountInSmallestUnit = convertToSmallestUnit(amount, originToken.decimals);
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
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to get quote');
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
        },
        destinationTokenMetadata: {
          symbol: destinationToken.symbol,
          decimals: destinationToken.decimals,
          assetId: destinationToken.assetId,
          blockchain: destinationToken.blockchain,
          contractAddress: destinationToken.contractAddress,
        },
      };
      toast('Quote ready — review and confirm below', 'success');
      onQuoteReceived(enrichedData);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get quote. Please try again.';
      setFormError(errorMessage);
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

  // Loading skeleton
  if (tokensLoading) {
    return (
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-6">Transfer</h2>
        <div className="space-y-4">
          <div>
            <SkeletonPulse className="h-4 w-16 mb-2" />
            <SkeletonPulse className="h-10 w-full mb-2" />
            <SkeletonPulse className="h-12 w-full mb-2" />
            <SkeletonPulse className="h-10 w-full" />
          </div>
          <div className="flex justify-center"><SkeletonPulse className="h-9 w-9 rounded-full" /></div>
          <div>
            <SkeletonPulse className="h-4 w-16 mb-2" />
            <SkeletonPulse className="h-10 w-full mb-2" />
            <SkeletonPulse className="h-12 w-full" />
          </div>
          <SkeletonPulse className="h-10 w-full" />
          <SkeletonPulse className="h-10 w-full" />
          <SkeletonPulse className="h-12 w-full rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold mb-6">Transfer</h2>

      {/* From Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">You send</label>
          <div className="text-xs text-gray-500">
            {fromAddress() ? (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                {formatAddress(fromAddress())}
              </span>
            ) : (
              <span className="text-amber-600">Connect wallet</span>
            )}
          </div>
        </div>

        {/* Chain Selector */}
        <div className="mb-2">
          <select
            value={fromChain}
            onChange={(e) => setFromChain(e.target.value)}
            className="input w-full text-sm font-semibold"
          >
            {SUPPORTED_CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>{chain.name}</option>
            ))}
          </select>
        </div>

        {/* Token Selector */}
        <TokenSelector
          tokens={fromTokens}
          selectedToken={originAsset}
          onSelect={setOriginAsset}
          balances={balances}
          loadingBalances={loadingBalances}
          label="Select Token"
          placeholder="Select a token..."
        />

        {/* Amount Input with Percentage Buttons */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input flex-1"
            />
          </div>
          
          {originAsset && balances[originAsset] && parseFloat(balances[originAsset]) > 0 && (
            <div className="flex space-x-1">
              {[25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  type="button"
                  onClick={() => {
                    const selectedToken = fromTokens.find(t => t.assetId === originAsset);
                    if (!selectedToken) return;
                    const balance = parseFloat(balances[originAsset] || '0');
                    let amountToSet = balance * (percentage / 100);
                    if (percentage === 100) {
                      const isNativeToken =
                        (selectedToken.symbol === 'NEAR' || selectedToken.symbol === 'wNEAR') ||
                        selectedToken.symbol === 'SUI' ||
                        selectedToken.symbol === 'SOL' ||
                        ['ETH', 'BNB', 'MATIC', 'BERA', 'MON', 'APT', 'STRK', 'TON', 'TRX'].includes(selectedToken.symbol);
                      if (isNativeToken) {
                        const gasReserve =
                          (selectedToken.symbol === 'NEAR' || selectedToken.symbol === 'wNEAR') ? 0.1 :
                          selectedToken.symbol === 'SUI' ? 0.01 :
                          selectedToken.symbol === 'SOL' ? 0.001 :
                          selectedToken.symbol === 'ETH' ? 0.01 :
                          selectedToken.symbol === 'BNB' ? 0.002 :
                          selectedToken.symbol === 'MATIC' ? 0.1 :
                          selectedToken.symbol === 'BERA' ? 0.01 :
                          selectedToken.symbol === 'MON' ? 0.01 :
                          selectedToken.symbol === 'APT' ? 0.01 :
                          selectedToken.symbol === 'STRK' ? 0.01 :
                          selectedToken.symbol === 'TON' ? 0.05 :
                          selectedToken.symbol === 'TRX' ? 5 : 0;
                        amountToSet = Math.max(0, balance - gasReserve);
                      }
                    }
                    setAmount(amountToSet.toFixed(6).replace(/\.?0+$/, ''));
                  }}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors active:scale-95"
                >
                  {percentage}%
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center my-2">
        <button 
          onClick={swapTokens} 
          className="rounded-full bg-gray-100 dark:bg-gray-800 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* To Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">You receive</label>
          <div className="text-xs text-gray-500">
            {toAddress() ? (
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                {formatAddress(toAddress())}
              </span>
            ) : (
              <span className="text-gray-400">No wallet connected</span>
            )}
          </div>
        </div>

        <div className="mb-2">
          <select
            value={toChain}
            onChange={(e) => setToChain(e.target.value)}
            className="input w-full text-sm font-semibold"
          >
            {SUPPORTED_CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>{chain.name}</option>
            ))}
          </select>
        </div>

        <TokenSelector
          tokens={toTokens}
          selectedToken={destinationAsset}
          onSelect={setDestinationAsset}
          balances={{}}
          loadingBalances={false}
          label="Select Token"
          placeholder="Select a token..."
        />
      </div>

      {/* Receiving Address */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Receiving Address
          {!toAddress() && (
            <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">(Enter manually)</span>
          )}
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder={toAddress() ? "Auto-filled from your wallet" : "Enter receiving address"}
          className="input w-full"
        />
        {toAddress() && recipient === toAddress() && (
          <p className="text-xs text-gray-500 mt-1">
            Sending to your own wallet on {toChain}
          </p>
        )}
      </div>

      {/* Return Address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Return Address
          <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">(Auto-filled)</span>
        </label>
        <input
          type="text"
          value={refundTo}
          readOnly
          placeholder="Connect wallet on the sending chain"
          className="input w-full bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">
          If the transfer can&apos;t complete, funds are returned here
        </p>
      </div>

      {/* Error Banner */}
      {formError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {formError}
        </div>
      )}

      {/* Preview Button */}
      <button
        onClick={handleGetQuote}
        disabled={loading || !originAsset || !destinationAsset || !amount || !recipient || !refundTo}
        className="btn btn-primary w-full py-3"
      >
        {loading ? 'Getting Preview...' : 'Preview Transfer'}
      </button>

      {/* Tip */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Tip:</strong> Connect wallets for both chains to auto-fill addresses, or manually enter a receiving address to send to someone else.
        </p>
      </div>
    </div>
  );
}
