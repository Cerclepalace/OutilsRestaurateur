import 'server-only';

import Stripe from 'stripe';
import { serverEnv, isStripeConfigured } from '@/lib/env';

/**
 * Stripe client, created lazily.
 *
 * The rest of the app can import this module safely even when Stripe is not
 * configured: nothing happens until `getStripe()` is actually called, and the
 * checkout route checks `isStripeConfigured` before it gets that far.
 */
let stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!isStripeConfigured) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY and the publishable key.');
  }
  stripe ??= new Stripe(serverEnv.stripeSecretKey, { typescript: true });
  return stripe;
}

export { isStripeConfigured };
