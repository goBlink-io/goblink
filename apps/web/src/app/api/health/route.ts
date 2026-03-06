import { NextRequest, NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import axios from 'axios';
import { logger } from '@/lib/logger';
import { verifyAdmin } from '@/lib/server/admin-auth';

const TIMEOUT = 5000; // 5 seconds

async function checkOneClickAPI(): Promise<{ status: 'ok' | 'error'; message?: string }> {
  try {
    await oneclick.getTokens();
    return { status: 'ok' };
  } catch (error) {
    return {
      status: 'error',
      message: 'Service check failed',
    };
  }
}

async function runChecks() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};

  checks.oneclick = await checkOneClickAPI();

  const solanaRpc = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  try {
    const response = await axios.post(
      solanaRpc,
      { jsonrpc: '2.0', id: 1, method: 'getHealth' },
      { timeout: TIMEOUT }
    );
    checks.solana_rpc = response.data?.result === 'ok'
      ? { status: 'ok' }
      : { status: 'error', message: 'Unhealthy response' };
  } catch (error) {
    logger.error('[HEALTH] Solana RPC error:', error);
    checks.solana_rpc = { status: 'error', message: 'Service check failed' };
  }

  const nearRpc = process.env.NEAR_RPC_URL || 'https://rpc.fastnear.com';
  try {
    const response = await axios.post(
      nearRpc,
      { jsonrpc: '2.0', id: 1, method: 'status', params: [] },
      { timeout: TIMEOUT }
    );
    checks.near_rpc = response.data?.result
      ? { status: 'ok' }
      : { status: 'error', message: 'No result' };
  } catch (error) {
    logger.error('[HEALTH] NEAR RPC error:', error);
    checks.near_rpc = { status: 'error', message: 'Service check failed' };
  }

  const allHealthy = Object.values(checks).every(c => c.status === 'ok');

  if (!allHealthy) {
    logger.warn('[HEALTH_CHECK]', 'Some services unhealthy:', checks);
  }

  return { checks, allHealthy };
}

export async function GET(request: NextRequest) {
  const { checks, allHealthy } = await runChecks();
  const statusCode = allHealthy ? 200 : 503;

  // Authenticated admins get full diagnostics
  const admin = await verifyAdmin();
  if (admin) {
    return NextResponse.json(
      { status: allHealthy ? 'healthy' : 'degraded', timestamp: new Date().toISOString(), checks },
      { status: statusCode },
    );
  }

  // Public callers get only status + timestamp — no infrastructure details
  return NextResponse.json(
    { status: allHealthy ? 'ok' : 'degraded', timestamp: new Date().toISOString() },
    { status: statusCode },
  );
}
