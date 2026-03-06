import { NextRequest, NextResponse } from 'next/server';
import { anonSupabase as supabase } from '@/lib/server/db';
import { getGitHubUser } from '@/lib/github-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: comments, error } = await supabase
      .from('feature_request_comments')
      .select('*')
      .eq('feature_request_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[comments-get]', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getGitHubUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { body: commentBody } = body;

    if (!commentBody) {
      return NextResponse.json({ error: 'Comment body required' }, { status: 400 });
    }

    // Get the feature request to find the GitHub issue
    const { data: featureRequest } = await supabase
      .from('feature_requests')
      .select('github_issue_number')
      .eq('id', id)
      .single();

    let githubCommentId: number | null = null;

    // Post comment to GitHub issue if it exists
    if (featureRequest?.github_issue_number) {
      const githubToken = process.env.GITHUB_TOKEN;
      const repo = process.env.FEATURE_REQUEST_REPO || 'Urban-Blazer/goblink';

      if (githubToken) {
        try {
          const commentResponse = await fetch(
            `https://api.github.com/repos/${repo}/issues/${featureRequest.github_issue_number}/comments`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                body: `**[@${user.login}](https://github.com/${user.login})** commented:\n\n${commentBody}`,
              }),
            }
          );

          if (commentResponse.ok) {
            const commentData = await commentResponse.json();
            githubCommentId = commentData.id;
          }
        } catch (error) {
          console.error('Failed to post GitHub comment:', error);
        }
      }
    }

    // Create comment in database
    const { data: comment, error } = await supabase
      .from('feature_request_comments')
      .insert({
        feature_request_id: id,
        github_user_id: user.id,
        github_username: user.login,
        github_avatar_url: user.avatar_url,
        body: commentBody,
        github_comment_id: githubCommentId,
      })
      .select()
      .single();

    if (error) {
      console.error('[comments-post]', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
