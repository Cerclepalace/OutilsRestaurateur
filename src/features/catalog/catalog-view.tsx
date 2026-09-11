import { Suspense } from 'react';

import { searchCatalog } from '@/services/catalog';
import { ProductGrid } from '@/features/catalog/product-grid';
import { FilterRail } from '@/features/catalog/filter-rail';
import { SortSelect } from '@/features/catalog/sort-select';
import { Pagination } from '@/features/catalog/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import type { CatalogFilters } from '@/types/catalog';

/**
 * Shared listing layout for /boutique, /femme, /homme, a category, a collection
 * and /search. One query, one grid, one set of facets — the difference between
 * these pages is the filter passed in, not the code.
 */
export async function CatalogView({
  filters,
  title,
  description,
  emptyMessage = 'Aucune pièce ne correspond à votre sélection.',
}: {
  filters: CatalogFilters;
  title: string;
  description?: string | null;
  emptyMessage?: string;
}) {
  const result = await searchCatalog(filters);

  return (
    <div className="bobo-container pb-section pt-12 lg:pt-16">
      <header className="mb-10 flex flex-col gap-3">
        <h1 className="bobo-display text-display-lg">{title}</h1>
        {description ? (
          <p className="max-w-2xl leading-relaxed text-ink-soft">{description}</p>
        ) : null}
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-14">
        <Suspense fallback={<div className="hidden w-56 shrink-0 lg:block" />}>
          <FilterRail facets={result.facets} />
        </Suspense>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-line pb-4">
            <p className="bobo-eyebrow text-ink-muted" aria-live="polite">
              {result.total} pièce{result.total > 1 ? 's' : ''}
            </p>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          {result.items.length === 0 ? (
            <EmptyState
              title="Rien pour l'instant"
              body={emptyMessage}
              actionLabel="Voir toute la boutique"
              actionHref="/boutique"
            />
          ) : (
            <>
              <ProductGrid products={result.items} />
              <Suspense fallback={null}>
                <Pagination page={result.page} pageCount={result.page_count} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
