'use client';

import { HistoryEntry } from '@/hooks/useTransactionHistory';
import { Clock, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

interface RecentTransfersProps {
  history: HistoryEntry[];
  onSelect: (depositAddress: string) => void;
}

function StatusIcon({ status }: { status: string }) {
  const s = status.toUpperCase();
  if (s === 'SUCCESS' || s === 'COMPLETED')
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (s === 'FAILED' || s === 'REFUNDED')
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (s === 'PROCESSING' || s === 'DEPOSIT_RECEIVED')
    return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
  return <Clock className="h-4 w-4 text-yellow-500" />;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RecentTransfers({ history, onSelect }: RecentTransfersProps) {
  const recent = history.slice(0, 5);
  if (recent.length === 0) return null;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Transfers</h3>
      <div className="space-y-2">
        {recent.map(entry => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry.depositAddress)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <StatusIcon status={entry.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                <span className="truncate">{entry.amount} {entry.fromToken}</span>
                <span className="text-gray-400">→</span>
                <span className="truncate">{entry.toToken}</span>
              </div>
              <div className="text-xs text-gray-500">
                {entry.fromChain} → {entry.toChain}
              </div>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(entry.timestamp)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
