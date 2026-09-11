import { createClient } from '@supabase/supabase-js';
import { clientEnv } from '@/lib/env';
import type { Database } from '@/types/database';

/**
 * Cookie-free Supabase client for public catalogue and content reads.
 *
 * Because it never touches `cookies()`, pages built on it stay statically
 * renderable and cacheable — which is what keeps a listing page fast. It has
 * exactly the anonymous role's rights, so Row Level Security still applies.
 */
let publicClient: ReturnType<typeof createClient<Database>> | undefined;

export function createPublicClient() {
  publicClient ??= createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return publicClient;
}
