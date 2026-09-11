import { NextResponse } from 'next/server';

import { createOrder, OrderError } from '@/services/orders';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkoutSchema } from '@/lib/validation';
import { clientEnv } from '@/lib/env';
import { formatPrice } from '@/lib/format';

/**
 * Checkout.
 *
 * Order of operations matters: the order is created *first*, which re-prices
 * the basket and reserves the stock inside one transaction. Only then is a
 * Stripe session opened, for the amount the database computed. A shopper can
 * never pay a price the browser made up, and two shoppers cannot both buy the
 * last piece.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured) {
    // Honest failure rather than a fake confirmation.
    return NextResponse.json(
      {
        error: 'payment_not_configured',
        message:
          "Le paiement n'est pas encore activé sur cette installation. Renseignez les clés Stripe dans .env.local.",
      },
      { status: 503 },
    );
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_request', message: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  const input = parsed.data;

  let order: Awaited<ReturnType<typeof createOrder>>;
  try {
    order = await createOrder({
      items: input.items,
      email: input.email,
      shippingAddress: input.shippingAddress,
      billingAddress: input.billingAddress ?? null,
      shippingMethodCode: input.shippingMethodCode ?? null,
      discountCode: input.discountCode ?? null,
      phone: input.phone ?? null,
      customerNote: input.customerNote ?? null,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json(
        { error: error.reason, message: error.customerMessage, sku: error.sku },
        { status: 409 },
      );
    }
    console.error('[api/checkout] create_order', error);
    return NextResponse.json({ error: 'order_failed' }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const origin = clientEnv.NEXT_PUBLIC_SITE_URL;

    // One line item for the whole order: the breakdown (discount, shipping) is
    // already settled server-side, and re-deriving it here risks the two
    // disagreeing by a cent.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: order.email,
      client_reference_id: order.order_id,
      metadata: { order_id: order.order_id, order_number: order.order_number },
      payment_intent_data: {
        metadata: { order_id: order.order_id, order_number: order.order_number },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: order.currency.toLowerCase(),
            unit_amount: order.total_cents,
            product_data: {
              name: `Commande ${order.order_number} — BOBO PARIS`,
              description: describeOrder(order),
            },
          },
        },
      ],
      success_url: `${origin}/order/success?order=${order.order_number}`,
      cancel_url: `${origin}/cart?cancelled=${order.order_number}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    // Link the session so the webhook can find the order even if Stripe's
    // metadata is trimmed.
    await createAdminClient()
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.order_id);

    return NextResponse.json({
      order_number: order.order_number,
      checkout_url: session.url,
    });
  } catch (error) {
    console.error('[api/checkout] stripe', error);
    // The order exists with stock held; the webhook's expiry path or an admin
    // release will hand it back. Tell the shopper plainly.
    return NextResponse.json(
      {
        error: 'payment_session_failed',
        message: "La session de paiement n'a pas pu être ouverte. Réessayez dans un instant.",
        order_number: order.order_number,
      },
      { status: 502 },
    );
  }
}

/**
 * The line Stripe shows on its own checkout page. Purely descriptive — the sum
 * actually charged is `unit_amount`, which stays in integer cents — but it has
 * to read like the rest of the site, so it goes through the same formatter
 * rather than rolling its own division.
 */
function describeOrder(order: { subtotal_cents: number; shipping_cents: number; discount_cents: number }) {
  const parts = [`Sous-total ${formatPrice(order.subtotal_cents)}`];
  if (order.discount_cents > 0) parts.push(`Remise -${formatPrice(order.discount_cents)}`);
  parts.push(
    order.shipping_cents > 0
      ? `Livraison ${formatPrice(order.shipping_cents)}`
      : 'Livraison offerte',
  );
  return parts.join(' · ');
}
