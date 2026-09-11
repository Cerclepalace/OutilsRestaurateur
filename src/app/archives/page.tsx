import type { Metadata } from 'next';

import { CatalogView } from '@/features/catalog/catalog-view';
import { parseCatalogParams } from '@/lib/catalog-params';

export const metadata: Metadata = {
  title: 'Archives',
  description:
    "Les pièces uniques BOBO PARIS : un seul exemplaire, assemblé à la main dans l'atelier parisien.",
  alternates: { canonical: '/archives' },
};

/**
 * Pièces uniques. The catalogue calls them one-of-a-kind; the brand calls the
 * page Archives, because once a piece is gone it is gone.
 */
export default async function ArchivesPage(props: PageProps<'/archives'>) {
  const filters = parseCatalogParams(await props.searchParams, { sort: 'newest', one_of_a_kind: true });

  return (
    <CatalogView
      filters={filters}
      title="Archives"
      description="Chaque pièce de cette sélection existe en un seul exemplaire, entièrement assemblée à la main dans notre atelier parisien. Elle ne sera pas rééditée."
      emptyMessage="Aucune pièce unique disponible pour le moment. Elles partent vite — revenez bientôt."
    />
  );
}
