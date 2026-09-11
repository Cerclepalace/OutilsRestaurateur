import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getCollectionBySlug, getCollections } from '@/services/catalog';
import { CatalogView } from '@/features/catalog/catalog-view';
import { parseCatalogParams } from '@/lib/catalog-params';

export const revalidate = 300;

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata(
  props: PageProps<'/collections/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};

  return {
    title: collection.seo_title ?? collection.title,
    description: collection.seo_description ?? collection.subtitle ?? undefined,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: {
      title: collection.title,
      description: collection.subtitle ?? undefined,
      images: collection.hero_image_url ? [{ url: collection.hero_image_url }] : undefined,
    },
  };
}

export default async function CollectionPage(props: PageProps<'/collections/[slug]'>) {
  const [{ slug }, params] = await Promise.all([props.params, props.searchParams]);
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  return (
    <>
      {/* The header sits under a transparent site header, so it carries its own
          scrim and top padding. */}
      <section className="relative flex min-h-[52svh] items-end overflow-hidden text-paper lg:min-h-[68svh]">
        {collection.hero_image_url ? (
          <Image
            src={collection.hero_image_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-paper-warm" />
        )}

        <div
          className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/60 to-transparent"
          aria-hidden
        />

        <div className="bobo-container relative w-full pb-12 pt-28">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="bobo-eyebrow opacity-90">Collection capsule</p>
            <h1 className="bobo-display text-display-lg">{collection.title}</h1>
            {collection.story ? (
              <p className="max-w-md leading-relaxed opacity-90">{collection.story}</p>
            ) : null}
          </div>
        </div>
      </section>

      <CatalogView
        filters={parseCatalogParams(params, { collection: slug })}
        title={collection.subtitle ?? 'Les pièces'}
        description={null}
        emptyMessage="Cette capsule est épuisée. Les pièces ne seront pas rééditées."
      />
    </>
  );
}
