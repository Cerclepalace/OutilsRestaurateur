import type { Metadata } from 'next';

import { CatalogView } from '@/features/catalog/catalog-view';
import { parseCatalogParams } from '@/lib/catalog-params';

export const metadata: Metadata = {
  title: 'Boutique',
  description:
    "Toutes les pièces BOBO PARIS : collections capsules en éditions limitées et pièces uniques, confectionnées à partir de matières revalorisées.",
  alternates: { canonical: '/boutique' },
};

export default async function BoutiquePage(props: PageProps<'/boutique'>) {
  const filters = parseCatalogParams(await props.searchParams);

  return (
    <CatalogView
      filters={filters}
      title="Boutique"
      description="Nos pièces sont développées en très petite série à partir de stocks dormants et de vêtements de seconde main. Chaque modèle est disponible en édition limitée, jusqu'à épuisement."
    />
  );
}
