import { describe, expect, it } from 'vitest';

import { addressSchema, checkoutSchema, priceCartSchema } from '@/lib/validation';

/** Every request body is validated before it reaches the database. */
describe('addressSchema', () => {
  it('accepts a complete French address', () => {
    const result = addressSchema.safeParse({
      first_name: 'Camille',
      last_name: 'Durand',
      line1: '12 rue de Charonne',
      postal_code: '75011',
      city: 'Paris',
      country_code: 'fr',
    });
    expect(result.success).toBe(true);
    // Country codes are normalised so the shipping lookup can match on them.
    if (result.success) expect(result.data.country_code).toBe('FR');
  });

  it('rejects a missing street', () => {
    const result = addressSchema.safeParse({
      first_name: 'Camille',
      last_name: 'Durand',
      line1: '',
      postal_code: '75011',
      city: 'Paris',
      country_code: 'FR',
    });
    expect(result.success).toBe(false);
  });
});

describe('checkoutSchema', () => {
  const address = {
    first_name: 'Camille',
    last_name: 'Durand',
    line1: '12 rue de Charonne',
    postal_code: '75011',
    city: 'Paris',
    country_code: 'FR',
  };

  it('requires at least one line', () => {
    const result = checkoutSchema.safeParse({
      items: [],
      email: 'camille@example.com',
      shippingAddress: address,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a zero quantity', () => {
    const result = checkoutSchema.safeParse({
      items: [{ variant_id: '00000000-0000-4000-8000-000000000000', quantity: 0 }],
      email: 'camille@example.com',
      shippingAddress: address,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid basket', () => {
    const result = checkoutSchema.safeParse({
      items: [{ variant_id: '00000000-0000-4000-8000-000000000000', quantity: 2 }],
      email: 'Camille@Example.com',
      shippingAddress: address,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('camille@example.com');
  });
});

describe('priceCartSchema', () => {
  it('caps the basket size so a crafted payload cannot fan out', () => {
    const items = Array.from({ length: 51 }, () => ({
      variant_id: '00000000-0000-4000-8000-000000000000',
      quantity: 1,
    }));
    expect(priceCartSchema.safeParse({ items }).success).toBe(false);
  });

  it('rejects a non-uuid variant id', () => {
    expect(
      priceCartSchema.safeParse({ items: [{ variant_id: 'not-a-uuid', quantity: 1 }] }).success,
    ).toBe(false);
  });
});
