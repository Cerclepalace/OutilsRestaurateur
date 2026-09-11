import 'server-only';

import { createPublicClient } from '@/lib/supabase/public';
import type {
  CatalogFilters,
  CatalogResult,
  Category,
  Collection,
  ProductCard,
  ProductDetail,
  SizeGuide,
  Variant,
} from '@/types/catalog';

/**
 * Catalogue reads.
 *
 * Listing goes through the `catalog_search` database function, which returns
 * the page and its facet counts in one round trip. Filtering thousands of
 * variants in JavaScript would mean shipping the whole catalogue to the server
 * on every request; this keeps it in Postgres where the indexes are.
 */

export async function searchCatalog(filters: CatalogFilters): Promise<CatalogResult> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('catalog_search', {
    p_filters: filters as never,
  });

  if (error) {
    throw new Error(`catalog_search failed: ${error.message}`);
  }

  return data as unknown as CatalogResult;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('position');
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .is('deleted_at', null)
    .maybeSingle();
  return data ?? null;
}

export async function getCollections(featuredOnly = false): Promise<Collection[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from('collections')
    .select('*')
    .eq('is_published', true)
    .is('deleted_at', null)
    .order('position');

  if (featuredOnly) query = query.eq('is_featured', true);

  const { data } = await query;
  return data ?? [];
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .is('deleted_at', null)
    .maybeSingle();
  return data ?? null;
}

/** Full product page payload: product, media, variants with live availability. */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = createPublicClient();

  const { data: product } = await supabase
    .from('products')
    .select(
      `
      id, slug, name, model_name, subtitle, description, composition, care_guide,
      manufacturing, origin_country, audience, is_new, is_one_of_a_kind,
      base_price_cents, compare_at_price_cents, currency, size_guide,
      seo_title, seo_description,
      categories ( slug, name ),
      product_images ( url, alt, position, variant_id ),
      product_videos ( url, poster_url, position ),
      product_variants (
        id, sku, size, color_name, color_hex, price_cents, compare_at_price_cents,
        position, is_active,
        inventory ( quantity, reserved, track_inventory, allow_backorder )
      ),
      collection_products ( collections ( slug, title ) )
    `,
    )
    .eq('slug', slug)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();

  if (!product) return null;

  const variants: Variant[] = (product.product_variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.position - b.position)
    .map((v) => {
      const inventory = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
      const available =
        !inventory || !inventory.track_inventory || inventory.allow_backorder
          ? 9999
          : Math.max(inventory.quantity - inventory.reserved, 0);

      return {
        id: v.id,
        sku: v.sku,
        size: v.size,
        color_name: v.color_name,
        color_hex: v.color_hex,
        price_cents: v.price_cents ?? product.base_price_cents,
        compare_at_price_cents: v.compare_at_price_cents ?? product.compare_at_price_cents,
        available,
        in_stock: available > 0,
      };
    });

  const images = (product.product_images ?? [])
    .sort((a, b) => a.position - b.position)
    .map((i) => ({ url: i.url, alt: i.alt }));

  const category = Array.isArray(product.categories) ? product.categories[0] : product.categories;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    model_name: product.model_name,
    subtitle: product.subtitle,
    description: product.description,
    composition: product.composition,
    care_guide: product.care_guide,
    manufacturing: product.manufacturing,
    origin_country: product.origin_country,
    audience: product.audience,
    is_new: product.is_new,
    is_one_of_a_kind: product.is_one_of_a_kind,
    price_cents: product.base_price_cents,
    compare_at_price_cents: product.compare_at_price_cents,
    currency: product.currency,
    size_guide: (product.size_guide as SizeGuide | null) ?? null,
    seo_title: product.seo_title,
    seo_description: product.seo_description,
    category: category ? { slug: category.slug, name: category.name } : null,
    collections: (product.collection_products ?? [])
      .map((cp) => (Array.isArray(cp.collections) ? cp.collections[0] : cp.collections))
      .filter((c): c is { slug: string; title: string } => Boolean(c)),
    images,
    videos: (product.product_videos ?? [])
      .sort((a, b) => a.position - b.position)
      .map((v) => ({ url: v.url, poster_url: v.poster_url })),
    variants,
    in_stock: variants.some((v) => v.in_stock),
  };
}

