import { NextResponse } from 'next/server';
import * as oneclick from '@/lib/server/oneclick';
import axios from 'axios';
import { logger } from '@/lib/logger';

const TIMEOUT = 5000; // 5 seconds

async function checkOneClickAPI(): Promise<{ status: 'ok' | 'error'; message?: string }> {
  try {
    await oneclick.getTokens();
    return { status: 'ok' };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};
  
  // Check 1Click API
  checks.oneclick = await checkOneClickAPI();
  
  // Check Solana RPC
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
    checks.solana_rpc = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
  
  // Check NEAR RPC
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
    checks.near_rpc = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
  
  // Check if any critical service is down
  const allHealthy = Object.values(checks).every(c => c.status === 'ok');
  const statusCode = allHealthy ? 200 : 503;
  
  if (!allHealthy) {
    logger.warn('[HEALTH_CHECK]', 'Some services unhealthy:', checks);
  }
  
  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  );
}
