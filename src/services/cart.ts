import 'server-only';

import { createPublicClient } from '@/lib/supabase/public';
import type { CartItemInput, PricedCart } from '@/types/cart';

/**
 * Cart pricing.
 *
 * The browser stores intent — variant ids and quantities — and nothing else.
 * Every total shown to the shopper comes back from `price_cart`, so a tampered
 * localStorage can only ever buy real products at real prices.
 */
export async function priceCart(
  items: CartItemInput[],
  options: {
    countryCode?: string;
    discountCode?: string | null;
    shippingMethodCode?: string | null;
  } = {},
): Promise<PricedCart> {
  const supabase = createPublicClient();

  const { data, error } = await supabase.rpc('price_cart', {
    p_items: items as never,
    p_country_code: options.countryCode ?? 'FR',
    p_discount_code: options.discountCode ?? undefined,
    p_shipping_method_code: options.shippingMethodCode ?? undefined,
  });

  if (error) {
    throw new Error(`price_cart failed: ${error.message}`);
  }

  return data as unknown as PricedCart;
}

export const EMPTY_CART: PricedCart = {
  lines: [],
  item_count: 0,
  subtotal_cents: 0,
  discount_cents: 0,
  discount: null,
  shipping_cents: 0,
  shipping_method: null,
  total_cents: 0,
  currency: 'EUR',
};
