import Link from 'next/link';
import Image from 'next/image';

import { getCollections } from '@/services/catalog';
import { SectionHeading } from '@/features/cms/sections/section-heading';
import type { CollectionGridContent } from '@/services/cms';

/** Capsule cards: cover image, title, subtitle. */
export async function CollectionGridSection({ content }: { content: CollectionGridContent }) {
  const all = await getCollections();

  const collections = content.slugs?.length
    ? content.slugs
        .map((slug) => all.find((collection) => collection.slug === slug))
        .filter((collection): collection is (typeof all)[number] => Boolean(collection))
    : all.slice(0, content.limit);

  if (collections.length === 0) return null;

  return (
    <section className="bobo-container py-section">
      <SectionHeading title={content.title} subtitle={content.subtitle} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {collections.map((collection) => (
          <Link key={collection.id} href={`/collections/${collection.slug}`} className="group">
            <figure className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
              {collection.cover_image_url ? (
                <Image
                  src={collection.cover_image_url}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              ) : null}
            </figure>

            <div className="mt-4 flex flex-col gap-1">
              <h3 className="bobo-display text-display-sm">{collection.title}</h3>
              {collection.subtitle ? (
                <p className="text-sm text-ink-soft">{collection.subtitle}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
