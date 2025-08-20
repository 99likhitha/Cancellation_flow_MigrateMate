import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const MOCK_USER_ID = process.env.MOCK_USER_ID!;

export async function POST(req: NextRequest) {
  // Enforce JSON requests
  if (req.headers.get('content-type') !== 'application/json') {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
  }

  try {
    const { cancellationId, acceptedDownsell } = await req.json();

    if (!cancellationId || typeof acceptedDownsell !== 'boolean') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Finalize only if still in progress
    const { data: cxl, error: upErr } = await supabaseAdmin
      .from('cancellations')
      .update({ accepted_downsell: acceptedDownsell })
      .eq('id', cancellationId)
      .eq('user_id', MOCK_USER_ID)
      .is('accepted_downsell', null)
      .select('subscription_id')
      .maybeSingle();
    if (upErr) throw upErr;

    // If declined, mark subscription pending_cancellation
    if (cxl?.subscription_id && !acceptedDownsell) {
      const { error: subErr } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'pending_cancellation' })
        .eq('id', cxl.subscription_id)
        .eq('user_id', MOCK_USER_ID);
      if (subErr) throw subErr;
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 });
  }
}
