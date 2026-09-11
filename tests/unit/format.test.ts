import { describe, expect, it } from 'vitest';

import { formatPrice, discountPercent } from '@/lib/format';

/** Prices are integer cents everywhere; only this layer turns them into text. */
describe('formatPrice', () => {
  it('renders a whole-euro price without decimals', () => {
    expect(formatPrice(21900).replace(/ | /g, ' ')).toBe('219 €');
  });

  it('keeps centimes when there are any', () => {
    expect(formatPrice(12950).replace(/ | /g, ' ')).toBe('129,50 €');
  });

  it('renders zero rather than an empty string', () => {
    expect(formatPrice(0).replace(/ | /g, ' ')).toBe('0 €');
  });
});

describe('discountPercent', () => {
  it('computes the saving against the struck-through price', () => {
    expect(discountPercent(19900, 21900)).toBe(9);
    expect(discountPercent(7500, 13500)).toBe(44);
  });

  it('returns null when there is no genuine reduction', () => {
    expect(discountPercent(21900, null)).toBeNull();
    expect(discountPercent(21900, 21900)).toBeNull();
    expect(discountPercent(21900, 19900)).toBeNull();
  });
});
