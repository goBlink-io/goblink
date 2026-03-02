import React from 'react';
import { useBlinkWalletContext } from './BlinkConnectProvider';
import { formatAddress } from '../utils/address';
import { getChainMeta } from '../utils/chains';

export interface ConnectButtonProps {
  /** Button label when disconnected */
  label?: string;
  /** Show chain icon when connected */
  showChainIcon?: boolean;
  /** Theme override */
  theme?: 'light' | 'dark';
  /** Custom CSS class */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * Drop-in connect wallet button.
 * Shows "Connect Wallet" when disconnected, truncated address + chain when connected.
 *
 * @example
 * ```tsx
 * <ConnectButton />
 * <ConnectButton label="Sign In" theme="dark" />
 * ```
 */
export function ConnectButton({
  label = 'Connect Wallet',
  showChainIcon = true,
  theme,
  className,
  style,
}: ConnectButtonProps) {
  const ctx = useBlinkWalletContext();
  const resolvedTheme = theme || ctx.config.theme || 'dark';
  const isDark = resolvedTheme === 'dark';

  const handleClick = () => {
    if (ctx.isConnected) {
      ctx.openModal();
    } else {
      ctx.openModal();
    }
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: ctx.isConnected ? '8px 16px' : '10px 20px',
    borderRadius: '12px',
    border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
    backgroundColor: ctx.isConnected
      ? isDark
        ? '#18181b'
        : '#f4f4f5'
      : isDark
        ? '#3b82f6'
        : '#2563eb',
    color: ctx.isConnected
      ? isDark
        ? '#fafafa'
        : '#09090b'
      : '#ffffff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    ...style,
  };

  if (ctx.isConnected && ctx.address && ctx.chain) {
    const meta = getChainMeta(ctx.chain);

    return (
      <button onClick={handleClick} style={buttonStyle} className={className}>
        {showChainIcon && meta && (
          <span
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              backgroundColor: meta.color || '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {meta.symbol?.[0] || ctx.chain[0].toUpperCase()}
          </span>
        )}
        <span>{formatAddress(ctx.address)}</span>
        {ctx.connectedWallets.length > 1 && (
          <span
            style={{
              backgroundColor: isDark ? '#27272a' : '#e4e4e7',
              borderRadius: '6px',
              padding: '1px 6px',
              fontSize: '11px',
              color: isDark ? '#a1a1aa' : '#71717a',
            }}
          >
            +{ctx.connectedWallets.length - 1}
          </span>
        )}
      </button>
    );
  }

  return (
    <button onClick={handleClick} style={buttonStyle} className={className}>
      {label}
    </button>
  );
}
