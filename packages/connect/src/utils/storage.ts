import type { ConnectedWallet } from '../core/types';

const STORAGE_KEY = '@goblink/connect:session';

/**
 * Persist wallet session to localStorage.
 */
export function persistSession(wallets: ConnectedWallet[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch {
    // localStorage may be unavailable (SSR, iframe restrictions)
  }
}

/**
 * Load persisted wallet session from localStorage.
 */
export function loadSession(): ConnectedWallet[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Clear persisted session.
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
