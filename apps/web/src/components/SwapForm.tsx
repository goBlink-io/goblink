'use client';

import { useState, useEffect, useCallback } from 'react';
import { Token } from '@sapphire/shared';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// Solana
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Sui
import { useCurrentAccount as useSuiAccount, ConnectButton as SuiConnectButton } from '@mysten/dapp-kit';

// NEAR
import { useNearWallet } from './NearWalletProvider';

// Phase 2.4 New Chains
import { useStellarWallet } from './StellarWalletProvider';
import { useStarknetWallet } from './StarknetWalletProvider';
import { useTonWallet } from './TonWalletProvider';
import { useTronWallet } from './TronWalletProvider';
import { useBitcoinWallet } from './BitcoinWalletProvider';

interface SwapFormProps {
  onQuoteReceived: (quote: any) => void;
  onSwapInitiated: (depositAddress: string) => void;
}

export default function SwapForm({ onQuoteReceived, onSwapInitiated }: SwapFormProps) {
  // EVM
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  
  // Solana
  const { publicKey: solanaPublicKey, connected: isSolanaConnected } = useSolanaWallet();
  
  // Sui
  const suiAccount = useSuiAccount();
  const isSuiConnected = !!suiAccount;

  // NEAR
  const { accountId: nearAccountId, isConnected: isNearConnected, connect: connectNear } = useNearWallet();

  // Phase 2.4 New Chains
  const { publicKey: stellarPublicKey, isConnected: isStellarConnected, connect: connectStellar } = useStellarWallet();
  const { address: starknetAddress, isConnected: isStarknetConnected, connect: connectStarknet } = useStarknetWallet();
  const { address: tonAddress, isConnected: isTonConnected, connect: connectTon } = useTonWallet();
  const { address: tronAddress, isConnected: isTronConnected, connect: connectTron } = useTronWallet();
  const { address: bitcoinAddress, isConnected: isBitcoinConnected, connect: connectBitcoin } = useBitcoinWallet();

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
    
    // EVM chains
    if (['ethereum', 'polygon', 'optimism', 'arbitrum', 'base', 'avalanche', 'adi', 'aurora', 'bera', 'bnb', 'gnosis', 'plasma', 'xlayer', 'monad'].includes(chain)) {
      return evmAddress || null;
    }
    // Solana
    if (chain === 'solana') {
      return solanaPublicKey?.toBase58() || null;
    }
    // Sui
    if (chain === 'sui') {
      return suiAccount?.address || null;
    }
    // NEAR
    if (chain === 'near') {
      return nearAccountId || null;
    }
    // Phase 2.4 New Chains
    if (chain === 'stellar') {
      return stellarPublicKey || null;
    }
    if (chain === 'starknet') {
      return starknetAddress || null;
    }
    if (chain === 'ton') {
      return tonAddress || null;
    }
    if (chain === 'tron') {
      return tronAddress || null;
    }
    if (chain === 'bitcoin') {
      return bitcoinAddress || null;
    }
    return null;
  }, [tokens, evmAddress, solanaPublicKey, suiAccount, nearAccountId, stellarPublicKey, starknetAddress, tonAddress, tronAddress, bitcoinAddress]);

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

  const isWalletConnectedForChain = (assetId: string) => {
    return !!getConnectedAddressForChain(assetId);
  };

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Swap Tokens</h2>
        <div className="flex flex-wrap gap-2">
          <ConnectButton label="EVM" />
          <WalletMultiButton />
          <SuiConnectButton />
          <button
            onClick={connectNear}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            {isNearConnected ? `NEAR: ${nearAccountId?.slice(0, 8)}...` : 'Connect NEAR'}
          </button>
          <button
            onClick={connectStellar}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            {isStellarConnected ? `XLM: ${stellarPublicKey?.slice(0, 8)}...` : 'Connect Stellar'}
          </button>
          <button
            onClick={connectStarknet}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            {isStarknetConnected ? `Starknet: ${starknetAddress?.slice(0, 8)}...` : 'Connect Starknet'}
          </button>
          <button
            onClick={connectTon}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {isTonConnected ? `TON: ${tonAddress?.slice(0, 8)}...` : 'Connect TON'}
          </button>
          <button
            onClick={connectTron}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            {isTronConnected ? `TRON: ${tronAddress?.slice(0, 8)}...` : 'Connect TRON'}
          </button>
          <button
            onClick={connectBitcoin}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            {isBitcoinConnected ? `BTC: ${bitcoinAddress?.slice(0, 8)}...` : 'Connect Bitcoin'}
          </button>
        </div>
      </div>

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
