import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { mergeSchema } from '@/lib/validation';

/**
 * Called once, right after sign-in: folds the guest cart and wishlist into the
 * customer's server-side records. Both merges are idempotent, so a retry after
 * a dropped connection cannot duplicate a line.
 */
export async function POST(request: Request) {
  const parsed = mergeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  const cart = parsed.data.cart.filter((item) => item.quantity > 0);

  const [cartResult, wishlistResult] = await Promise.all([
    cart.length > 0
      ? supabase.rpc('merge_cart', { p_items: cart as never })
      : Promise.resolve({ data: 0, error: null }),
    parsed.data.wishlist.length > 0
      ? supabase.rpc('merge_wishlist', { p_items: parsed.data.wishlist as never })
      : Promise.resolve({ data: 0, error: null }),
  ]);

  if (cartResult.error || wishlistResult.error) {
    console.error('[api/account/merge]', cartResult.error ?? wishlistResult.error);
    return NextResponse.json({ error: 'merge_failed' }, { status: 500 });
  }

  return NextResponse.json({
    cart: cartResult.data ?? 0,
    wishlist: wishlistResult.data ?? 0,
  });
}