/**
 * Cross-sell. Uses the editorial `product_recommendations` table when a curator
 * has filled it in, and falls back to the same category so the slot is never
 * empty on a real catalogue.
 */
export async function getRecommendations(
  productId: string,
  kind: 'similar' | 'complete_the_look',
  limit = 4,
): Promise<ProductCard[]> {
  const supabase = createPublicClient();

  const { data: curated } = await supabase
    .from('product_recommendations')
    .select('recommended_id, position')
    .eq('product_id', productId)
    .eq('kind', kind)
    .order('position')
    .limit(limit);

  const ids = (curated ?? []).map((r) => r.recommended_id);

  if (ids.length > 0) {
    const cards = await getProductCardsByIds(ids);
    if (cards.length > 0) return cards;
  }

  const { data: product } = await supabase
    .from('products')
    .select('category_id')
    .eq('id', productId)
    .maybeSingle();

  if (!product?.category_id) return [];

  const { data: category } = await supabase
    .from('categories')
    .select('slug')
    .eq('id', product.category_id)
    .maybeSingle();

  if (!category) return [];

  const result = await searchCatalog({ category: category.slug, per_page: limit + 1 });
  return result.items.filter((item) => item.id !== productId).slice(0, limit);
}

async function getProductCardsByIds(ids: string[]): Promise<ProductCard[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('products')
    .select(
      `id, slug, name, model_name, subtitle, audience, is_new, is_one_of_a_kind,
       base_price_cents, compare_at_price_cents, currency,
       product_images ( url, alt, position ),
       product_variants ( size, color_name, color_hex, is_active,
         inventory ( quantity, reserved, track_inventory, allow_backorder ) )`,
    )
    .in('id', ids)
    .eq('status', 'active')
    .is('deleted_at', null);

  if (!data) return [];

  // Preserve the curator's order rather than the database's.
  const order = new Map(ids.map((id, index) => [id, index]));

  return data
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((p) => {
      const activeVariants = (p.product_variants ?? []).filter((v) => v.is_active);
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        model_name: p.model_name,
        subtitle: p.subtitle,
        audience: p.audience,
        is_new: p.is_new,
        is_one_of_a_kind: p.is_one_of_a_kind,
        price_cents: p.base_price_cents,
        compare_at_price_cents: p.compare_at_price_cents,
        currency: p.currency,
        images: (p.product_images ?? [])
          .sort((a, b) => a.position - b.position)
          .map((i) => ({ url: i.url, alt: i.alt })),
        colors: dedupeColors(activeVariants),
        sizes: dedupeSizes(activeVariants),
        in_stock: activeVariants.some((v) => {
          const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
          if (!inv || !inv.track_inventory || inv.allow_backorder) return true;
          return inv.quantity - inv.reserved > 0;
        }),
      };
    });
}

type VariantColorRow = { color_name: string | null; color_hex: string | null };
type VariantSizeRow = { size: string | null };

function dedupeColors(variants: VariantColorRow[]) {
  const seen = new Map<string, { name: string; hex: string | null }>();
  for (const v of variants) {
    if (v.color_name && !seen.has(v.color_name)) {
      seen.set(v.color_name, { name: v.color_name, hex: v.color_hex });
    }
  }
  return [...seen.values()];
}

function dedupeSizes(variants: VariantSizeRow[]) {
  const seen = new Set<string>();
  for (const v of variants) if (v.size) seen.add(v.size);
  return [...seen];
}

/** Slugs for `generateStaticParams` and the sitemap. */
export async function getAllProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('status', 'active')
    .is('deleted_at', null);
  return data ?? [];
}
