import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import type { ImageTextContent } from '@/services/cms';

/** Editorial split: one image, one column of text, alternating sides. */
export function ImageTextSection({ content }: { content: ImageTextContent }) {
  return (
    <section className="bobo-container py-section">
      <div
        className={cn(
          'grid items-center gap-10 lg:grid-cols-2 lg:gap-20',
          content.reverse && 'lg:[&>figure]:order-2',
        )}
      >
        <figure className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
          <Image
            src={content.imageUrl}
            alt={content.imageAlt ?? ''}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </figure>

        <div className="flex flex-col gap-5">
          {content.eyebrow ? (
            <p className="bobo-eyebrow text-ink-muted">{content.eyebrow}</p>
          ) : null}

          <h2 className="bobo-display text-display-md">{content.title}</h2>

          {content.body
            ? content.body.split('\n\n').map((paragraph, index) => (
                <p key={index} className="max-w-prose leading-relaxed text-ink-soft">
                  {paragraph}
                </p>
              ))
            : null}

          {content.ctaLabel && content.ctaHref ? (
            <Link href={content.ctaHref} className="bobo-link bobo-link-static mt-2 self-start">
              <span className="bobo-eyebrow">{content.ctaLabel}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
