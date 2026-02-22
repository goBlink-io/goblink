'use client';

import { useState } from 'react';
import { sendNearTransaction, sendSuiTransaction } from '@/lib/transactions';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useAppKitProvider, useAppKitAccount } from '@reown/appkit/react';
import { useSwitchChain } from 'wagmi';
import { getWalletClient } from 'wagmi/actions';
import { useConfig as useWagmiConfig } from 'wagmi';
import { isEvmChain, isNativeToken, EVM_CHAINS } from '@goblink/shared';
import { formatTokenAmount } from '@/lib/format';

interface QuotePreviewProps {
  quote: any;
  onReset: () => void;
  onSwapInitiated: (depositAddress: string, txHash?: string) => void;
}

export default function QuotePreview({ quote, onReset, onSwapInitiated }: QuotePreviewProps) {
  const { quote: quoteData, quoteRequest, originTokenMetadata, destinationTokenMetadata, fromChain, toChain: _toChain, feeInfo } = quote;
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [showDepositInfo, setShowDepositInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Sui wallet hooks
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  // EVM wallet via wagmi
  const wagmiConfig = useWagmiConfig();
  const { switchChainAsync } = useSwitchChain();

  // Solana wallet via Reown AppKit
  const { walletProvider: solanaProvider } = useAppKitProvider<any>('solana');
  const { isConnected: isAppKitConnected, caipAddress } = useAppKitAccount();

  const formatAmount = (amount: string, decimals: number = 6) => {
    const num = parseFloat(amount);
    return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
  };

  // Convert atomic amount to human-readable amount
  const formatAtomicAmount = (atomicAmount: string, decimals: number) => {
    try {
      // Remove any non-numeric characters except decimal point
      const cleanAmount = atomicAmount.replace(/[^0-9.]/g, '');
      const num = parseFloat(cleanAmount);
      if (isNaN(num)) return '0';
      
      const humanReadable = num / Math.pow(10, decimals);
      return humanReadable.toLocaleString(undefined, {
        maximumFractionDigits: Math.min(decimals, 6),
        minimumFractionDigits: 2,
      });
    } catch (error) {
      console.error('Error formatting atomic amount:', error);
      return atomicAmount;
    }
  };

  const handleConfirmSwap = async () => {
    setIsConfirming(true);
    setError(null);
    setConfirmationStep('Getting deposit address...');
    
    try {
      // Step 1: Get actual quote with deposit address (dry: false)
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quoteRequest,
          dry: false, // Get actual deposit address
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get deposit address');
      }

      const actualQuote = await response.json();
      console.log('Actual quote response:', actualQuote);
      
      // Check response structure - the deposit address might be in different locations
      const receivedDepositAddress = actualQuote.depositAddress || 
                                      actualQuote.quote?.depositAddress || 
                                      actualQuote.address;
      
      if (!receivedDepositAddress) {
        console.error('Quote response:', actualQuote);
        throw new Error('No deposit address in response');
      }

      console.log('Deposit address received:', receivedDepositAddress);
      setDepositAddress(receivedDepositAddress);
      setConfirmationStep('Preparing transaction...');

      // Step 2: Determine the origin chain
      // Use fromChain passed from SwapForm (the actual chain the user selected),
      // NOT the asset ID (which may be a NEP-141 wrapper like nep141:sui.omft.near)
      const originChain = fromChain || getChainFromAssetId(quoteRequest.originAsset);
      
      console.log('=== CHAIN DETECTION DEBUG ===');
      console.log('fromChain (from SwapForm):', fromChain);
      console.log('originAssetId:', quoteRequest.originAsset);
      console.log('resolved originChain:', originChain);
      console.log('===========================');
      
      // Step 3: Handle transaction based on origin chain
      if (originChain === 'near') {
        try {
          setConfirmationStep('Please sign the transaction in your NEAR wallet...');
          
          const tokenAddress = getTokenAddressFromAssetId(quoteRequest.originAsset);
          const txHash = await sendNearTransaction({
            chain: 'near',
            tokenAddress,
            recipientAddress: receivedDepositAddress,
            amount: quoteRequest.amount,
            decimals: originTokenMetadata?.decimals || 18,
          });
          
          console.log('Transaction sent:', txHash);
          setConfirmationStep('Transaction sent! Tracking status...');

          // Navigate to status tracker with tx hash
          onSwapInitiated(receivedDepositAddress, txHash);
        } catch (txError: any) {
          console.error('Transaction error:', txError);
          // If user cancels or transaction fails, show deposit address instead
          setShowDepositInfo(true);
          setConfirmationStep('');
          setError('Transaction cancelled. You can manually send the funds to the deposit address below.');
        }
      } else if (originChain === 'sui') {
        // For Sui, trigger wallet transaction
        try {
          if (!currentAccount) {
            throw new Error('Please connect your Sui wallet first');
          }
          
          setConfirmationStep('Please sign the transaction in your Sui wallet...');
          
          // Use the native Sui coin type from token metadata (not Defuse format).
          // For native SUI: "0x0000...::sui::SUI". For custom tokens: their coin type.
          const tokenAddress = originTokenMetadata?.contractAddress ||
                               originTokenMetadata?.address ||
                               '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
          const txHash = await sendSuiTransaction({
            chain: 'sui',
            tokenAddress,
            recipientAddress: receivedDepositAddress,
            amount: quoteRequest.amount,
            decimals: originTokenMetadata?.decimals || 9,
          }, suiClient, currentAccount, signAndExecuteTransaction);
          
          console.log('Sui transaction sent:', txHash);
          setConfirmationStep('Transaction sent! Tracking status...');

          // Navigate to status tracker with tx hash
          onSwapInitiated(receivedDepositAddress, txHash);
        } catch (txError: any) {
          console.error('Sui transaction error:', txError);
          // If user cancels or transaction fails, show deposit address instead
          setShowDepositInfo(true);
          setConfirmationStep('');
          setError('Transaction cancelled. You can manually send the funds to the deposit address below.');
        }
      } else if (originChain === 'solana') {
        // For Solana: wallet signs the transaction, backend broadcasts it
        // (Solana public RPC blocks browser requests with 403, so we proxy through backend)
        try {
          if (!solanaProvider || !isAppKitConnected || !caipAddress?.startsWith('solana:')) {
            throw new Error('Please connect your Solana wallet first');
          }
          
          setConfirmationStep('Preparing Solana transaction...');
          console.log('[SOL] Solana provider methods:', Object.keys(solanaProvider));
          
          const { PublicKey, Transaction, SystemProgram } = await import('@solana/web3.js');
          
          const fromPubkey = new PublicKey(solanaProvider.publicKey);
          const toPubkey = new PublicKey(receivedDepositAddress);
          const lamports = Number(BigInt(quoteRequest.amount));
          console.log('[SOL] Transfer:', { from: fromPubkey.toString(), to: toPubkey.toString(), lamports });
          
          // Step 1: Fetch blockhash via backend proxy
          console.log('[SOL] Fetching blockhash...');
          const blockhashRes = await fetch('/api/balances/solana-blockhash');
          if (!blockhashRes.ok) throw new Error('Failed to fetch Solana blockhash');
          const { blockhash } = await blockhashRes.json();
          console.log('[SOL] Blockhash:', blockhash);
          
          // Step 2: Build transaction
          const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: fromPubkey,
          }).add(
            SystemProgram.transfer({
              fromPubkey,
              toPubkey,
              lamports,
            })
          );
          
          // Step 3: Sign via wallet — user sees approval popup
          setConfirmationStep('Please approve the transaction in your Solana wallet...');
          console.log('[SOL] Requesting wallet signature...');
          console.log('[SOL] signTransaction available:', typeof solanaProvider.signTransaction);
          
          let signed;
          if (typeof solanaProvider.signTransaction === 'function') {
            signed = await solanaProvider.signTransaction(transaction);
          } else {
            // Fallback: use signAllTransactions if signTransaction isn't available
            console.log('[SOL] signAllTransactions available:', typeof solanaProvider.signAllTransactions);
            const signedTxns = await solanaProvider.signAllTransactions([transaction]);
            signed = signedTxns[0];
          }
          console.log('[SOL] Transaction signed successfully');
          
          // Step 4: Broadcast via backend proxy
          setConfirmationStep('Broadcasting transaction...');
          const serialized = signed.serialize();
          const bytes = new Uint8Array(serialized);
          
          // Use base64 encoding which is simpler and supported
          const base64Tx = btoa(String.fromCharCode(...bytes));
          console.log('[SOL] Broadcasting transaction, size:', bytes.length);
          
          const sendRes = await fetch('/api/balances/solana-rpc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'sendTransaction',
              params: [
                base64Tx,
                { encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed' }
              ],
            }),
          });
          const sendData = await sendRes.json();
          console.log('[SOL] Broadcast response:', sendData);
          
          if (sendData.error) {
            throw new Error(sendData.error.message || 'Failed to broadcast Solana transaction');
          }
          
          const signature = sendData.result;
          console.log('[SOL] Transaction sent:', signature);
          setConfirmationStep('Transaction sent! Tracking status...');
          onSwapInitiated(receivedDepositAddress, signature);
        } catch (txError: any) {
          console.error('Solana transaction error:', txError);
          setShowDepositInfo(true);
          setConfirmationStep('');
          setError(txError.message || 'Transaction cancelled. You can manually send the funds to the deposit address below.');
        }
      } else if (isEvmChain(originChain)) {
        // EVM chain transaction signing via wagmi
        try {
          // Get fresh wallet client (ensures correct chain after any switch)
          let wc = await getWalletClient(wagmiConfig);
          if (!wc) throw new Error('Please connect your EVM wallet first');

          // Ensure wallet is on the correct chain
          const requiredChainId = EVM_CHAINS[originChain]?.id;
          if (requiredChainId && wc.chain.id !== requiredChainId) {
            setConfirmationStep('Switching network...');
            await switchChainAsync({ chainId: requiredChainId });
            // Re-fetch wallet client after chain switch (old ref is stale)
            wc = await getWalletClient(wagmiConfig);
            if (!wc) throw new Error('Wallet disconnected during network switch');
          }

          setConfirmationStep('Please approve the transaction in your wallet...');

          const tokenSymbol = originTokenMetadata?.symbol || '';
          const isNative = isNativeToken(tokenSymbol);

          let txHash: string;
          if (isNative) {
            // Native token transfer (ETH, BNB, AVAX, etc.)
            txHash = await wc.sendTransaction({
              to: receivedDepositAddress as `0x${string}`,
              value: BigInt(quoteRequest.amount),
            });
          } else {
            // ERC-20 token transfer
            const contractAddr = originTokenMetadata?.contractAddress;
            if (!contractAddr) throw new Error('Token contract address not found');

            txHash = await wc.writeContract({
              address: contractAddr as `0x${string}`,
              abi: [{
                name: 'transfer',
                type: 'function',
                inputs: [
                  { name: 'to', type: 'address' },
                  { name: 'amount', type: 'uint256' },
                ],
                outputs: [{ type: 'bool' }],
              }],
              functionName: 'transfer',
              args: [receivedDepositAddress as `0x${string}`, BigInt(quoteRequest.amount)],
            });
          }

          console.log('EVM transaction sent:', txHash);
          setConfirmationStep('Transaction sent! Tracking status...');
          onSwapInitiated(receivedDepositAddress, txHash);
        } catch (txError: any) {
          console.error('EVM transaction error:', txError);
          setShowDepositInfo(true);
          setConfirmationStep('');
          setError(txError.shortMessage || txError.message || 'Transaction cancelled. You can manually send the funds to the deposit address below.');
        }
      } else {
        // For other chains (Bitcoin, Tron, etc.), show deposit address for manual transfer
        setShowDepositInfo(true);
        setConfirmationStep('');
      }
      
    } catch (err: any) {
      console.error('Confirm swap error:', err);
      const errorMessage = err.message || 'Failed to complete swap';
      setError(errorMessage);
      setConfirmationStep('');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleManualDeposit = () => {
    if (depositAddress) {
      onSwapInitiated(depositAddress);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to extract chain from asset ID
  const getChainFromAssetId = (assetId: string): string | null => {
    // Asset ID format examples:
    // nep141:wrap.near -> near
    // sui:0x0000...::sui::SUI -> sui (or just the hex address for native SUI)
    // erc20:0x...@ethereum -> ethereum
    // spl:...@solana -> solana
    
    if (assetId.startsWith('nep141:')) return 'near';
    if (assetId.startsWith('sui:')) return 'sui';
    
    // Check if it's a Sui address (starts with 0x and contains ::)
    if (assetId.startsWith('0x') && assetId.includes('::')) return 'sui';
    
    if (assetId.includes('@')) {
      const chain = assetId.split('@')[1];
      return chain;
    }
    return null; // Return null instead of defaulting to avoid wrong chain
  };

  // Helper to extract token address from asset ID
  const getTokenAddressFromAssetId = (assetId: string): string => {
    // Remove protocol prefix and chain suffix
    let address = assetId;
    
    if (address.includes(':')) {
      address = address.split(':')[1];
    }
    
    if (address.includes('@')) {
      address = address.split('@')[0];
    }
    
    return address;
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Transfer Preview</h3>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ✕ Reset
        </button>
      </div>

      {/* Quote Details */}
      <div className="space-y-4">
        {/* Input Amount */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">You send</span>
          <div className="text-right">
            <div className="font-semibold text-lg">{quoteData.amountInFormatted}</div>
            <div className="text-sm text-gray-500">${quoteData.amountInUsd}</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="rounded-full bg-gray-100 p-2">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Output Amount */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">You receive</span>
          <div className="text-right">
            <div className="font-semibold text-lg text-green-600">{formatTokenAmount(quoteData.amountOutFormatted)}</div>
            <div className="text-sm text-gray-500">${quoteData.amountOutUsd}</div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          {/* Minimum Output */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Minimum received</span>
            <span className="font-medium">
              {destinationTokenMetadata
                ? formatAtomicAmount(quoteData.minAmountOut, destinationTokenMetadata.decimals)
                : formatAmount(quoteData.minAmountOut)}
            </span>
          </div>

          {/* Time Estimate */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estimated time</span>
            <span className="font-medium">{Math.max(60, quoteData.timeEstimate ?? 60)} seconds</span>
          </div>

          {/* Fees */}
          {/* Fee display — show dollar amount (behavioral: absolute feels smaller) */}
          {feeInfo && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Platform fee
                {feeInfo.tier && feeInfo.tier !== 'Standard' && (
                  <span className="ml-1 text-xs text-green-600 font-medium">
                    ({feeInfo.tier} rate)
                  </span>
                )}
              </span>
              <span className="font-medium">
                {feeInfo.estimatedUsd
                  ? `$${feeInfo.estimatedUsd}`
                  : `${feeInfo.percent}%`}
              </span>
            </div>
          )}
          {!feeInfo && quoteRequest.appFees && quoteRequest.appFees.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform fee</span>
              <span className="font-medium">
                {quoteRequest.appFees.map((f: any) => `${f.fee / 100}%`).join(' + ')}
              </span>
            </div>
          )}

          {/* Slippage */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Price protection</span>
            <span className="font-medium">{(quoteRequest.slippageTolerance / 100)}%</span>
          </div>
        </div>
      </div>

      {/* Deposit Address Info (shown after getting deposit address for non-NEAR or on error) */}
      {showDepositInfo && depositAddress && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Transfer Address</h4>
          <p className="text-sm text-blue-800 mb-3">
            Send {quoteData.amountInFormatted} to the address below to complete the transfer:
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-white rounded border border-blue-300 text-sm break-all">
              {depositAddress}
            </code>
            <button
              onClick={() => copyToClipboard(depositAddress)}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={handleManualDeposit}
            className="btn btn-primary w-full mt-4"
          >
            I&apos;ve Sent the Funds — Track Status
          </button>
        </div>
      )}

      {/* Confirm Swap Button */}
      {!showDepositInfo && (
        <button
          onClick={handleConfirmSwap}
          disabled={isConfirming}
          className="btn btn-primary w-full mt-6 py-3"
        >
          {isConfirming ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {confirmationStep || 'Processing...'}
            </span>
          ) : (
            'Confirm Transfer'
          )}
        </button>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-900">{error}</p>
          </div>
        </div>
      )}

      {/* Info */}
      {!error && !showDepositInfo && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Next steps:</strong>
          </p>
          <ol className="mt-2 text-sm text-blue-800 list-decimal list-inside space-y-1">
            <li>Review the transfer details above</li>
            <li>Click &quot;Confirm Transfer&quot; to proceed</li>
            <li>Approve the transaction in your wallet</li>
            <li>Track the transfer status in real-time</li>
          </ol>
        </div>
      )}
    </div>
  );
}
