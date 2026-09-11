import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { wishlistEntrySchema } from '@/lib/validation';

/**
 * Server-side wishlist for signed-in customers.
 *
 * Guests are handled entirely in localStorage by the client store, so an
 * anonymous call here is a no-op rather than an error: the UI stays identical
 * whether or not someone has an account.
 */

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function POST(request: Request) {
  const parsed = wishlistEntrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ stored: 'local' });

  const { data: wishlist } = await supabase
    .from('wishlists')
    .upsert({ profile_id: user.id }, { onConflict: 'profile_id' })
    .select('id')
    .single();

  if (!wishlist) {
    return NextResponse.json({ error: 'wishlist_unavailable' }, { status: 500 });
  }

  const { error } = await supabase.from('wishlist_items').insert({
    wishlist_id: wishlist.id,
    product_id: parsed.data.product_id,
    variant_id: parsed.data.variant_id ?? null,
  });

  // 23505 = unique violation: the piece is already saved, which is success.
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stored: 'server' });
}

export async function DELETE(request: Request) {
  const parsed = wishlistEntrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ stored: 'local' });

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (wishlist) {
    await supabase
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', parsed.data.product_id);
  }

  return NextResponse.json({ stored: 'server' });
}
