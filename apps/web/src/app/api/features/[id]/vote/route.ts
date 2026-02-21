import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server/db';
import { getGitHubUser } from '@/lib/github-auth';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getGitHubUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('feature_request_votes')
      .select('id')
      .eq('feature_request_id', id)
      .eq('github_user_id', user.id)
      .single();

    if (existingVote) {
      // Remove vote
      await supabase
        .from('feature_request_votes')
        .delete()
        .eq('id', existingVote.id);

      // Decrement vote count
      await supabase.rpc('decrement_votes', { request_id: id });

      return NextResponse.json({ voted: false });
    } else {
      // Add vote
      await supabase
        .from('feature_request_votes')
        .insert({
          feature_request_id: id,
          github_user_id: user.id,
        });

      // Increment vote count
      await supabase.rpc('increment_votes', { request_id: id });

      return NextResponse.json({ voted: true });
    }
  } catch (error) {
    console.error('Error toggling vote:', error);
    return NextResponse.json({ error: 'Failed to toggle vote' }, { status: 500 });
  }
}
