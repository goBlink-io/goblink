/** Client-side admin utilities */

export async function adminFetch<T = any>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 401) {
    sessionStorage.removeItem('admin_authed');
    window.location.href = '/admin';
    return null;
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length <= 12) return addr || '';
  return `${addr.slice(0, 6)}\u2026${addr.slice(-4)}`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

export function fmtUsd(n: number): string {
  return `$${fmtNumber(n)}`;
}
