import { searchCatalog } from '@/services/catalog';
import { ProductGrid } from '@/features/catalog/product-grid';
import { SectionHeading } from '@/features/cms/sections/section-heading';
import type { ProductGridContent } from '@/services/cms';

/**
 * A merchandised row of products.
 *
 * The section stores a query (collection, category, sort), not a list of ids,
 * so the row keeps itself current as the catalogue changes.
 */
export async function ProductGridSection({ content }: { content: ProductGridContent }) {
  const result = await searchCatalog({
    collection: content.collection,
    category: content.category,
    is_new: content.isNew,
    sort: content.sort,
    per_page: content.limit,
  });

  if (result.items.length === 0) return null;

  return (
    <section className="bobo-container py-section">
      <SectionHeading
        title={content.title}
        subtitle={content.subtitle}
        ctaLabel={content.ctaLabel}
        ctaHref={content.ctaHref}
      />
      <ProductGrid products={result.items} priorityCount={0} />
    </section>
  );
}
