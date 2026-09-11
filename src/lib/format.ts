/**
 * Money and date formatting.
 *
 * Prices live in the database as integer cents. They are only ever turned into
 * a human string here, never into a float for arithmetic.
 */

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, fractionDigits: 0 | 2) {
  const key = `${currency}:${fractionDigits}`;
  let existing = currencyFormatters.get(key);
  if (!existing) {
    existing = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    currencyFormatters.set(key, existing);
  }
  return existing;
}

/**
 * 21900 -> "219 €" ; 12950 -> "129,50 €"
 *
 * Whole euros drop the centimes, which is how fashion prices are written; a
 * price with centimes always shows both digits, because "129,5 €" reads as a
 * typo on a price tag.
 */
export function formatPrice(cents: number, currency = 'EUR') {
  const hasCentimes = cents % 100 !== 0;
  return formatter(currency, hasCentimes ? 2 : 0).format(cents / 100);
}

export function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Percentage saved, rounded down, for a "-30 %" badge. */
export function discountPercent(priceCents: number, compareAtCents: number | null | undefined) {
  if (!compareAtCents || compareAtCents <= priceCents) return null;
  return Math.floor(((compareAtCents - priceCents) / compareAtCents) * 100);
}
