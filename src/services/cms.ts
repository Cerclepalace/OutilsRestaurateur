import 'server-only';

import { z } from 'zod';
import { createPublicClient } from '@/lib/supabase/public';

/**
 * CMS pages made of typed sections.
 *
 * Section content is `jsonb`, so it is validated with Zod on the way out. A
 * malformed block is dropped rather than crashing the page — an editor's typo
 * must never take the homepage down.
 */

const heroSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  posterUrl: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  secondaryLabel: z.string().optional(),
  secondaryHref: z.string().optional(),
  align: z.enum(['left', 'center']).default('center'),
  theme: z.enum(['light', 'dark']).default('dark'),
});

const imageTextSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
  imageUrl: z.string(),
  imageAlt: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  reverse: z.boolean().default(false),
});

const productGridSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  collection: z.string().optional(),
  category: z.string().optional(),
  sort: z.string().optional(),
  isNew: z.boolean().optional(),
  limit: z.number().int().min(2).max(12).default(4),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
});

const collectionGridSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  slugs: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(12).default(3),
});

const editorialSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
  items: z
    .array(z.object({ imageUrl: z.string(), caption: z.string().optional(), href: z.string().optional() }))
    .default([]),
});

const bannerSchema = z.object({
  message: z.string(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  theme: z.enum(['ink', 'paper']).default('ink'),
});

const videoSchema = z.object({
  title: z.string().optional(),
  videoUrl: z.string(),
  posterUrl: z.string().optional(),
  caption: z.string().optional(),
});

const manifestoSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  paragraphs: z.array(z.string()).default([]),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
});

const commitmentsSchema = z.object({
  title: z.string().optional(),
  items: z.array(z.object({ title: z.string(), body: z.string() })).default([]),
});

const newsletterSchema = z.object({
  title: z.string().default('Le Journal'),
  body: z.string().optional(),
});

const richTextSchema = z.object({
  title: z.string().optional(),
  paragraphs: z.array(z.string()).default([]),
});

/** Discriminated by the row's `kind` column. */
const sectionSchemas = {
  hero: heroSchema,
  image_text: imageTextSchema,
  product_grid: productGridSchema,
  collection_grid: collectionGridSchema,
  editorial: editorialSchema,
  banner: bannerSchema,
  video: videoSchema,
  manifesto: manifestoSchema,
  commitments: commitmentsSchema,
  newsletter: newsletterSchema,
  rich_text: richTextSchema,
} as const;

export type SectionKind = keyof typeof sectionSchemas;

export type Section = {
  [K in SectionKind]: { id: string; kind: K; content: z.infer<(typeof sectionSchemas)[K]> };
}[SectionKind];

export type HeroContent = z.infer<typeof heroSchema>;
export type ImageTextContent = z.infer<typeof imageTextSchema>;
export type ProductGridContent = z.infer<typeof productGridSchema>;
export type CollectionGridContent = z.infer<typeof collectionGridSchema>;
export type EditorialContent = z.infer<typeof editorialSchema>;
export type BannerContent = z.infer<typeof bannerSchema>;
export type VideoContent = z.infer<typeof videoSchema>;
export type ManifestoContent = z.infer<typeof manifestoSchema>;
export type CommitmentsContent = z.infer<typeof commitmentsSchema>;
export type NewsletterContent = z.infer<typeof newsletterSchema>;
export type RichTextContent = z.infer<typeof richTextSchema>;

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sections: Section[];
}

export async function getPage(slug: string): Promise<CmsPage | null> {
  const supabase = createPublicClient();

  const { data } = await supabase
    .from('pages')
    .select(
      `id, slug, title, subtitle, seo_title, seo_description,
       page_sections ( id, kind, content, position, is_published )`,
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (!data) return null;

  const sections = (data.page_sections ?? [])
    .filter((s) => s.is_published)
    .sort((a, b) => a.position - b.position)
    .flatMap((row): Section[] => {
      const schema = sectionSchemas[row.kind as SectionKind];
      if (!schema) return [];

      const parsed = schema.safeParse(row.content);
      if (!parsed.success) {
        // A broken block is skipped, not fatal. Surfaced in the server log so
        // the editor can be told which one needs fixing.
        console.warn(
          `[cms] section ${row.id} (${row.kind}) on page "${slug}" failed validation:`,
          parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        );
        return [];
      }

      return [{ id: row.id, kind: row.kind, content: parsed.data } as Section];
    });

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle,
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    sections,
  };
}

export async function getAllPageSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.from('pages').select('slug').eq('is_published', true);
  return (data ?? []).map((p) => p.slug);
}
