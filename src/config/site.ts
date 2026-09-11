/**
 * Storefront constants that are not merchandising decisions.
 *
 * Anything a merchant would want to change without a deploy — shipping
 * thresholds, menu labels, homepage sections — lives in the database instead.
 */
export const siteConfig = {
  name: 'BOBO PARIS',
  legalName: 'Bobo Paris',
  tagline: 'Créer. Porter. Recommencer.',
  description:
    "Marque écoresponsable fondée à Paris en 2021. Pièces uniques et collections capsules en éditions limitées, confectionnées à partir de stocks dormants de maisons de luxe et de vêtements de seconde main.",
  locale: 'fr_FR',
  currency: 'EUR',
  social: {
    instagram: 'https://www.instagram.com/boboparis_/',
  },
} as const;

/** Sizes the brand actually uses, in display order. */
export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'TU'] as const;

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Sélection' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'name-asc', label: 'Alphabétique' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

/** Countries served, for the checkout address form. */
export const COUNTRIES = [
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'CH', name: 'Suisse' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'US', name: 'États-Unis' },
  { code: 'CA', name: 'Canada' },
  { code: 'MA', name: 'Maroc' },
] as const;
