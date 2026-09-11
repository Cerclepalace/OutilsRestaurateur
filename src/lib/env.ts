/**
 * Environment access, validated once at the edge of the app.
 *
 * Client-side variables are read through `clientEnv` and are safe to ship to the
 * browser. Server-only secrets live in `serverEnv` and are read lazily, so a
 * missing Stripe key never breaks a page that has nothing to do with payment.
 */
import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

// Next.js inlines process.env.NEXT_PUBLIC_* at build time only when referenced
// statically, so these must be spelled out rather than looped over.
const parsedClient = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
});

if (!parsedClient.success) {
  const missing = parsedClient.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(
    `Missing or invalid public environment variables: ${missing}. ` +
      'Copy .env.example to .env.local and fill it in.',
  );
}

export const clientEnv = parsedClient.data;

/** Present only when the Stripe keys are configured. Checkout reads this. */
export const isStripeConfigured = Boolean(
  process.env.STRIPE_SECRET_KEY && clientEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

/** Server-only secrets. Throws if read without being configured. */
export const serverEnv = {
  get supabaseServiceRoleKey(): string {
    const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!value) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY is not set. It is required by the Stripe webhook and the seed script.',
      );
    }
    return value;
  },
  get stripeSecretKey(): string {
    const value = process.env.STRIPE_SECRET_KEY;
    if (!value) throw new Error('STRIPE_SECRET_KEY is not set.');
    return value;
  },
  get stripeWebhookSecret(): string {
    const value = process.env.STRIPE_WEBHOOK_SECRET;
    if (!value) throw new Error('STRIPE_WEBHOOK_SECRET is not set.');
    return value;
  },
};
