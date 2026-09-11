import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getPage, getAllPageSlugs } from '@/services/cms';
import { SectionRenderer } from '@/features/cms/section-renderer';

export const revalidate = 600;

/** Slugs handled by a dedicated route must never be captured here. */
const RESERVED = new Set(['home']);

export async function generateStaticParams() {
  const slugs = await getAllPageSlugs();
  return slugs.filter((slug) => !RESERVED.has(slug)).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await getPage(slug);
  if (!page) return {};

  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.subtitle ?? undefined,
    alternates: { canonical: `/${slug}` },
  };
}

/**
 * Every editorial page — Qui sommes-nous, Nos engagements, Le Studio, Le
 * Journal, Livraison & retours, Guide des tailles — is one CMS record rendered
 * by the shared section renderer.
 */
export default async function ContentPage(props: PageProps<'/[slug]'>) {
  const { slug } = await props.params;
  if (RESERVED.has(slug)) notFound();

  const page = await getPage(slug);
  if (!page) notFound();

  const opensWithHero = page.sections[0]?.kind === 'hero';

  return (
    <>
      {!opensWithHero ? (
        <header className="bobo-container pb-4 pt-20 lg:pt-28">
          <div className="flex flex-col gap-3 border-b border-line pb-10">
            {page.subtitle ? (
              <p className="bobo-eyebrow text-ink-muted">{page.subtitle}</p>
            ) : null}
            <h1 className="bobo-display text-display-lg">{page.title}</h1>
          </div>
        </header>
      ) : null}

      <SectionRenderer sections={page.sections} />
    </>
  );
}
