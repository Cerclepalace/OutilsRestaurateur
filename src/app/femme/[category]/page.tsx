import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { CatalogView } from '@/features/catalog/catalog-view';
import { parseCatalogParams } from '@/lib/catalog-params';
import { getCategories, getCategoryBySlug } from '@/services/catalog';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getCategories();
  const femme = categories.find((c) => c.slug === 'femme');
  return categories
    .filter((c) => c.parent_id === femme?.id)
    .map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<'/femme/[category]'>): Promise<Metadata> {
  const { category: slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} — Femme`,
    description: category.seo_description ?? category.description ?? undefined,
    alternates: { canonical: `/femme/${slug}` },
  };
}

export default async function FemmeCategoryPage(props: PageProps<'/femme/[category]'>) {
  const [{ category: slug }, params] = await Promise.all([props.params, props.searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Femme', href: '/femme' },
          { label: category.name, href: `/femme/${slug}` },
        ]}
      />
      <CatalogView
        filters={parseCatalogParams(params, { category: slug })}
        title={category.name}
        description={category.description}
      />
    </>
  );
}
