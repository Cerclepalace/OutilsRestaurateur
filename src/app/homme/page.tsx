import type { Metadata } from 'next';

import { CatalogView } from '@/features/catalog/catalog-view';
import { parseCatalogParams } from '@/lib/catalog-params';
import { getCategoryBySlug } from '@/services/catalog';

export const metadata: Metadata = {
  title: 'Homme',
  description:
    'Le vestiaire homme BOBO PARIS : blousons, chemises et gilets en matières revalorisées, coupes amples et non genrées.',
  alternates: { canonical: '/homme' },
};

export default async function HommePage(props: PageProps<'/homme'>) {
  const [params, category] = await Promise.all([props.searchParams, getCategoryBySlug('homme')]);
  const filters = parseCatalogParams(params, { category: 'homme' });

  return (
    <CatalogView
      filters={filters}
      title={category?.name ?? 'Homme'}
      description={
        category?.description ??
        "100 % upcyclés, nos modèles sont développés en petite série dans des ateliers familiaux à Paris et Casablanca. Chaque modèle est disponible en édition très limitée jusqu'à épuisement."
      }
    />
  );
}
