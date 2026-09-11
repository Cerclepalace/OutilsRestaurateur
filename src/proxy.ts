import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { clientEnv } from '@/lib/env';

/**
 * Runs before every page request (Next 16 renamed `middleware` to `proxy`).
 *
 * Two jobs:
 *   1. refresh the Supabase session cookie, so a server component never sees a
 *      stale token;
 *   2. bounce anonymous visitors away from /account and /admin before any of
 *      their data is fetched.
 *
 * Authorisation itself is enforced by Row Level Security. This is a redirect
 * for the shopper's benefit, not the security boundary.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() revalidates the token with Supabase; getSession() would trust the
  // cookie as sent, which is exactly what we must not do here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected =
    (pathname.startsWith('/account') && !pathname.startsWith('/account/login') &&
      !pathname.startsWith('/account/register') &&
      !pathname.startsWith('/account/forgot-password') &&
      !pathname.startsWith('/account/reset-password')) ||
    pathname.startsWith('/admin');

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/account/login';
    redirectUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  // Everything except static assets and the image optimiser.
  matcher: ['/((?!_next/static|_next/image|media|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
