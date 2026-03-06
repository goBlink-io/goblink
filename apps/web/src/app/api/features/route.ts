import { NextRequest, NextResponse } from 'next/server';
import { anonSupabase as supabase } from '@/lib/server/db';
import { getGitHubUser } from '@/lib/github-auth';

export async function GET() {
  try {
    // Fetch all feature requests with vote counts
    const { data: requests, error } = await supabase
      .from('feature_requests')
      .select(`
        *,
        feature_request_votes(count)
      `)
      .order('votes', { ascending: false });

    if (error) {
      console.error('[features-get]', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    return NextResponse.json({ error: 'Failed to fetch feature requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getGitHubUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
    }

    // Create GitHub issue
    const githubToken = process.env.GITHUB_TOKEN;
    const repo = process.env.FEATURE_REQUEST_REPO || 'Urban-Blazer/goblink';

    let issueNumber: number | null = null;
    let issueUrl: string | null = null;

    if (githubToken) {
      try {
        const issueResponse = await fetch(`https://api.github.com/repos/${repo}/issues`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            body: `${description}\n\n---\n*Submitted by [@${user.login}](https://github.com/${user.login})*`,
            labels: ['feature-request'],
          }),
        });

        if (issueResponse.ok) {
          const issueData = await issueResponse.json();
          issueNumber = issueData.number;
          issueUrl = issueData.html_url;
        }
      } catch (error) {
        console.error('Failed to create GitHub issue:', error);
      }
    }

    // Create feature request in database
    const { data: featureRequest, error } = await supabase
      .from('feature_requests')
      .insert({
        github_user_id: user.id,
        github_username: user.login,
        github_avatar_url: user.avatar_url,
        title,
        description,
        github_issue_number: issueNumber,
        github_issue_url: issueUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('[features-post]', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ featureRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating feature request:', error);
    return NextResponse.json({ error: 'Failed to create feature request' }, { status: 500 });
  }
}
