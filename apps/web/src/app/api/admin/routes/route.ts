import { verifyAdmin } from '@/lib/server/admin-auth';
import { supabase } from '@/lib/server/db';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await verifyAdmin())) return errorResponse('Unauthorized', 401, { code: 'UNAUTHORIZED' });

  const { data, error } = await supabase
    .from('route_confidence')
    .select('*')
    .order('total_swaps', { ascending: false });

  if (error) {
    console.error('[admin-routes]', error);
    return errorResponse('Database query failed', 500);
  }

  return successResponse({ routes: data || [] });
}
