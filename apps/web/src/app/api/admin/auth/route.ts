import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabase } from '@/lib/server/db';

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check admin_users whitelist
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', data.user.email)
      .single();

    if (!admin) {
      await sb.auth.signOut();
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return res;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
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
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await sb.auth.signOut();
  return res;
}
