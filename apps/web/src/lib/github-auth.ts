import { cookies } from 'next/headers';

export interface GitHubUser {
  id: string;
  login: string;
  avatar_url: string;
  access_token: string;
}

export async function getGitHubUser(): Promise<GitHubUser | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('github_auth');
  
  if (!authCookie) {
    return null;
  }

  try {
    const user = JSON.parse(authCookie.value) as GitHubUser;
    return user;
  } catch {
    return null;
  }
}
