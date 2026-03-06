import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting middleware for all API routes.
 * Uses Upstash Redis sliding window when configured, otherwise skips gracefully.
 */

type RouteLimit = { requests: number; window: `${number} ${'s' | 'm'}` };

const ROUTE_LIMITS: Array<{ pattern: RegExp; limit: RouteLimit }> = [
  { pattern: /^\/api\/auth\//, limit: { requests: 10, window: '1 m' } },
  { pattern: /^\/api\/quote$/, limit: { requests: 30, window: '1 m' } },
  { pattern: /^\/api\/deposit\/submit$/, limit: { requests: 30, window: '1 m' } },
  { pattern: /^\/api\/balances\//, limit: { requests: 60, window: '1 m' } },
  { pattern: /^\/api\/transactions\//, limit: { requests: 20, window: '1 m' } },
  { pattern: /^\/api\/pay\//, limit: { requests: 20, window: '1 m' } },
  { pattern: /^\/api\/admin\//, limit: { requests: 20, window: '1 m' } },
  { pattern: /^\/api\/route-stats\/log$/, limit: { requests: 10, window: '1 m' } },
  { pattern: /^\/api\/features\//, limit: { requests: 30, window: '1 m' } },
];

const DEFAULT_LIMIT: RouteLimit = { requests: 60, window: '1 m' };

function getLimitForRoute(pathname: string): RouteLimit {
  for (const { pattern, limit } of ROUTE_LIMITS) {
    if (pattern.test(pathname)) return limit;
  }
  return DEFAULT_LIMIT;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

// Lazy-init ratelimiters keyed by "requests:window"
let rateLimiters: Map<string, InstanceType<typeof import('@upstash/ratelimit').Ratelimit>> | null = null;

async function getRateLimiter(limit: RouteLimit) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!rateLimiters) {
    rateLimiters = new Map();
  }

  const key = `${limit.requests}:${limit.window}`;
  if (rateLimiters.has(key)) return rateLimiters.get(key)!;

  const { Ratelimit } = await import('@upstash/ratelimit');
  const { Redis } = await import('@upstash/redis');

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit.requests, limit.window),
    prefix: 'goblink:rl',
  });

  rateLimiters.set(key, rl);
  return rl;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  try {
    const limit = getLimitForRoute(pathname);
    const rl = await getRateLimiter(limit);

    if (!rl) {
      // Upstash not configured — skip rate limiting
      return NextResponse.next();
    }

    const ip = getClientIp(request);
    const identifier = `${ip}:${limit.requests}:${limit.window}`;
    const { success, limit: max, remaining, reset } = await rl.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          },
        },
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(max));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  } catch (error) {
    // Rate limiting failure should not block requests
    console.error('[rate-limit] Error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/api/:path*',
};
