import { HeroSection } from '@/features/cms/sections/hero';
import { ImageTextSection } from '@/features/cms/sections/image-text';
import { EditorialSection } from '@/features/cms/sections/editorial';
import { ManifestoSection } from '@/features/cms/sections/manifesto';
import { CommitmentsSection } from '@/features/cms/sections/commitments';
import { ProductGridSection } from '@/features/cms/sections/product-grid-section';
import { CollectionGridSection } from '@/features/cms/sections/collection-grid-section';
import {
  BannerSection,
  NewsletterSection,
  RichTextSection,
  VideoSection,
} from '@/features/cms/sections/simple-sections';
import type { Section } from '@/services/cms';

/**
 * Renders a page's sections in order.
 *
 * The switch is exhaustive over `Section`, so adding a block type to the CMS
 * schema without adding a renderer is a compile error rather than a blank space
 * on the homepage.
 */
export function SectionRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section, index) => (
        <SectionSwitch key={section.id} section={section} first={index === 0} />
      ))}
    </>
  );
}

function SectionSwitch({ section, first }: { section: Section; first: boolean }) {
  switch (section.kind) {
    case 'hero':
      return <HeroSection content={section.content} priority={first} />;
    case 'image_text':
      return <ImageTextSection content={section.content} />;
    case 'product_grid':
      return <ProductGridSection content={section.content} />;
    case 'collection_grid':
      return <CollectionGridSection content={section.content} />;
    case 'editorial':
      return <EditorialSection content={section.content} />;
    case 'manifesto':
      return <ManifestoSection content={section.content} />;
    case 'commitments':
      return <CommitmentsSection content={section.content} />;
    case 'banner':
      return <BannerSection content={section.content} />;
    case 'video':
      return <VideoSection content={section.content} />;
    case 'newsletter':
      return <NewsletterSection content={section.content} />;
    case 'rich_text':
      return <RichTextSection content={section.content} />;
    default: {
      const exhaustive: never = section;
      void exhaustive;
      return null;
    }
  }
}
