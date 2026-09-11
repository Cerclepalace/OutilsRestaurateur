import { describe, expect, it } from 'vitest';

import { cn, slugify } from '@/lib/utils';

describe('slugify', () => {
  it('strips accents and punctuation', () => {
    expect(slugify('Robe à nouer — Jeanne')).toBe('robe-a-nouer-jeanne');
    expect(slugify("L'Héritage Bleu")).toBe('l-heritage-bleu');
    expect(slugify('Équinoxe d’Automne')).toBe('equinoxe-d-automne');
  });

  it('never leaves leading or trailing separators', () => {
    expect(slugify('  Gilet  ')).toBe('gilet');
    expect(slugify('***')).toBe('');
  });
});

describe('cn', () => {
  it('lets a later Tailwind utility win over an earlier one', () => {
    expect(cn('px-4', 'px-8')).toBe('px-8');
  });

  it('drops falsy values', () => {
    expect(cn('border', false && 'hidden', undefined, 'p-2')).toBe('border p-2');
  });
});
