import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET env var is required');
  return new TextEncoder().encode(secret);
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/features?error=no_code', request.url));
  }

  // Verify OAuth state to prevent CSRF (C-03)
  const storedState = request.cookies.get('github_oauth_state')?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/features?error=invalid_state', request.url));
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/features?error=config', request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL('/features?error=no_token', request.url));
    }

    // Fetch user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/features?error=github_api', request.url));
    }

    const userData = await userResponse.json();

    if (!userData.id || !userData.login) {
      return NextResponse.redirect(new URL('/features?error=invalid_user', request.url));
    }

    // Create signed JWT with user data (C-02) — access_token stays server-side only (H-05)
    const jwt = await new SignJWT({
      userId: String(userData.id),
      login: userData.login,
      avatarUrl: userData.avatar_url,
      accessToken: tokenData.access_token,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(getSessionSecret());

    const response = NextResponse.redirect(new URL('/features', request.url));

    // Set signed JWT as httpOnly cookie — never expose raw JSON or access_token to client
    response.cookies.set('github_auth', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Clear the state nonce cookie
    response.cookies.delete('github_oauth_state');

    return response;
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(new URL('/features?error=auth_failed', request.url));
  }
}
