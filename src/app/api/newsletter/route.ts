import { NextResponse } from 'next/server';

import { createPublicClient } from '@/lib/supabase/public';
import { newsletterSchema } from '@/lib/validation';

/** Newsletter opt-in. Anyone may insert; only staff may read the list. */
export async function POST(request: Request) {
  const parsed = newsletterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'invalid_request' },
      { status: 400 },
    );
  }

  const supabase = createPublicClient();
  const { error } = await supabase.from('newsletter_subscribers').insert({
    email: parsed.data.email,
    source: parsed.data.source ?? 'footer',
  });

  // Already subscribed: report success rather than leaking who is on the list.
  if (error && error.code !== '23505') {
    console.error('[api/newsletter]', error);
    return NextResponse.json({ error: 'subscription_failed' }, { status: 500 });
  }

  return NextResponse.json({ subscribed: true });
}
