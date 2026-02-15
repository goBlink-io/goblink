'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Token } from '@sapphire/shared';
import { useWalletContext } from '@/contexts/WalletContext';
import { getTokenBalance } from '@/lib/balances';

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
  { id: 'solana', name: 'Solana', type: 'solana' as const },
  { id: 'sui', name: 'Sui', type: 'sui' as const },
] as const;

export default function SwapForm({ onQuoteReceived }: SwapFormProps) {
  // Use unified wallet context
  const { getAddressForChain, getConnectedChains } = useWalletContext();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  
  // Chain selections
  const [fromChain, setFromChain] = useState<string>('near');
  const [toChain, setToChain] = useState<string>('near');
  
  // Token selections
  const [originAsset, setOriginAsset] = useState('');
  const [destinationAsset, setDestinationAsset] = useState('');
  
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [refundTo, setRefundTo] = useState('');

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tokens');
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      const data = await response.json();
      setTokens(data);
      
      // Set default tokens
      if (data.length > 0) {
        const wnear = data.find((t: Token) => t.symbol === 'wNEAR');
        const usdc = data.find((t: Token) => t.symbol === 'USDC' && t.assetId.includes('17208628'));
        if (wnear) setOriginAsset(wnear.assetId);
        if (usdc) setDestinationAsset(usdc.assetId);
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    }
  };

  // Get chain type from blockchain string
  const getChainType = (blockchain?: string): 'evm' | 'solana' | 'sui' | 'near' | null => {
    if (!blockchain) return 'near';
    const chain = blockchain.toLowerCase();
    
    if (['ethereum', 'polygon', 'optimism', 'arbitrum', 'base'].includes(chain)) {
      return 'evm';
    }
    if (chain === 'solana') return 'solana';
    if (chain === 'sui') return 'sui';
    if (chain === 'near') return 'near';
    return null;
  };

  // Get connected address for the from chain
  const fromAddress = useCallback(() => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === fromChain);
    return chain ? getAddressForChain(chain.type) : null;
  }, [fromChain, getAddressForChain]);

  // Get connected address for the to chain
  const toAddress = useCallback(() => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === toChain);
    return chain ? getAddressForChain(chain.type) : null;
  }, [toChain, getAddressForChain]);

  // Filter tokens by selected chain (memoized to prevent infinite re-renders)
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

  // Auto-populate refund address based on from chain
  useEffect(() => {
    const addr = fromAddress();
    if (addr) {
      setRefundTo(addr);
    } else {
      setRefundTo('');
    }
  }, [fromChain, fromAddress]);

  // Auto-populate recipient address based on to chain (if wallet connected)
  useEffect(() => {
    const addr = toAddress();
    if (addr) {
      setRecipient(addr);
    } else {
      // Don't clear recipient if user manually entered an address
      // Only clear if it matches a previous auto-populated address
      const prevAddr = recipient;
      const isAutoPopulated = getConnectedChains().some(c => c.address === prevAddr);
      if (isAutoPopulated) {
        setRecipient('');
      }
    }
  }, [toChain, toAddress]);

  // Reset token selection when chain changes
  useEffect(() => {
    // If currently selected origin token is not in the new chain's token list, reset it
    const isOriginTokenValid = fromTokens.some(t => t.assetId === originAsset);
    if (!isOriginTokenValid && fromTokens.length > 0) {
      setOriginAsset(fromTokens[0].assetId);
    }
  }, [fromChain, fromTokens]);

  useEffect(() => {
    // If currently selected destination token is not in the new chain's token list, reset it
    const isDestTokenValid = toTokens.some(t => t.assetId === destinationAsset);
    if (!isDestTokenValid && toTokens.length > 0) {
      setDestinationAsset(toTokens[0].assetId);
    }
  }, [toChain, toTokens]);

  // Fetch balances for from tokens when address or tokens change
  useEffect(() => {
    const fetchBalances = async () => {
      const address = fromAddress();
      if (!address || fromTokens.length === 0) {
        return;
      }

      setLoadingBalances(true);
      const newBalances: Record<string, string> = {};

      // Fetch balances for all tokens on the from chain
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
          } catch (error) {
            console.error(`Failed to fetch balance for ${token.symbol}:`, error);
            newBalances[token.assetId] = '0.00';
          }
        })
      );

      setBalances(newBalances);
      setLoadingBalances(false);
    };

    fetchBalances();
  }, [fromAddress, fromTokens]);

  // Convert amount to smallest unit without scientific notation
  const convertToSmallestUnit = (amount: string, decimals: number): string => {
    // Remove any whitespace
    amount = amount.trim();
    
    // Split on decimal point
    const parts = amount.split('.');
    const wholePart = parts[0] || '0';
    const decimalPart = parts[1] || '';
    
    // Pad or truncate decimal part to match decimals
    const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
    
    // Combine and remove leading zeros (but keep at least one digit)
    const result = (wholePart + paddedDecimal).replace(/^0+/, '') || '0';
    
    return result;
  };

  const handleGetQuote = async () => {
    if (!originAsset || !destinationAsset || !amount || !recipient || !refundTo) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const originToken = tokens.find(t => t.assetId === originAsset);
      const destinationToken = tokens.find(t => t.assetId === destinationAsset);
      
      if (!originToken) throw new Error('Origin token not found');
      if (!destinationToken) throw new Error('Destination token not found');

      // Convert to smallest unit without scientific notation
      const amountInSmallestUnit = convertToSmallestUnit(amount, originToken.decimals);

      const response = await fetch('http://localhost:3001/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originAsset,
          destinationAsset,
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
      
      // Attach token metadata to the quote for proper decimal handling
      const enrichedData = {
        ...data,
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
      
      onQuoteReceived(enrichedData);
    } catch (error: any) {
      console.error('Quote error:', error);
      const errorMessage = error.message || 'Failed to get quote. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const swapTokens = () => {
    // Swap chains
    const tempChain = fromChain;
    setFromChain(toChain);
    setToChain(tempChain);
    
    // Swap tokens
    const tempAsset = originAsset;
    setOriginAsset(destinationAsset);
    setDestinationAsset(tempAsset);
  };

  // Format address for display (truncate middle)
  const formatAddress = (address: string | null) => {
    if (!address) return 'Not connected';
    if (address.length < 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  // Get display name for token (show "NEAR" instead of "wNEAR" for better UX)
  const getTokenDisplayName = (symbol: string) => {
    if (symbol === 'wNEAR') return 'NEAR';
    return symbol;
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold mb-6">Swap Tokens</h2>

      {/* From Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">From</label>
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
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>

        {/* Token Selector and Amount */}
        <div className="flex space-x-2">
          <select
            value={originAsset}
            onChange={(e) => setOriginAsset(e.target.value)}
            className="input flex-1"
          >
            <option value="">Select token...</option>
            {fromTokens.map((token) => {
              const balance = balances[token.assetId] || '0.00';
              const balanceDisplay = loadingBalances ? '...' : balance;
              return (
                <option key={token.assetId} value={token.assetId}>
                  {getTokenDisplayName(token.symbol)} - Balance: {balanceDisplay} - Price: $0.00
                </option>
              );
            })}
          </select>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="input w-32"
          />
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center my-2">
        <button 
          onClick={swapTokens} 
          className="rounded-full bg-gray-100 p-2 hover:bg-gray-200 transition-colors"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* To Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">To</label>
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

        {/* Chain Selector */}
        <div className="mb-2">
          <select
            value={toChain}
            onChange={(e) => setToChain(e.target.value)}
            className="input w-full text-sm font-semibold"
          >
            {SUPPORTED_CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>

        {/* Token Selector */}
        <select
          value={destinationAsset}
          onChange={(e) => setDestinationAsset(e.target.value)}
          className="input w-full"
        >
          <option value="">Select token...</option>
          {toTokens.map((token) => (
            <option key={token.assetId} value={token.assetId}>
              {getTokenDisplayName(token.symbol)} - Price: $0.00
            </option>
          ))}
        </select>
      </div>

      {/* Recipient Address */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recipient Address
          {!toAddress() && (
            <span className="text-xs text-amber-600 ml-2">(Manual entry required)</span>
          )}
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder={toAddress() ? "Auto-populated from connected wallet" : "Enter recipient address"}
          className="input w-full"
        />
        {toAddress() && recipient === toAddress() && (
          <p className="text-xs text-gray-500 mt-1">
            Sending to your own wallet on {toChain}
          </p>
        )}
      </div>

      {/* Refund Address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Refund Address
          <span className="text-xs text-gray-500 ml-2">(Auto-populated)</span>
        </label>
        <input
          type="text"
          value={refundTo}
          readOnly
          placeholder="Connect wallet on the From chain"
          className="input w-full bg-gray-50 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">
          This ensures failed transactions are refunded to your originating wallet
        </p>
      </div>

      {/* Get Quote Button */}
      <button
        onClick={handleGetQuote}
        disabled={loading || !originAsset || !destinationAsset || !amount || !recipient || !refundTo}
        className="btn btn-primary w-full py-3"
      >
        {loading ? 'Getting Quote...' : 'Get Quote'}
      </button>

      {/* Info Section */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Connect wallets for both chains to auto-fill addresses, or manually enter a recipient address to send to someone else.
        </p>
      </div>
    </div>
  );
}
