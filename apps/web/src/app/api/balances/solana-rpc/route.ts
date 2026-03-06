import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

const ALLOWED_METHODS = new Set([
  'getLatestBlockhash',
  'getBalance',
  'getAccountInfo',
  'getTokenAccountBalance',
  'getTokenAccountsByOwner',
  'sendTransaction',
  'simulateTransaction',
  'getFeeForMessage',
  'getMinimumBalanceForRentExemption',
  'getRecentPrioritizationFees',
]);

// Simple in-memory rate limiter: max requests per IP per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);
  if (!entry || now >= entry.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { jsonrpc: '2.0', error: { code: -32000, message: 'Rate limit exceeded' }, id: null },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (!body.method || !ALLOWED_METHODS.has(body.method)) {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 403 });
    }

    const response = await axios.post(SOLANA_RPC_URL, body, {
      headers: { 'Content-Type': 'application/json' },
    });
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error('[solana-rpc]', error);
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Internal server error' }, id: null },
      { status: 500 }
    );
  }
}
