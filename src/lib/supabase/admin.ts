import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { clientEnv, serverEnv } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Service-role client. Bypasses Row Level Security.
 *
 * Two callers, both route handlers acting for a shopper who has no session of
 * their own:
 *
 *   - the Stripe webhook, which settles an order with no user attached at all;
 *   - the checkout route, which stamps the Stripe session id onto the order it
 *     just created, so the webhook can find it even if Stripe trims metadata.
 *
 * Both write to a single, already-identified order. Never import this into a
 * component, and never widen it to a read that a user-scoped client could do.
 */
export function createAdminClient() {
  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.supabaseServiceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
