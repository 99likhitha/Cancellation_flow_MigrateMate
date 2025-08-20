import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

const MOCK_USER_ID = process.env.MOCK_USER_ID!;

export async function POST() {
  try {
    // Reuse in‑progress cancellation if present
    const { data: existing, error: selErr } = await supabaseAdmin
      .from('cancellations')
      .select('id, downsell_variant')
      .eq('user_id', MOCK_USER_ID)
      .is('accepted_downsell', null)
      .maybeSingle();
    if (selErr) throw selErr;

    if (existing) {
      // Also fetch the price for the UI
      const { data: subPrice } = await supabaseAdmin
        .from('subscriptions')
        .select('monthly_price')
        .eq('user_id', MOCK_USER_ID)
        .maybeSingle();

      return NextResponse.json({
        variant: existing.downsell_variant,
        cancellationId: existing.id,
        monthly_price: subPrice?.monthly_price ?? null,
      });
    }

    // Fetch this user’s subscription (id + price)
    const { data: sub, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .select('id, monthly_price')
      .eq('user_id', MOCK_USER_ID)
      .maybeSingle();
    if (subErr) throw subErr;
    if (!sub) return NextResponse.json({ error: 'No subscription' }, { status: 400 });

    // Secure 50/50 assignment
    const variant: 'A' | 'B' = crypto.randomInt(0, 2) === 0 ? 'A' : 'B';

    // Persist in‑progress row (accepted_downsell stays NULL)
    const { data: created, error: insErr } = await supabaseAdmin
      .from('cancellations')
      .insert({
        user_id: MOCK_USER_ID,
        subscription_id: sub.id,
        downsell_variant: variant,
      })
      .select('id, downsell_variant')
      .single();
    if (insErr) throw insErr;

    return NextResponse.json({
      variant: created.downsell_variant,
      cancellationId: created.id,
      monthly_price: sub.monthly_price, // << important
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 });
  }
}
