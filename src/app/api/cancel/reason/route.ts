import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const MOCK_USER_ID = process.env.MOCK_USER_ID!;

const sanitize = (s: string) => {
  if (typeof s !== 'string') return '';
  // normalize, collapse whitespace, strip angle brackets, trim, cap length
  const cleaned = s
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .trim();
  return cleaned.slice(0, 500);
};

export async function POST(req: NextRequest) {
  // Enforce JSON requests
  if (req.headers.get('content-type') !== 'application/json') {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
  }

  try {
    const { cancellationId, reason } = await req.json();

    if (!cancellationId || typeof reason !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const clean = sanitize(reason);

    const { error } = await supabaseAdmin
      .from('cancellations')
      .update({ reason: clean })
      .eq('id', cancellationId)
      .eq('user_id', MOCK_USER_ID)
      .is('accepted_downsell', null);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status: 500 });
  }
}
