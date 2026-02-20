'use client';

import { useState, useEffect, useCallback } from 'react';
import { sendNearTransaction, sendSuiTransaction } from '@/lib/transactions';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useAppKitProvider, useAppKitAccount } from '@reown/appkit/react';
import { useSwitchChain, useConfig as useWagmiConfig } from 'wagmi';
import { getWalletClient } from 'wagmi/actions';
import { isEvmChain, isNativeToken, EVM_CHAINS, getExplorerTxUrl } from '@goblink/shared';
import { getChainLogo } from '@/lib/chain-logos';
import { X, ArrowDown, Check, Loader2, AlertTriangle, Copy, Shield, Trophy } from 'lucide-react';
import TransactionStoryline from './TransactionStoryline';
import ConfidenceScore from './ConfidenceScore';
import TransferSuccess from './TransferSuccess';

type ModalStep = 'preview' | 'confirming' | 'tracking';

interface TransferModalProps {
  quote: any;
  onClose: () => void;
  onComplete: (depositAddress: string, txHash?: string) => void;
  onOutcome?: (success: boolean) => void;
}

interface TransactionData {
  depositAddress: string;
  status: string;
  depositTxHash: string | null;
  fulfillmentTxHash: string | null;
  amountIn: string;
  amountOut: string | null;
  createdAt: string;
}

