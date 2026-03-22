import { cookies } from 'next/headers';
import { jwtDecrypt } from 'jose';

export interface GitHubUser {
  id: string;
  login: string;
  avatar_url: string;
  access_token: string;
}

const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
};

export async function getGitHubUser(): Promise<GitHubUser | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('github_auth');

  if (!authCookie) {
    return null;
  }

  try {
    const secret = getSessionSecret();
    if (!secret) return null;

    const { payload } = await jwtDecrypt(authCookie.value, secret);

    return {
      id: payload.userId as string,
      login: payload.login as string,
      avatar_url: payload.avatarUrl as string,
      access_token: payload.accessToken as string,
    };
  } catch {
    return null;
  }
}
