import { NextResponse } from 'next/server';

import { priceCart, EMPTY_CART } from '@/services/cart';
import { priceCartSchema } from '@/lib/validation';

/**
 * Prices a basket. The only endpoint the cart UI trusts for money.
 *
 * Deliberately stateless: the browser sends variant ids and quantities, the
 * database answers with live prices, availability and totals.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = priceCartSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const items = parsed.data.items.filter((item) => item.quantity > 0);
  if (items.length === 0) {
    return NextResponse.json(EMPTY_CART);
  }

  try {
    const cart = await priceCart(items, {
      countryCode: parsed.data.countryCode,
      discountCode: parsed.data.discountCode,
      shippingMethodCode: parsed.data.shippingMethodCode,
    });
    return NextResponse.json(cart);
  } catch (error) {
    console.error('[api/cart/price]', error);
    return NextResponse.json({ error: 'pricing_failed' }, { status: 500 });
  }
}
