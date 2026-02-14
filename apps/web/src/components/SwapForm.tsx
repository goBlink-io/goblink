'use client';

import { useState, useEffect, useCallback } from 'react';
import { Token } from '@sapphire/shared';
import { useWalletContext } from '@/contexts/WalletContext';

interface SwapFormProps {
  onQuoteReceived: (quote: any) => void;
  onSwapInitiated: (depositAddress: string) => void;
}

export default function SwapForm({ onQuoteReceived }: SwapFormProps) {
  // Use unified wallet context
  const { getAddressForChain } = useWalletContext();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Helper to get current connected address based on selected token's chain
  const getConnectedAddressForChain = useCallback((assetId: string) => {
    const token = tokens.find(t => t.assetId === assetId);
    if (!token) return null;

    const chain = token.blockchain?.toLowerCase() || 'near';
    
    if (['ethereum', 'polygon', 'optimism', 'arbitrum', 'base'].includes(chain)) {
      return getAddressForChain('evm');
    }
    if (chain === 'solana') {
      return getAddressForChain('solana');
    }
    if (chain === 'sui') {
      return getAddressForChain('sui');
    }
    if (chain === 'near') {
      return getAddressForChain('near');
    }
    return null;
  }, [tokens, getAddressForChain]);

  // Auto-fill addresses based on token selection and connected wallets
  useEffect(() => {
    const originAddr = getConnectedAddressForChain(originAsset);
    if (originAddr) setRefundTo(originAddr);

    const destAddr = getConnectedAddressForChain(destinationAsset);
    if (destAddr) setRecipient(destAddr);
  }, [originAsset, destinationAsset, getConnectedAddressForChain]);

  const handleGetQuote = async () => {
    if (!originAsset || !destinationAsset || !amount || !recipient || !refundTo) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const originToken = tokens.find(t => t.assetId === originAsset);
      if (!originToken) throw new Error('Origin token not found');

      const amountInSmallestUnit = (parseFloat(amount) * Math.pow(10, originToken.decimals)).toString();

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
      onQuoteReceived(data);
    } catch (error: any) {
      console.error('Quote error:', error);
      const errorMessage = error.message || 'Failed to get quote. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const swapTokens = () => {
    const temp = originAsset;
    setOriginAsset(destinationAsset);
    setDestinationAsset(temp);
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold mb-6">Swap Tokens</h2>

      {/* Origin Token */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
        <div className="flex space-x-2">
          <select
            value={originAsset}
            onChange={(e) => setOriginAsset(e.target.value)}
            className="input flex-1"
          >
            <option value="">Select token...</option>
            {tokens.map((token) => (
              <option key={token.assetId} value={token.assetId}>
                {token.symbol} ({token.blockchain || 'NEAR'})
              </option>
            ))}
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

      <div className="flex justify-center my-2">
        <button onClick={swapTokens} className="rounded-full bg-gray-100 p-2 hover:bg-gray-200 transition-colors">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Destination Token */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
        <select
          value={destinationAsset}
          onChange={(e) => setDestinationAsset(e.target.value)}
          className="input w-full"
        >
          <option value="">Select token...</option>
          {tokens.map((token) => (
            <option key={token.assetId} value={token.assetId}>
              {token.symbol} ({token.blockchain || 'NEAR'})
            </option>
          ))}
        </select>
      </div>

      {/* Recipient Address */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Destination chain address"
          className="input w-full"
        />
      </div>

      {/* Refund Address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Refund Address</label>
        <input
          type="text"
          value={refundTo}
          onChange={(e) => setRefundTo(e.target.value)}
          placeholder="Origin chain address"
          className="input w-full"
        />
      </div>

      <button
        onClick={handleGetQuote}
        disabled={loading || !originAsset || !destinationAsset || !amount || !recipient || !refundTo}
        className="btn btn-primary w-full py-3"
      >
        {loading ? 'Getting Quote...' : 'Get Quote'}
      </button>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Connect the appropriate wallet for each chain to auto-fill addresses.
        </p>
      </div>
    </div>
  );
}
