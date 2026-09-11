import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { serverEnv } from '@/lib/env';

/**
 * Stripe webhook — the only place an order becomes paid.
 *
 * Runs with the service role because there is no user session on this request.
 * The signature is verified before anything is read, and `mark_order_paid` is
 * idempotent, so Stripe's retries settle the order exactly once.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: 'payment_not_configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  // The raw body is required: any parsing would invalidate the signature.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, serverEnv.stripeWebhookSecret);
  } catch (error) {
    console.error('[stripe/webhook] signature verification failed', error);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = orderIdFrom(session);
        if (!orderId) break;

        // `payment_status` guards against completing an unpaid session.
        if (session.payment_status !== 'paid') break;

        const { error } = await supabase.rpc('mark_order_paid', {
          p_order_id: orderId,
          p_payment_reference:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent?.id ?? session.id),
          p_amount_cents: session.amount_total ?? undefined,
          p_payload: event as never,
        });
        if (error) throw error;
        break;
      }

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        const orderId = orderIdFrom(session);
        if (!orderId) break;

        // Give the held stock back to the shop.
        const { error } = await supabase.rpc('release_order', {
          p_order_id: orderId,
          p_reason: event.type,
        });
        if (error) throw error;
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (error) {
    console.error(`[stripe/webhook] ${event.type} failed`, error);
    // A non-2xx makes Stripe retry, which is what we want for a transient fault.
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function orderIdFrom(session: Stripe.Checkout.Session): string | null {
  return session.metadata?.order_id ?? session.client_reference_id ?? null;
}
