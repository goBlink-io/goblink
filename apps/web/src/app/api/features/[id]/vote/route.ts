import { NextRequest, NextResponse } from 'next/server';
import { anonSupabase as supabase } from '@/lib/server/db';
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

    // Atomic vote toggle via DB function.
    // Falls back to upsert + delete approach if RPC is unavailable.
    const { data, error } = await supabase.rpc('toggle_feature_vote', {
      p_feature_request_id: id,
      p_github_user_id: user.id,
    });

    if (error) {
      // Fallback: use atomic upsert/delete with conflict handling
      const { data: existingVote } = await supabase
        .from('feature_request_votes')
        .select('id')
        .eq('feature_request_id', id)
        .eq('github_user_id', user.id)
        .single();

      if (existingVote) {
        const { error: deleteError } = await supabase
          .from('feature_request_votes')
          .delete()
          .eq('feature_request_id', id)
          .eq('github_user_id', user.id);

        if (deleteError) throw deleteError;
        await supabase.rpc('decrement_votes', { request_id: id });
        return NextResponse.json({ voted: false });
      } else {
        const { error: insertError } = await supabase
          .from('feature_request_votes')
          .upsert(
            { feature_request_id: id, github_user_id: user.id },
            { onConflict: 'feature_request_id,github_user_id', ignoreDuplicates: true },
          );

        if (insertError) throw insertError;
        await supabase.rpc('increment_votes', { request_id: id });
        return NextResponse.json({ voted: true });
      }
    }

    // RPC returns the new vote state
    return NextResponse.json({ voted: !!data });
  } catch (error) {
    console.error('Error toggling vote:', error);
    return NextResponse.json({ error: 'Failed to toggle vote' }, { status: 500 });
  }
}
