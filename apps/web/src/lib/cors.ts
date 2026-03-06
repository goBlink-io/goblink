/**
 * CORS configuration — allowed origins derived from NEXT_PUBLIC_APP_URL.
 */

function getAllowedOrigins(): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://goblink.io';
  const origins = new Set<string>();

  try {
    origins.add(new URL(appUrl).origin);
  } catch {
    origins.add(appUrl);
  }

  // Always allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:3001');
  }

  return Array.from(origins);
}

export const ALLOWED_ORIGINS = getAllowedOrigins();

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}
