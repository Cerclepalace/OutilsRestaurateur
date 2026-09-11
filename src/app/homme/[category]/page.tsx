import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { CatalogView } from '@/features/catalog/catalog-view';
import { parseCatalogParams } from '@/lib/catalog-params';
import { getCategories, getCategoryBySlug } from '@/services/catalog';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getCategories();
  const homme = categories.find((c) => c.slug === 'homme');
  return categories
    .filter((c) => c.parent_id === homme?.id)
    .map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<'/homme/[category]'>): Promise<Metadata> {
  const { category: slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} — Homme`,
    description: category.seo_description ?? category.description ?? undefined,
    alternates: { canonical: `/homme/${slug}` },
  };
}

export default async function HommeCategoryPage(props: PageProps<'/homme/[category]'>) {
  const [{ category: slug }, params] = await Promise.all([props.params, props.searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Homme', href: '/homme' },
          { label: category.name, href: `/homme/${slug}` },
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
