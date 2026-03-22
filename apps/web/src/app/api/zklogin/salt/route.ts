import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { createHash, randomBytes } from 'crypto';
import { adminSupabase } from '@/lib/server/db';

/**
 * POST /api/zklogin/salt
 * 
 * Accepts a JWT from Google/Apple/Twitch OAuth and returns a deterministic salt
 * for Sui zkLogin address derivation. Same OAuth identity always gets the same salt,
 * producing a stable Sui address.
 * 
 * Body: { jwt: string }
 * Returns: { salt: string, address?: string }
 * 
 * Security:
 * - JWT is verified for structure (not signature — the prover does that)
 * - Subject ID is hashed before storage (we never store raw OAuth sub)
 * - RLS blocks all client access — only this service-role route can read/write
 * - Rate limited by Vercel edge (no custom limiter needed)
 */

interface JwtPayload {
  iss: string;   // issuer (accounts.google.com, appleid.apple.com, etc.)
  sub: string;   // subject — unique user ID
  aud: string;   // audience — our OAuth client ID
  exp: number;   // expiry
  iat: number;   // issued at
  email?: string;
  nonce?: string;
}

const ALLOWED_ISSUERS: Record<string, string> = {
  'https://accounts.google.com': 'google',
  'accounts.google.com': 'google',
  'https://appleid.apple.com': 'apple',
  'https://id.twitch.tv/oauth2': 'twitch',
};

function hashSubject(provider: string, sub: string): string {
  return createHash('sha256').update(`${provider}:${sub}`).digest('hex');
}

function generateSalt(): string {
  // 16 bytes of randomness, hex-encoded = 32 char salt
  return randomBytes(16).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jwt } = body;

    if (!jwt || typeof jwt !== 'string') {
      return NextResponse.json(
        { error: 'Missing jwt field' },
        { status: 400 },
      );
    }

    // Decode JWT (we don't verify signature — the Mysten prover does that)
    let payload: JwtPayload;
    try {
      payload = jwtDecode<JwtPayload>(jwt);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JWT format' },
        { status: 400 },
      );
    }

    // Validate issuer
    const provider = ALLOWED_ISSUERS[payload.iss];
    if (!provider) {
      return NextResponse.json(
        { error: `Unsupported issuer: ${payload.iss}` },
        { status: 400 },
      );
    }

    // Validate expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return NextResponse.json(
        { error: 'JWT has expired' },
        { status: 401 },
      );
    }

    // Validate subject exists
    if (!payload.sub) {
      return NextResponse.json(
        { error: 'JWT missing sub claim' },
        { status: 400 },
      );
    }

    // Hash the subject ID for privacy
    const subjectHash = hashSubject(provider, payload.sub);

    // Look up existing salt
    const { data: existing, error: lookupError } = await adminSupabase
      .from('zklogin_salts')
      .select('salt, sui_address')
      .eq('provider', provider)
      .eq('subject_id', subjectHash)
      .single();

    if (lookupError && lookupError.code !== 'PGRST116') {
      // PGRST116 = "not found" which is expected for new users
      console.error('[zklogin/salt] Lookup error:', lookupError);
      return NextResponse.json(
        { error: 'Internal error' },
        { status: 500 },
      );
    }

    if (existing) {
      // Existing user — return their salt and update last_used
      await adminSupabase
        .from('zklogin_salts')
        .update({ last_used_at: new Date().toISOString() })
        .eq('provider', provider)
        .eq('subject_id', subjectHash);

      return NextResponse.json({
        salt: existing.salt,
        address: existing.sui_address || undefined,
      });
    }

    // New user — generate and store a salt
    const salt = generateSalt();

    const { error: insertError } = await adminSupabase
      .from('zklogin_salts')
      .insert({
        provider,
        subject_id: subjectHash,
        salt,
      });

    if (insertError) {
      // Race condition: another request created the salt first
      if (insertError.code === '23505') {
        // Unique violation — fetch the one that was just created
        const { data: raced } = await adminSupabase
          .from('zklogin_salts')
          .select('salt, sui_address')
          .eq('provider', provider)
          .eq('subject_id', subjectHash)
          .single();

        if (raced) {
          return NextResponse.json({
            salt: raced.salt,
            address: raced.sui_address || undefined,
          });
        }
      }

      console.error('[zklogin/salt] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Internal error' },
        { status: 500 },
      );
    }

    return NextResponse.json({ salt });
  } catch (error) {
    console.error('[zklogin/salt] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    );
  }
}
