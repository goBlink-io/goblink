import { NextRequest, NextResponse } from 'next/server';
import { hashSecret } from '@/lib/server/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const secret = process.env.ADMIN_SECRET;

    if (!secret)
      return NextResponse.json(
        { error: 'Admin not configured' },
        { status: 500 },
      );
    if (password !== secret)
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 },
      );

    const token = await hashSecret(secret);
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400,
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('admin_session');
  return res;
}
