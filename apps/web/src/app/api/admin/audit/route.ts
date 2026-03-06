import { NextRequest } from 'next/server';
import { verifyAdmin } from '@/lib/server/admin-auth';
import { supabase } from '@/lib/server/db';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) return errorResponse('Unauthorized', 401, { code: 'UNAUTHORIZED' });

  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || '50', 10) || 50,
    100,
  );
  const action = url.searchParams.get('action') || '';
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (action) query = query.eq('action', action);

  const { data, count, error } = await query;
  if (error) {
    console.error('[admin-audit]', error);
    return errorResponse('Database query failed', 500);
  }

  return successResponse({
    logs: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
