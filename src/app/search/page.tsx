import type { Metadata } from 'next';

import { CatalogView } from '@/features/catalog/catalog-view';
import { parseCatalogParams } from '@/lib/catalog-params';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = {
  title: 'Recherche',
  // A search results page has no business in an index.
  robots: { index: false, follow: true },
};

export default async function SearchPage(props: PageProps<'/search'>) {
  const params = await props.searchParams;
  const filters = parseCatalogParams(params);
  const query = filters.q?.trim();

  if (!query) {
    return (
      <div className="bobo-container">
        <EmptyState
          title="Que cherchez-vous ?"
          body="Saisissez le nom d'une pièce, d'un modèle ou d'une collection."
          actionLabel="Parcourir la boutique"
          actionHref="/boutique"
        />
      </div>
    );
  }

  return (
    <CatalogView
      filters={filters}
      title={`« ${query} »`}
      description="Résultats de recherche"
      emptyMessage={`Aucune pièce ne correspond à « ${query} ». Essayez un nom de modèle — Camille, Adam, Jeanne — ou une matière.`}
    />
  );
}
