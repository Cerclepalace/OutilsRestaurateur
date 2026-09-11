import Link from 'next/link';

import { cn } from '@/lib/utils';
import { NewsletterForm } from '@/features/cms/newsletter-form';
import type {
  BannerContent,
  NewsletterContent,
  RichTextContent,
  VideoContent,
} from '@/services/cms';

export function BannerSection({ content }: { content: BannerContent }) {
  const dark = content.theme === 'ink';

  return (
    <section className={cn('py-section-sm', dark ? 'bg-ink text-paper' : 'bg-paper-warm text-ink')}>
      <div className="bobo-container flex flex-col items-center gap-5 text-center">
        <p className="bobo-display max-w-2xl text-display-sm">{content.message}</p>
        {content.ctaLabel && content.ctaHref ? (
          <Link
            href={content.ctaHref}
            className={cn('bobo-btn bobo-btn-outline', dark && 'border-paper text-paper hover:bg-paper hover:text-ink')}
          >
            {content.ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function VideoSection({ content }: { content: VideoContent }) {
  return (
    <section className="bobo-container py-section">
      {content.title ? (
        <h2 className="bobo-display mb-8 text-display-md">{content.title}</h2>
      ) : null}

      <figure className="relative aspect-video overflow-hidden bg-paper-deep">
        <video
          className="size-full object-cover"
          src={content.videoUrl}
          poster={content.posterUrl}
          controls
          playsInline
          preload="none"
        />
        {content.caption ? (
          <figcaption className="mt-3 text-sm text-ink-soft">{content.caption}</figcaption>
        ) : null}
      </figure>
    </section>
  );
}

export function NewsletterSection({ content }: { content: NewsletterContent }) {
  return (
    <section className="border-t border-line py-section">
      <div className="bobo-container-tight flex flex-col items-center gap-5 text-center">
        <h2 className="bobo-display text-display-md">{content.title}</h2>
        {content.body ? <p className="max-w-prose text-ink-soft">{content.body}</p> : null}
        <div className="mt-2 w-full max-w-sm">
          <NewsletterForm source="section" />
        </div>
      </div>
    </section>
  );
}

export function RichTextSection({ content }: { content: RichTextContent }) {
  return (
    <section className="bobo-container-tight py-section-sm">
      {content.title ? (
        <h2 className="bobo-display mb-6 text-display-sm">{content.title}</h2>
      ) : null}

      <div className="flex flex-col gap-4">
        {content.paragraphs.map((paragraph, index) => (
          <p key={index} className="leading-relaxed text-ink-soft">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
