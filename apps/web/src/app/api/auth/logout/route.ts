import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/features', request.url));
  
  // Clear the auth cookie
  response.cookies.delete('github_auth');
  
  return response;
}
