import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getProductBySlug, getAllProductSlugs, getRecommendations } from '@/services/catalog';
import { ProductGallery } from '@/features/product/gallery';
import { BuyPanel } from '@/features/product/buy-panel';
import { SizeGuideTable } from '@/features/product/size-guide-table';
import { ProductGrid } from '@/features/catalog/product-grid';
import { Accordion } from '@/components/ui/accordion';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { getFreeShippingThreshold } from '@/services/settings';
import { clientEnv } from '@/lib/env';
import { formatPrice } from '@/lib/format';

export const revalidate = 120;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata(props: PageProps<'/product/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const image = product.images[0]?.url;

  return {
    title: product.seo_title ?? product.name,
    description: product.seo_description ?? product.description?.slice(0, 158) ?? undefined,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      type: 'website',
      title: product.name,
      description: product.description?.slice(0, 200) ?? undefined,
      images: image ? [{ url: image, width: 1200, height: 1600 }] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<'/product/[slug]'>) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [similar, completeTheLook, freeShippingFrom] = await Promise.all([
    getRecommendations(product.id, 'similar', 4),
    getRecommendations(product.id, 'complete_the_look', 4),
    getFreeShippingThreshold('FR'),
  ]);

  const lowest = Math.min(...product.variants.map((v) => v.price_cents), product.price_cents);

  // Product / Offer structured data, built from the same values the page shows.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    sku: product.variants[0]?.sku,
    brand: { '@type': 'Brand', name: 'BOBO PARIS' },
    material: product.composition ?? undefined,
    image: product.images.map((image) => `${clientEnv.NEXT_PUBLIC_SITE_URL}${image.url}`),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: product.currency,
      lowPrice: (lowest / 100).toFixed(2),
      highPrice: (
        Math.max(...product.variants.map((v) => v.price_cents), product.price_cents) / 100
      ).toFixed(2),
      offerCount: product.variants.length,
      availability: product.in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${clientEnv.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`,
    },
  };

  const genderHref = product.audience === 'homme' ? '/homme' : '/femme';
  const genderLabel = product.audience === 'homme' ? 'Homme' : 'Femme';

  return (
    <>
      <Breadcrumbs
        items={[
          ...(product.audience === 'unisexe'
            ? [{ label: 'Boutique', href: '/boutique' }]
            : [{ label: genderLabel, href: genderHref }]),
          ...(product.category
            ? [
                {
                  label: product.category.name,
                  href:
                    product.audience === 'unisexe'
                      ? `/boutique?category=${product.category.slug}`
                      : `${genderHref}/${product.category.slug}`,
                },
              ]
            : []),
          { label: product.name, href: `/product/${product.slug}` },
        ]}
      />

      <div className="bobo-container pb-section pt-6">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16 xl:gap-24">
          <ProductGallery images={product.images} productName={product.name} />

          {/* The panel follows the gallery on a tall desktop screen. */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <BuyPanel product={product} />

            <div className="mt-10 border-t border-line">
              {product.description ? (
                <Accordion title="Description" defaultOpen>
                  <p className="leading-relaxed">{product.description}</p>
                </Accordion>
              ) : null}

              {product.composition ? (
                <Accordion title="Composition">
                  <p className="leading-relaxed">{product.composition}</p>
                </Accordion>
              ) : null}

              {product.manufacturing || product.origin_country ? (
                <Accordion title="Fabrication">
                  <div className="flex flex-col gap-2">
                    {product.manufacturing ? (
                      <p className="leading-relaxed">{product.manufacturing}</p>
                    ) : null}
                    {product.origin_country ? (
                      <p className="text-xs text-ink-muted">
                        Origine de production : {product.origin_country}
                      </p>
                    ) : null}
                  </div>
                </Accordion>
              ) : null}

              {product.size_guide ? (
                <div id="taille" className="scroll-mt-28">
                  <Accordion title="Taille">
                    <SizeGuideTable guide={product.size_guide} />
                  </Accordion>
                </div>
              ) : null}

              {product.care_guide ? (
                <Accordion title="Guide d'entretien">
                  <p className="leading-relaxed">{product.care_guide}</p>
                </Accordion>
              ) : null}

              <Accordion title="Livraison & retours">
                <div className="flex flex-col gap-2">
                  {/* The threshold is a commercial setting, not copy: it is read
                      from `shipping_methods` like the cart and the checkout, so
                      changing it in the admin changes it everywhere at once. */}
                  <p>
                    France métropolitaine : 2 à 4 jours ouvrés
                    {freeShippingFrom !== null
                      ? `, offerte dès ${formatPrice(freeShippingFrom)} d'achat`
                      : ''}
                    .
                  </p>
                  <p>Retours acceptés sous 14 jours, pièce non portée.</p>
                  <Link href="/livraison-et-retours" className="bobo-link self-start text-ink">
                    Tout savoir
                  </Link>
                </div>
              </Accordion>

              {product.collections.length > 0 ? (
                <Accordion title="Collections">
                  <ul className="flex flex-col gap-2">
                    {product.collections.map((collection) => (
                      <li key={collection.slug}>
                        <Link
                          href={`/collections/${collection.slug}`}
                          className="bobo-link text-ink"
                        >
                          {collection.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Accordion>
              ) : null}
            </div>
          </div>
        </div>

        {completeTheLook.length > 0 ? (
          <section className="pt-section">
            <h2 className="bobo-display mb-8 text-display-sm">Compléter le look</h2>
            <ProductGrid products={completeTheLook} priorityCount={0} />
          </section>
        ) : null}

        {similar.length > 0 ? (
          <section className="pt-section">
            <h2 className="bobo-display mb-8 text-display-sm">Vous pourriez aimer</h2>
            <ProductGrid products={similar} priorityCount={0} />
          </section>
        ) : null}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
