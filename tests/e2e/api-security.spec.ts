import { test, expect } from '@playwright/test';

/**
 * API surface: what a crafted request can and cannot do.
 *
 * These drive the HTTP endpoints directly, with no browser, because that is how
 * a tampered request actually arrives. The database-level equivalents live in
 * `tests/db/security.sql`; this suite proves the route handlers do not undo
 * those guarantees on the way through.
 */

/**
 * A real, sellable variant id, read off the product page exactly as an attacker
 * would: the buy panel serialises its variants into the page payload.
 */
async function sellableVariant(request: import('@playwright/test').APIRequestContext) {
  const page = await request.get('/product/veste-en-jean-gauthier');
  expect(page.ok()).toBeTruthy();

  const html = await page.text();
  // `\"id\":\"<uuid>\",\"sku\":\"…\"` — a variant, not the product itself.
  const match = /\\"id\\":\\"([0-9a-f-]{36})\\",\\"sku\\"/.exec(html);
  expect(match, 'no variant id found in the product page payload').toBeTruthy();

  return match![1];
}

test.describe('cart pricing endpoint', () => {
  test('ignores a price sent by the client', async ({ request }) => {
    const variant = await sellableVariant(request);

    const honest = await request.post('/api/cart/price', {
      data: { items: [{ variant_id: variant, quantity: 1 }] },
    });
    const tampered = await request.post('/api/cart/price', {
      data: {
        items: [
          {
            variant_id: variant,
            quantity: 1,
            unit_price_cents: 1,
            line_total_cents: 1,
            price: 0.01,
          },
        ],
        subtotal_cents: 1,
        total_cents: 1,
        shipping_cents: 0,
        discount_cents: 99999,
      },
    });

    expect(honest.ok()).toBeTruthy();
    expect(tampered.ok()).toBeTruthy();

    const a = await honest.json();
    const b = await tampered.json();

    expect(b.subtotal_cents).toBe(a.subtotal_cents);
    expect(b.total_cents).toBe(a.total_cents);
    expect(b.discount_cents).toBe(0);
    expect(b.lines[0].unit_price_cents).toBe(a.lines[0].unit_price_cents);
    expect(b.lines[0].unit_price_cents).toBeGreaterThan(100);
  });

  test('caps an inflated quantity at real availability', async ({ request }) => {
    const variant = await sellableVariant(request);

    const response = await request.post('/api/cart/price', {
      data: { items: [{ variant_id: variant, quantity: 20 }] },
    });
    expect(response.ok()).toBeTruthy();

    const cart = await response.json();
    const line = cart.lines[0];

    expect(line.quantity).toBeLessThanOrEqual(line.available);
    if (line.quantity < 20) expect(line.adjusted).toBe(true);
    expect(cart.subtotal_cents).toBe(line.quantity * line.unit_price_cents);
  });

  test('drops a variant that does not exist, and charges nothing', async ({ request }) => {
    const response = await request.post('/api/cart/price', {
      data: { items: [{ variant_id: '00000000-0000-4000-8000-000000000000', quantity: 1 }] },
    });
    expect(response.ok()).toBeTruthy();

    const cart = await response.json();
    expect(cart.lines).toHaveLength(0);
    // Regression: an empty basket once still carried a shipping charge.
    expect(cart.total_cents).toBe(0);
    expect(cart.shipping_cents).toBe(0);
  });

  test('refuses a malformed payload rather than guessing', async ({ request }) => {
    for (const data of [
      { items: [{ variant_id: 'not-a-uuid', quantity: 1 }] },
      { items: [{ variant_id: '00000000-0000-4000-8000-000000000000', quantity: -5 }] },
      { items: [{ variant_id: '00000000-0000-4000-8000-000000000000', quantity: 999 }] },
      { items: 'nonsense' },
      {},
    ]) {
      const response = await request.post('/api/cart/price', { data });
      expect(response.status(), JSON.stringify(data)).toBe(400);
    }

    // A basket larger than the cap cannot be used to fan out work.
    const many = Array.from({ length: 51 }, () => ({
      variant_id: '00000000-0000-4000-8000-000000000000',
      quantity: 1,
    }));
    expect((await request.post('/api/cart/price', { data: { items: many } })).status()).toBe(400);
  });

  test('rejects a body that is not JSON', async ({ request }) => {
    const response = await request.post('/api/cart/price', {
      headers: { 'Content-Type': 'application/json' },
      data: 'this is not json',
    });
    expect(response.status()).toBe(400);
  });
});

