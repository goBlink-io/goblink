/**
 * Logging utility that only logs in development mode.
 * Replace all console.log/error/warn with this to prevent leaking data in production.
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args: any[]) => {
    if (isDev) console.log('[INFO]', ...args);
  },
  
  error: (...args: any[]) => {
    if (isDev) {
      console.error('[ERROR]', ...args);
    }
    // In production, could send to monitoring service (e.g., Sentry)
    // if (typeof window !== 'undefined' && (window as any).Sentry) {
    //   (window as any).Sentry.captureException(args[0]);
    // }
  },
  
  warn: (...args: any[]) => {
    if (isDev) console.warn('[WARN]', ...args);
  },
  
  debug: (...args: any[]) => {
    if (isDev) console.debug('[DEBUG]', ...args);
  },
};
