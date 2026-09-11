import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Address, Profile } from '@/types/catalog';

/** The signed-in customer, or null. Every call is scoped by RLS. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return data ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === 'admin' || profile?.role === 'staff';
}

export async function getAddresses(): Promise<Address[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('addresses')
    .select('*')
    .order('is_default_shipping', { ascending: false })
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getWishlistProductIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('wishlist_items').select('product_id');
  return [...new Set((data ?? []).map((row) => row.product_id))];
}