test.describe('checkout endpoint', () => {
  test('validates the payload before touching stock', async ({ request }) => {
    const variant = await sellableVariant(request);
    const address = {
      first_name: 'Test',
      last_name: 'Client',
      line1: '1 rue de Test',
      postal_code: '75011',
      city: 'Paris',
      country_code: 'FR',
    };

    // An invalid e-mail must be refused at the edge, not by the database.
    const badEmail = await request.post('/api/checkout', {
      data: {
        items: [{ variant_id: variant, quantity: 1 }],
        email: 'not-an-email',
        shippingAddress: address,
      },
    });
    expect([400, 503]).toContain(badEmail.status());

    // An empty basket is never a valid order.
    const empty = await request.post('/api/checkout', {
      data: { items: [], email: 'test@example.com', shippingAddress: address },
    });
    expect([400, 503]).toContain(empty.status());
  });

  test('refuses cleanly when payment is not configured, and never fakes it', async ({ request }) => {
    const variant = await sellableVariant(request);

    const response = await request.post('/api/checkout', {
      data: {
        items: [{ variant_id: variant, quantity: 1 }],
        email: 'test@example.com',
        shippingAddress: {
          first_name: 'Test',
          last_name: 'Client',
          line1: '1 rue de Test',
          postal_code: '75011',
          city: 'Paris',
          country_code: 'FR',
        },
      },
    });

    const body = await response.json();

    if (response.status() === 503) {
      // No Stripe keys: an honest refusal, and no order was created.
      expect(body.error).toBe('payment_not_configured');
      expect(body).not.toHaveProperty('checkout_url');
      expect(body).not.toHaveProperty('order_number');
    } else {
      // Stripe configured: a real session, never a fabricated confirmation.
      expect(response.ok()).toBeTruthy();
      expect(body.checkout_url).toMatch(/^https:\/\//);
    }
  });
});

test.describe('account endpoints', () => {
  test('merging guest lists requires a session', async ({ request }) => {
    const response = await request.post('/api/account/merge', {
      data: { cart: [], wishlist: [] },
    });
    expect(response.status()).toBe(401);
  });

  test('an anonymous wishlist stays in the browser', async ({ request }) => {
    const response = await request.post('/api/wishlist', {
      data: { product_id: '00000000-0000-4000-8000-000000000000' },
    });
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).stored).toBe('local');
  });
});

test.describe('public endpoints', () => {
  test('the newsletter refuses an invalid address', async ({ request }) => {
    expect((await request.post('/api/newsletter', { data: { email: 'nope' } })).status()).toBe(400);
  });

  test('search needs two characters before it answers', async ({ request }) => {
    const short = await request.get('/api/search?q=a');
    expect(short.ok()).toBeTruthy();
    expect((await short.json()).products).toHaveLength(0);

    const real = await request.get('/api/search?q=gauthier');
    expect(real.ok()).toBeTruthy();
    expect((await real.json()).products.length).toBeGreaterThan(0);
  });

  test('the Stripe webhook refuses an unsigned call', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', {
      data: { type: 'checkout.session.completed', data: { object: { id: 'cs_fake' } } },
    });
    // 400 when Stripe is configured (bad signature), 503 when it is not.
    expect([400, 503]).toContain(response.status());
  });
});
