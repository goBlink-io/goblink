'use client';

import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  const iconMap = {
    success: <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--success)' }} />,
    error: <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--error)' }} />,
    warning: <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--warning)' }} />,
    info: <Info className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--brand)' }} />,
  };

  const bgMap = {
    success: 'var(--success-bg)',
    error: 'var(--error-bg)',
    warning: 'var(--warning-bg)',
    info: 'var(--info-bg)',
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-up"
      style={{ background: bgMap[type], borderColor: 'var(--border)' }}
      onClick={onDismiss}
    >
      {iconMap[type]}
      <span className="text-body-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>
        {message}
      </span>
      <button onClick={onDismiss} style={{ color: 'var(--text-muted)' }}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
