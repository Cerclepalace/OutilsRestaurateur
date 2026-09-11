import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getPage } from '@/services/cms';
import { SectionRenderer } from '@/features/cms/section-renderer';
import { siteConfig } from '@/config/site';

// The homepage is merchandising content: revalidate rather than rebuild.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('home');
  return {
    title: page?.seoTitle ?? `${siteConfig.name} — ${siteConfig.tagline}`,
    description: page?.seoDescription ?? siteConfig.description,
    alternates: { canonical: '/' },
  };
}

export default async function HomePage() {
  const page = await getPage('home');
  if (!page) notFound();

  return <SectionRenderer sections={page.sections} />;
}