export default function TransferModal({ quote, onClose, onComplete, onOutcome }: TransferModalProps) {
  const { quote: quoteData, quoteRequest, originTokenMetadata, destinationTokenMetadata, fromChain, toChain, feeInfo } = quote;

  const [step, setStep] = useState<ModalStep>('preview');
  const [confirmationStep, setConfirmationStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showManualDeposit, setShowManualDeposit] = useState(false);
  const [trackingStartedAt, setTrackingStartedAt] = useState(0);

  const startTracking = () => {
    setTrackingStartedAt(Date.now());
    setStep('tracking');
  };

  // Wallet hooks
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const wagmiConfig = useWagmiConfig();
  const { switchChainAsync } = useSwitchChain();
  const { walletProvider: solanaProvider } = useAppKitProvider<any>('solana');
  const { isConnected: isAppKitConnected, caipAddress } = useAppKitAccount();

  const fromLogo = getChainLogo(fromChain);
  const toLogo = getChainLogo(toChain);

  const formatAtomicAmount = (atomicAmount: string, decimals: number) => {
    try {
      const num = parseFloat(atomicAmount.replace(/[^0-9.]/g, ''));
      if (isNaN(num)) return '0';
      const human = num / Math.pow(10, decimals);
      return human.toLocaleString(undefined, { maximumFractionDigits: Math.min(decimals, 6), minimumFractionDigits: 2 });
    } catch { return atomicAmount; }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getChainFromAssetId = (assetId: string): string | null => {
    if (assetId.startsWith('nep141:')) return 'near';
    if (assetId.startsWith('sui:') || (assetId.startsWith('0x') && assetId.includes('::'))) return 'sui';
    if (assetId.includes('@')) return assetId.split('@')[1];
    return null;
  };

  const getTokenAddressFromAssetId = (assetId: string): string => {
    let address = assetId;
    if (address.includes(':')) address = address.split(':')[1];
    if (address.includes('@')) address = address.split('@')[0];
    return address;
  };

  const [outcomeLogged, setOutcomeLogged] = useState(false);

  const pollStatus = useCallback(async (depAddr: string) => {
    try {
      const response = await fetch(`/api/status/${depAddr}`);
      if (!response.ok) return;
      const data = await response.json();
      setTransaction(data);

      if (['COMPLETED', 'SUCCESS', 'FAILED', 'REFUNDED'].includes(data.status)) {
        if (!outcomeLogged) {
          setOutcomeLogged(true);
          const isSuccess = data.status === 'COMPLETED' || data.status === 'SUCCESS';
          onOutcome?.(isSuccess);
          const durationSecs = data.createdAt && data.updatedAt
            ? Math.round((new Date(data.updatedAt).getTime() - new Date(data.createdAt).getTime()) / 1000)
            : null;
          fetch('/api/route-stats/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromChain,
              toChain,
              fromToken: originTokenMetadata?.symbol || '',
              toToken: destinationTokenMetadata?.symbol || '',
              success: isSuccess,
              durationSecs,
              amountUsd: feeInfo?.estimatedUsd
                ? parseFloat(feeInfo.estimatedUsd) / (feeInfo.bps / 10000)
                : null,
            }),
          }).catch(() => {});
        }
        return true;
      }
    } catch { /* retry */ }
    return false;
  }, [outcomeLogged, fromChain, toChain, originTokenMetadata, destinationTokenMetadata, feeInfo]);

  useEffect(() => {
    if (step !== 'tracking' || !depositAddress) return;

    pollStatus(depositAddress);
    const interval = setInterval(async () => {
      const done = await pollStatus(depositAddress);
      if (done) clearInterval(interval);
    }, 6000);

    return () => clearInterval(interval);
  }, [step, depositAddress, pollStatus]);

  const handleConfirm = async () => {
    setStep('confirming');
    setError(null);
    setConfirmationStep('Preparing your transfer...');

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quoteRequest, dry: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get transfer address');
      }

      const actualQuote = await response.json();
      const depAddr = actualQuote.depositAddress || actualQuote.quote?.depositAddress || actualQuote.address;
      if (!depAddr) throw new Error('No transfer address in response');

      setDepositAddress(depAddr);
      const originChain = fromChain || getChainFromAssetId(quoteRequest.originAsset);

      if (originChain === 'near') {
        setConfirmationStep('Approve in your NEAR wallet...');
        const tokenAddress = getTokenAddressFromAssetId(quoteRequest.originAsset);
        const txHash = await sendNearTransaction({
          chain: 'near', tokenAddress, recipientAddress: depAddr,
          amount: quoteRequest.amount, decimals: originTokenMetadata?.decimals || 18,
        });
        onComplete(depAddr, txHash);
        startTracking();
      } else if (originChain === 'sui') {
        if (!currentAccount) throw new Error('Connect your Sui wallet first');
        setConfirmationStep('Approve in your Sui wallet...');
        const txHash = await sendSuiTransaction({
          chain: 'sui', tokenAddress: 'native', recipientAddress: depAddr,
          amount: quoteRequest.amount, decimals: originTokenMetadata?.decimals || 9,
        }, suiClient, currentAccount, signAndExecuteTransaction);
        onComplete(depAddr, txHash);
        startTracking();
      } else if (originChain === 'solana') {
        if (!solanaProvider || !isAppKitConnected || !caipAddress?.startsWith('solana:'))
          throw new Error('Connect your Solana wallet first');

        setConfirmationStep('Preparing Solana transaction...');
        const { PublicKey, Transaction, SystemProgram } = await import('@solana/web3.js');
        const fromPubkey = new PublicKey(solanaProvider.publicKey);
        const toPubkey = new PublicKey(depAddr);
        const lamports = Number(BigInt(quoteRequest.amount));

        const blockhashRes = await fetch('/api/balances/solana-blockhash');
        if (!blockhashRes.ok) throw new Error('Failed to fetch Solana network data');
        const { blockhash } = await blockhashRes.json();

        const transaction = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey })
          .add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));

        setConfirmationStep('Approve in your wallet (takes a few seconds)');
        const signed = typeof solanaProvider.signTransaction === 'function'
          ? await solanaProvider.signTransaction(transaction)
          : (await solanaProvider.signAllTransactions([transaction]))[0];

        setConfirmationStep('Broadcasting...');
        const base64Tx = btoa(String.fromCharCode(...new Uint8Array(signed.serialize())));
        const sendRes = await fetch('/api/balances/solana-rpc', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1, method: 'sendTransaction',
            params: [base64Tx, { encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed' }],
          }),
        });
        const sendData = await sendRes.json();
        if (sendData.error) throw new Error(sendData.error.message || 'Failed to broadcast');

        onComplete(depAddr, sendData.result);
        startTracking();
      } else if (isEvmChain(originChain!)) {
        let wc = await getWalletClient(wagmiConfig);
        if (!wc) throw new Error('Connect your EVM wallet first');

        const requiredChainId = EVM_CHAINS[originChain!]?.id;
        if (requiredChainId && wc.chain.id !== requiredChainId) {
          setConfirmationStep('Switching network...');
          await switchChainAsync({ chainId: requiredChainId });
          wc = await getWalletClient(wagmiConfig);
          if (!wc) throw new Error('Wallet disconnected during switch');
        }

        setConfirmationStep('Approve in your wallet (takes a few seconds)');
        const isNative = isNativeToken(originTokenMetadata?.symbol || '');
        let txHash: string;

        if (isNative) {
          txHash = await wc.sendTransaction({
            to: depAddr as `0x${string}`, value: BigInt(quoteRequest.amount),
          });
        } else {
          const contractAddr = originTokenMetadata?.contractAddress;
          if (!contractAddr) throw new Error('Token contract address not found');
          txHash = await wc.writeContract({
            address: contractAddr as `0x${string}`,
            abi: [{ name: 'transfer', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }],
            functionName: 'transfer',
            args: [depAddr as `0x${string}`, BigInt(quoteRequest.amount)],
          });
        }

        onComplete(depAddr, txHash);
        startTracking();
      } else {
        setShowManualDeposit(true);
        setStep('preview');
        setConfirmationStep('');
      }
    } catch (err: any) {
      console.error('Transfer error:', err);
      if (depositAddress) {
        setShowManualDeposit(true);
        setStep('preview');
      } else {
        setStep('preview');
      }
      setError(err.shortMessage || err.message || 'Transfer failed');
      setConfirmationStep('');
    }
  };

  const handleManualDeposit = () => {
    if (depositAddress) {
      onComplete(depositAddress);
      startTracking();
    }
  };

  const getExplorerLink = (txHash: string, chain: string) => {
    if (isEvmChain(chain)) return getExplorerTxUrl(chain, txHash);
    if (chain === 'solana') return `https://solscan.io/tx/${txHash}`;
    if (chain === 'near') return `https://nearblocks.io/txns/${txHash}`;
    if (chain === 'sui') return `https://suiscan.xyz/mainnet/tx/${txHash}`;
    return `https://explorer.near-intents.org/`;
  };

  const isComplete = transaction?.status === 'COMPLETED' || transaction?.status === 'SUCCESS';
  const elapsedSeconds = trackingStartedAt ? Math.floor((Date.now() - trackingStartedAt) / 1000) : 0;
  const feeUsdNum = feeInfo?.estimatedUsd ? parseFloat(feeInfo.estimatedUsd) : null;

  // Human-readable fee percentage
  const feePercent = feeInfo?.percent ? `${feeInfo.percent}%` : null;
  const timeEstimateSecs = quoteData.timeEstimate ? parseInt(quoteData.timeEstimate, 10) : 25;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end sm:items-center justify-center sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={step !== 'confirming' ? onClose : undefined} />

        <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full transform transition-all max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {step === 'preview' && 'Confirm Transfer'}
              {step === 'confirming' && 'Processing...'}
              {step === 'tracking' && 'Transfer Status'}
            </h2>
            {step !== 'confirming' && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>

          <div className="p-6">
            {/* ── STEP: PREVIEW ── */}
            {step === 'preview' && (
              <div className="space-y-5">
                {/* ── Human-readable summary card (Win #4) ── */}
                <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                  {/* You're sending */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">You&apos;re sending</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {fromLogo && (
                          <img src={fromLogo.icon} alt={fromLogo.name} className="w-8 h-8 rounded-full"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{originTokenMetadata?.symbol}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">on {fromLogo?.name || fromChain}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{quoteData.amountInFormatted}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">${quoteData.amountInUsd}</div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center -my-1 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-4 border-gray-50 dark:border-gray-800/50">
                      <ArrowDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* You'll receive */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border-t border-green-100 dark:border-green-800/40">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">You&apos;ll receive</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {toLogo && (
                          <img src={toLogo.icon} alt={toLogo.name} className="w-8 h-8 rounded-full"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{destinationTokenMetadata?.symbol}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">on {toLogo?.name || toChain}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">~{quoteData.amountOutFormatted}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">${quoteData.amountOutUsd}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--elevated)' }}>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {feeInfo?.estimatedUsd ? `$${feeInfo.estimatedUsd}` : feePercent || '—'}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Fee{feeInfo?.tier && feeInfo.tier !== 'Standard' ? ` · ${feeInfo.tier}` : ''}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--elevated)' }}>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>~{timeEstimateSecs}s</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Time</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--elevated)' }}>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {destinationTokenMetadata
                        ? formatAtomicAmount(quoteData.minAmountOut, destinationTokenMetadata.decimals)
                        : quoteData.minAmountOut}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Min. received</div>
                  </div>
                </div>

                {/* Auto-refund guarantee (Win #4) */}
                <div
                  className="flex items-start gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}
                >
                  <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: '#7C3AED' }} />
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Safety guarantee: </span>
                    If anything goes wrong, your {originTokenMetadata?.symbol || 'tokens'} are automatically returned to you.
                  </p>
                </div>

                {/* Manual deposit */}
                {showManualDeposit && depositAddress && (
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Transfer Address</div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                      Send {quoteData.amountInFormatted} to complete the transfer:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-700 text-xs break-all font-mono text-gray-900 dark:text-gray-100">
                        {depositAddress}
                      </code>
                      <button onClick={() => copyToClipboard(depositAddress)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <button onClick={handleManualDeposit}
                      className="w-full mt-3 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm">
                      I&apos;ve Sent — Track Status
                    </button>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* Confidence Score */}
                <ConfidenceScore
                  timeEstimate={quoteData.timeEstimate ? parseInt(quoteData.timeEstimate, 10) : null}
                  fromChain={fromChain}
                  toChain={toChain}
                  fromToken={originTokenMetadata?.symbol || ''}
                  toToken={destinationTokenMetadata?.symbol || ''}
                  amountUsd={feeInfo?.estimatedUsd ? parseFloat(feeInfo.estimatedUsd) / (feeInfo.bps / 10000) : null}
                  quoteAvailable={true}
                />

                {/* Confirm button */}
                {!showManualDeposit && (
                  <button onClick={handleConfirm}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-all text-base shadow-lg">
                    Confirm Transfer
                  </button>
                )}
              </div>
            )}

            {/* ── STEP: CONFIRMING ── */}
            {step === 'confirming' && (
              <div className="flex flex-col items-center py-12">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-4 border-blue-400 animate-pulse" />
                  <div className="absolute inset-4 rounded-full bg-blue-600 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {confirmationStep || 'Processing...'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                  Please don&apos;t close this window. Check your wallet for approval.
                </p>
              </div>
            )}

            {/* ── STEP: TRACKING ── */}
            {step === 'tracking' && (
              <div className="space-y-5">
                {/* Celebration on completion (Win #5) */}
                {isComplete && (
                  <TransferSuccess
                    amountOut={transaction?.amountOut && destinationTokenMetadata?.decimals ? formatAtomicAmount(transaction.amountOut, destinationTokenMetadata.decimals) : (quoteData.amountOutFormatted || '?')}
                    toToken={destinationTokenMetadata?.symbol || '?'}
                    toChain={toChain}
                    elapsedSeconds={elapsedSeconds}
                    feeUsd={feeUsdNum}
                    fromChain={fromChain}
                    fromToken={originTokenMetadata?.symbol}
                    amountIn={quoteData.amountInFormatted}
                    amountInUsd={quoteData.amountInUsd}
                    recipientAddress={quoteRequest?.recipient}
                    fromTokenIcon={originTokenMetadata?.icon}
                    toTokenIcon={destinationTokenMetadata?.icon}
                  />
                )}

                {/* "Best Rate" badge on completion (Win #3) */}
                {isComplete && (
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)' }}
                  >
                    <Trophy className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--brand, #2563eb)' }} />
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Solvers competed for your transfer — you got the best available rate.
                    </p>
                  </div>
                )}

                <TransactionStoryline
                  status={transaction?.status || null}
                  fromChain={fromChain}
                  toChain={toChain}
                  fromToken={originTokenMetadata?.symbol || '?'}
                  toToken={destinationTokenMetadata?.symbol || '?'}
                  amountIn={quoteData.amountInFormatted}
                  amountOut={transaction?.amountOut && destinationTokenMetadata?.decimals ? formatAtomicAmount(transaction.amountOut, destinationTokenMetadata.decimals) : (quoteData.amountOutFormatted || null)}
                  timeEstimate={quoteData.timeEstimate ? parseInt(quoteData.timeEstimate, 10) : null}
                  depositTxHash={transaction?.depositTxHash || null}
                  fulfillmentTxHash={transaction?.fulfillmentTxHash || null}
                  fromLogo={fromLogo}
                  toLogo={toLogo}
                  fromTokenIcon={originTokenMetadata?.icon}
                  toTokenIcon={destinationTokenMetadata?.icon}
                  getExplorerLink={getExplorerLink}
                  startedAt={trackingStartedAt}
                />

                <button onClick={onClose}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                    isComplete
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>
                  {isComplete ? 'Done' : 'Close'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
