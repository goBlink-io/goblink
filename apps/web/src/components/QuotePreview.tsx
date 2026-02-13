'use client';

interface QuotePreviewProps {
  quote: any;
  onReset: () => void;
}

export default function QuotePreview({ quote, onReset }: QuotePreviewProps) {
  const { quote: quoteData, quoteRequest } = quote;

  const formatAmount = (amount: string, decimals: number = 6) => {
    const num = parseFloat(amount);
    return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
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

      {/* Warning */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <svg className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-900">
              This is a dry run quote
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              To complete the swap, you'll need to connect a wallet (Phase 1.5) and send funds to the deposit address.
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Next steps after wallet integration:</strong>
        </p>
        <ol className="mt-2 text-sm text-blue-800 list-decimal list-inside space-y-1">
          <li>Connect your wallet</li>
          <li>Approve the transaction</li>
          <li>Send funds to the deposit address</li>
          <li>Track the swap status in real-time</li>
        </ol>
      </div>
    </div>
  );
}
