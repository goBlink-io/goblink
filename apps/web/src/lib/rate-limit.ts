/**
 * Simple in-memory rate limiter for Vercel serverless functions.
 * Note: This won't persist across function invocations, but provides basic protection.
 * For production, consider using Vercel KV or Upstash Redis for persistent rate limiting.
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store (resets on cold start, but better than nothing)
const store = new Map<string, RequestRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetTime < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if request should be rate limited
 * @returns { allowed: boolean, limit: number, remaining: number, reset: number }
 */
export function checkRateLimit(
  identifier: string, // Usually IP address
  config: RateLimitConfig
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const key = identifier;
  
  let record = store.get(key);
  
  // If no record or reset time passed, create new record
  if (!record || record.resetTime < now) {
    record = {
      count: 1,
      resetTime: now + config.interval,
    };
    store.set(key, record);
    
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: record.resetTime,
    };
  }
  
  // Increment count
  record.count++;
  
  const allowed = record.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);
  
  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    reset: record.resetTime,
  };
}

/**
 * Predefined rate limit configs for different endpoint types
 */
export const RateLimitConfigs = {
  // Quote generation - 1Click API is free, limit is just abuse protection
  quote: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  
  // Strict - for deposit submission
  submit: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  
  // Moderate - for balance checks
  balance: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  
  // Moderate - for status checks
  status: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  
  // Moderate - for token list
  tokens: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  
  // Default - for other endpoints
  default: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
} as const;

/**
 * Get client identifier (IP address) from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (Vercel provides x-forwarded-for)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to 'unknown' (not ideal, but better than crashing)
  return 'unknown';
}
