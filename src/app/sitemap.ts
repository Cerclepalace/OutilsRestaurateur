import type { MetadataRoute } from 'next';

import { getAllProductSlugs, getCollections, getCategories } from '@/services/catalog';
import { getAllPageSlugs } from '@/services/cms';
import { clientEnv } from '@/lib/env';

export const revalidate = 3600;

/**
 * Sitemap.
 *
 * Only pages worth indexing: the storefront and its editorial content. The
 * cart, checkout, account and admin are excluded here and carry `noindex` of
 * their own.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;

  // Deliberately not guarded: a build that cannot read the catalogue should
  // fail rather than publish a sitemap missing every product.
  const [products, collections, categories, pages] = await Promise.all([
    getAllProductSlugs(),
    getCollections(),
    getCategories(),
    getAllPageSlugs(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/boutique`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/femme`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/homme`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/collections`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/archives`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category) => category.parent_id !== null && category.audience)
    .map((category) => ({
      url: `${base}/${category.audience}/${category.slug}`,
      lastModified: new Date(category.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...collections.map((collection) => ({
      url: `${base}/collections/${collection.slug}`,
      lastModified: new Date(collection.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/product/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...pages
      .filter((slug) => slug !== 'home')
      .map((slug) => ({
        url: `${base}/${slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      })),
  ];
}
