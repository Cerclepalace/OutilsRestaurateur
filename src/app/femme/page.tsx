import type { Metadata } from 'next';

import { CatalogView } from '@/features/catalog/catalog-view';
import { parseCatalogParams } from '@/lib/catalog-params';
import { getCategoryBySlug } from '@/services/catalog';

export const metadata: Metadata = {
  title: 'Femme',
  description:
    'Le vestiaire femme BOBO PARIS : manteaux, chemises, robes, combinaisons et gilets en matières revalorisées.',
  alternates: { canonical: '/femme' },
};

export default async function FemmePage(props: PageProps<'/femme'>) {
  const [params, category] = await Promise.all([props.searchParams, getCategoryBySlug('femme')]);
  const filters = parseCatalogParams(params, { category: 'femme' });

  return (
    <CatalogView
      filters={filters}
      title={category?.name ?? 'Femme'}
      description={
        category?.description ??
        "100 % upcyclés, nos modèles sont développés en petite série dans des ateliers familiaux à Paris et Casablanca, à partir de stocks dormants de grandes maisons."
      }
    />
  );
}
