/**
 * Domain types for the storefront.
 *
 * These mirror the shape returned by the database functions (`catalog_search`,
 * `price_cart`) rather than raw table rows, because that is what the UI renders.
 */
import type { Database } from './database';

export type Audience = Database['public']['Enums']['audience'];
export type ProductStatus = Database['public']['Enums']['product_status'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type PageSectionKind = Database['public']['Enums']['page_section_kind'];

export type ProductImage = { url: string; alt: string | null };
export type ProductColor = { name: string; hex: string | null };

/** A product as it appears in a grid. */
export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  model_name: string | null;
  subtitle: string | null;
  audience: Audience;
  is_new: boolean;
  is_one_of_a_kind: boolean;
  price_cents: number;
  compare_at_price_cents: number | null;
  currency: string;
  images: ProductImage[];
  colors: ProductColor[];
  sizes: string[];
  in_stock: boolean;
}

export interface Variant {
  id: string;
  sku: string;
  size: string | null;
  color_name: string | null;
  color_hex: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  available: number;
  in_stock: boolean;
}

/** Everything the product page needs, in one object. */
export interface ProductDetail extends Omit<ProductCard, 'sizes' | 'colors'> {
  description: string | null;
  composition: string | null;
  care_guide: string | null;
  manufacturing: string | null;
  origin_country: string | null;
  size_guide: SizeGuide | null;
  seo_title: string | null;
  seo_description: string | null;
  category: { slug: string; name: string } | null;
  collections: { slug: string; title: string }[];
  variants: Variant[];
  videos: { url: string; poster_url: string | null }[];
}

export interface SizeGuide {
  unit?: string;
  columns: string[];
  rows: { label: string; values: (string | number)[] }[];
  note?: string;
}

export interface FacetValue {
  value: string;
  count: number;
  hex?: string | null;
}

export interface CatalogFacets {
  sizes: FacetValue[];
  colors: FacetValue[];
  price: { min_cents: number; max_cents: number };
}

export interface CatalogResult {
  items: ProductCard[];
  total: number;
  page: number;
  per_page: number;
  page_count: number;
  facets: CatalogFacets;
}

export interface CatalogFilters {
  q?: string;
  category?: string;
  collection?: string;
  audience?: Audience;
  sizes?: string[];
  colors?: string[];
  min_price_cents?: number;
  max_price_cents?: number;
  in_stock?: boolean;
  on_sale?: boolean;
  is_new?: boolean;
  one_of_a_kind?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
}

export type Category = Database['public']['Tables']['categories']['Row'];
export type Collection = Database['public']['Tables']['collections']['Row'];
export type ShippingMethod = Database['public']['Tables']['shipping_methods']['Row'];
export type Store = Database['public']['Tables']['stores']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Address = Database['public']['Tables']['addresses']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
