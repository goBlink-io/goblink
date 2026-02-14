'use client';

import { useState } from 'react';

interface QuotePreviewProps {
  quote: any;
  onReset: () => void;
  onConfirmSwap?: (quoteRequest: any) => void;
}

export default function QuotePreview({ quote, onReset, onConfirmSwap }: QuotePreviewProps) {
  const { quote: quoteData, quoteRequest } = quote;
  const [isConfirming, setIsConfirming] = useState(false);

  const formatAmount = (amount: string, decimals: number = 6) => {
    const num = parseFloat(amount);
    return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
  };

  const handleConfirmSwap = async () => {
    setIsConfirming(true);
    try {
      if (onConfirmSwap) {
        await onConfirmSwap(quoteRequest);
      }
    } catch (error) {
      console.error('Failed to confirm swap:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Quote Preview</h3>
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
            <div className="font-semibold text-lg text-green-600">{quoteData.amountOutFormatted}</div>
            <div className="text-sm text-gray-500">${quoteData.amountOutUsd}</div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          {/* Minimum Output */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Minimum received</span>
            <span className="font-medium">{formatAmount(quoteData.minAmountOut)}</span>
          </div>

          {/* Time Estimate */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estimated time</span>
            <span className="font-medium">{quoteData.timeEstimate} seconds</span>
          </div>

          {/* Fees */}
          {quoteRequest.appFees && quoteRequest.appFees.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform fee</span>
              <span className="font-medium">
                {quoteRequest.appFees.map((f: any) => `${f.fee / 100}%`).join(' + ')}
              </span>
            </div>
          )}

          {/* Slippage */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Max slippage</span>
            <span className="font-medium">{(quoteRequest.slippageTolerance / 100)}%</span>
          </div>
        </div>
      </div>

      {/* Confirm Swap Button */}
      {onConfirmSwap && (
        <button
          onClick={handleConfirmSwap}
          disabled={isConfirming}
          className="btn btn-primary w-full mt-6 py-3"
        >
          {isConfirming ? 'Confirming...' : 'Confirm Swap'}
        </button>
      )}

      {/* Info */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Next steps:</strong>
        </p>
        <ol className="mt-2 text-sm text-blue-800 list-decimal list-inside space-y-1">
          <li>Review the quote details carefully</li>
          <li>Click "Confirm Swap" to get deposit address</li>
          <li>Send funds from your wallet to the deposit address</li>
          <li>Track the swap status in real-time</li>
        </ol>
      </div>
    </div>
  );
}
