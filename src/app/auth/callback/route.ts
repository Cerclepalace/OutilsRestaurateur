import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * Exchanges the one-time code in a Supabase e-mail link for a session cookie.
 * Used by sign-up confirmation and magic links.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/account';

  if (!code) {
    return NextResponse.redirect(new URL('/account/login?error=missing_code', url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/account/login?error=invalid_code', url.origin));
  }

  // Only ever redirect within this site.
  const target = next.startsWith('/') ? next : '/account';
  return NextResponse.redirect(new URL(target, url.origin));
}
