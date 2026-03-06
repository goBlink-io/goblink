import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabase } from '@/lib/server/db';
import { logAudit, getClientIp } from '@/lib/server/audit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const res = NextResponse.json({ success: true });

    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              res.cookies.set(name, value, { ...options, sameSite: 'strict' });
            }
          },
        },
      },
    );

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.user?.email) {
      logAudit({ actor: email, action: 'admin.login_failed', metadata: { reason: error?.message ?? 'no user' }, ipAddress: ip });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check admin_users whitelist
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', data.user.email)
      .single();

    if (!admin) {
      logAudit({ actor: data.user.email, action: 'admin.login_denied', metadata: { reason: 'not_in_whitelist' }, ipAddress: ip });
      await sb.auth.signOut();
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    logAudit({ actor: data.user.email, action: 'admin.login_success', ipAddress: ip });
    return res;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const res = NextResponse.json({ success: true });

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, { ...options, sameSite: 'strict' });
          }
        },
      },
    },
  );

  // Verify the caller has a valid session before processing logout (M-08)
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  logAudit({ actor: user.email ?? user.id, action: 'admin.logout', ipAddress: ip });
  await sb.auth.signOut();
  return res;
}
