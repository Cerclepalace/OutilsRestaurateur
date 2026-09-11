import type { CatalogFilters } from '@/types/catalog';

/**
 * Translation between the URL and `catalog_search` filters.
 *
 * The URL is the single source of truth for a listing's state: filters survive
 * a refresh, a back button, and a shared link. Nothing about the current view
 * lives in React state.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** `?size=M&size=L` and `?size=M,L` both mean the same thing. */
function list(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const parts = (Array.isArray(value) ? value : [value]).flatMap((entry) => entry.split(','));
  const cleaned = parts.map((part) => part.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : undefined;
}

function cents(value: string | string[] | undefined): number | undefined {
  const raw = first(value);
  if (!raw) return undefined;
  const euros = Number.parseFloat(raw);
  return Number.isFinite(euros) && euros >= 0 ? Math.round(euros * 100) : undefined;
}

export function parseCatalogParams(
  params: RawSearchParams,
  defaults: Partial<CatalogFilters> = {},
): CatalogFilters {
  const page = Number.parseInt(first(params.page) ?? '1', 10);

  return {
    ...defaults,
    q: first(params.q)?.trim() || defaults.q,
    // A page can pin a category or collection (e.g. /femme); a URL parameter
    // narrows within it. Without this, /boutique?category=robes and the
    // category links in the search overlay silently returned everything.
    category: first(params.category) || defaults.category,
    collection: first(params.collection) || defaults.collection,
    sizes: list(params.size),
    colors: list(params.color),
    min_price_cents: cents(params.min),
    max_price_cents: cents(params.max),
    in_stock: first(params.stock) === '1' ? true : undefined,
    on_sale: first(params.on_sale) === '1' ? true : defaults.on_sale,
    is_new: first(params.is_new) === '1' ? true : defaults.is_new,
    sort: first(params.sort) || defaults.sort || 'featured',
    page: Number.isFinite(page) && page > 0 ? page : 1,
    per_page: defaults.per_page ?? 24,
  };
}

/**
 * Rebuilds the query string with one value changed.
 * Changing anything but the page returns to page 1 — staying on page 4 of a
 * result set that now has two pages is the classic filter bug.
 */
export function withParam(
  current: URLSearchParams,
  key: string,
  value: string | string[] | null,
): string {
  const next = new URLSearchParams(current);

  next.delete(key);
  if (Array.isArray(value)) {
    for (const entry of value) next.append(key, entry);
  } else if (value !== null && value !== '') {
    next.set(key, value);
  }

  if (key !== 'page') next.delete('page');

  const query = next.toString();
  return query ? `?${query}` : '';
}

/** Toggles one value inside a repeated parameter (sizes, colours). */
export function toggleParam(current: URLSearchParams, key: string, value: string): string {
  const existing = current.getAll(key).flatMap((entry) => entry.split(','));
  const next = existing.includes(value)
    ? existing.filter((entry) => entry !== value)
    : [...existing, value];
  return withParam(current, key, next.length > 0 ? next : null);
}

/** Count of filters a shopper has actively applied, for the mobile badge. */
export function activeFilterCount(params: URLSearchParams): number {
  let count = 0;
  for (const key of ['size', 'color', 'stock', 'on_sale', 'is_new']) {
    count += params.getAll(key).flatMap((entry) => entry.split(',')).filter(Boolean).length;
  }
  if (params.has('min') || params.has('max')) count += 1;
  return count;
}
