import { NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/server/admin-auth';
import { supabase } from '@/lib/server/db';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) return errorResponse('Unauthorized', 401, { code: 'UNAUTHORIZED' });

  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || '50'),
    100,
  );
  const status = url.searchParams.get('status') || '';
  const search = url.searchParams.get('search') || '';
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (search) {
    query = query.or(
      `wallet_address.ilike.%${search}%,recipient.ilike.%${search}%,deposit_tx_hash.ilike.%${search}%,fulfillment_tx_hash.ilike.%${search}%`,
    );
  }

  const { data, count, error } = await query;
  if (error) return errorResponse(error.message, 500);

  return successResponse({
    transactions: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
