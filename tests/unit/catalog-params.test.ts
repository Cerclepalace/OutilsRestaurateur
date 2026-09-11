import { describe, expect, it } from 'vitest';

import {
  parseCatalogParams,
  withParam,
  toggleParam,
  activeFilterCount,
} from '@/lib/catalog-params';

/**
 * The URL is the source of truth for a listing's state, so these conversions
 * are load-bearing: a bug here loses a shopper's filters on every navigation.
 */
describe('parseCatalogParams', () => {
  it('reads repeated and comma-separated values the same way', () => {
    expect(parseCatalogParams({ size: ['M', 'L'] }).sizes).toEqual(['M', 'L']);
    expect(parseCatalogParams({ size: 'M,L' }).sizes).toEqual(['M', 'L']);
  });

  it('converts euro prices to integer cents', () => {
    const filters = parseCatalogParams({ min: '50', max: '219.5' });
    expect(filters.min_price_cents).toBe(5000);
    expect(filters.max_price_cents).toBe(21950);
  });

  it('lets a URL parameter narrow a page-level category', () => {
    expect(parseCatalogParams({ category: 'robes' }, { category: 'femme' }).category).toBe('robes');
    expect(parseCatalogParams({}, { category: 'femme' }).category).toBe('femme');
  });

  it('falls back to page 1 for nonsense', () => {
    expect(parseCatalogParams({ page: '-3' }).page).toBe(1);
    expect(parseCatalogParams({ page: 'abc' }).page).toBe(1);
    expect(parseCatalogParams({ page: '4' }).page).toBe(4);
  });

  it('ignores an empty query string', () => {
    expect(parseCatalogParams({ q: '   ' }).q).toBeUndefined();
  });
});

describe('withParam', () => {
  it('returns to page 1 when any other filter changes', () => {
    const current = new URLSearchParams('page=4&sort=featured');
    expect(withParam(current, 'sort', 'price-asc')).toBe('?sort=price-asc');
  });

  it('keeps the page when paging', () => {
    const current = new URLSearchParams('sort=price-asc&page=2');
    expect(withParam(current, 'page', '3')).toBe('?sort=price-asc&page=3');
  });

  it('drops the parameter entirely when cleared', () => {
    const current = new URLSearchParams('stock=1');
    expect(withParam(current, 'stock', null)).toBe('');
  });
});

describe('toggleParam', () => {
  it('adds a value that is not selected', () => {
    expect(toggleParam(new URLSearchParams(), 'size', 'M')).toBe('?size=M');
  });

  it('removes a value that is already selected', () => {
    expect(toggleParam(new URLSearchParams('size=M&size=L'), 'size', 'M')).toBe('?size=L');
  });

  it('clears the parameter when the last value is removed', () => {
    expect(toggleParam(new URLSearchParams('size=M'), 'size', 'M')).toBe('');
  });
});

describe('activeFilterCount', () => {
  it('counts each applied value, treating a price range as one', () => {
    expect(activeFilterCount(new URLSearchParams('size=M&size=L&color=Bleu&min=50&max=200'))).toBe(4);
  });

  it('ignores sort and page', () => {
    expect(activeFilterCount(new URLSearchParams('sort=price-asc&page=3'))).toBe(0);
  });
});
