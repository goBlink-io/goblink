import { getSupabaseServerClient } from '@/lib/supabase-server';
import { supabase } from '@/lib/server/db';

/**
 * Verify the current request is from an authenticated admin user.
 * Returns the admin's email if valid, null otherwise.
 */
export async function verifyAdmin(): Promise<string | null> {
  const sb = await getSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user?.email) return null;

  const { data } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .single();

  return data ? user.email : null;
}
