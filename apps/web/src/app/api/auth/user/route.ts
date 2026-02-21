import { NextResponse } from 'next/server';
import { getGitHubUser } from '@/lib/github-auth';

export async function GET() {
  const user = await getGitHubUser();
  
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  // Don't send the access token to the client
  const { access_token, ...safeUser } = user;

  return NextResponse.json({ user: safeUser });
}
