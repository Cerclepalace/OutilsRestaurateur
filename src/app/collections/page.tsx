import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

import { getCollections } from '@/services/catalog';
import { EmptyState } from '@/components/ui/empty-state';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Collections',
  description:
    'Les collections capsules BOBO PARIS, produites en éditions limitées à partir de matières revalorisées.',
  alternates: { canonical: '/collections' },
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  if (collections.length === 0) {
    return (
      <EmptyState
        title="Aucune collection publiée"
        body="Les capsules seront annoncées ici."
        actionLabel="Voir la boutique"
        actionHref="/boutique"
      />
    );
  }

  const [lead, ...rest] = collections;

  return (
    <div className="bobo-container pb-section pt-12 lg:pt-16">
      <header className="mb-12 flex flex-col gap-3">
        <h1 className="bobo-display text-display-lg">Nos collections capsules</h1>
        <p className="max-w-2xl leading-relaxed text-ink-soft">
          Chaque capsule naît d&apos;un lot de matières précis. Une fois le tissu épuisé, la
          collection ne revient pas.
        </p>
      </header>

      {/* The most recent capsule gets a wide plate; the rest follow in a grid. */}
      <Link href={`/collections/${lead.slug}`} className="group block">
        <figure className="relative aspect-[16/9] overflow-hidden bg-paper-deep">
          {lead.hero_image_url ? (
            <Image
              src={lead.hero_image_url}
              alt={lead.title}
              fill
              priority
              sizes="100vw"
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
            />
          ) : null}
        </figure>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="bobo-display text-display-md">{lead.title}</h2>
            {lead.subtitle ? <p className="mt-1 text-ink-soft">{lead.subtitle}</p> : null}
          </div>
          <span className="bobo-eyebrow bobo-link bobo-link-static">Découvrir</span>
        </div>
      </Link>

      {rest.length > 0 ? (
        <div className="mt-20 grid gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-6">
          {rest.map((collection) => (
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
              <h2 className="bobo-display mt-4 text-display-sm">{collection.title}</h2>
              {collection.subtitle ? (
                <p className="mt-1 text-sm text-ink-soft">{collection.subtitle}</p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
