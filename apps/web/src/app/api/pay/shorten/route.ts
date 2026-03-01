import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/server/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient, toChain, toToken, amount, memo, name } = body;

    if (!recipient || !toChain || !toToken || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = nanoid(8);

    const { error } = await supabase.from('payment_links').insert({
      id,
      recipient: recipient.trim(),
      to_chain: toChain,
      to_token: toToken,
      amount: amount.trim(),
      memo: memo?.trim() || null,
      requester_name: name?.trim() || null,
    });

    if (error) {
      console.error('[pay/shorten] insert error:', error);
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
    }

    const origin = request.nextUrl.origin;
    const shortUrl = `${origin}/pay/${id}`;

    return NextResponse.json({ id, url: shortUrl });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
