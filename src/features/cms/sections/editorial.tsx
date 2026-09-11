import Link from 'next/link';
import Image from 'next/image';

import type { EditorialContent } from '@/services/cms';

/** Lookbook strip: a row of tall images with a caption that slides up on hover. */
export function EditorialSection({ content }: { content: EditorialContent }) {
  if (content.items.length === 0) return null;

  return (
    <section className="bobo-container py-section">
      <header className="mb-9 flex flex-col gap-2">
        {content.eyebrow ? <p className="bobo-eyebrow text-ink-muted">{content.eyebrow}</p> : null}
        <h2 className="bobo-display text-display-md">{content.title}</h2>
        {content.body ? <p className="max-w-prose text-ink-soft">{content.body}</p> : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {content.items.map((item, index) => {
          const media = (
            <figure className="group relative aspect-[4/5] overflow-hidden bg-paper-deep">
              <Image
                src={item.imageUrl}
                alt={item.caption ?? ''}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />
              {item.caption ? (
                <figcaption className="absolute bottom-5 left-5">
                  <span className="bobo-eyebrow bg-paper px-3 py-2">{item.caption}</span>
                </figcaption>
              ) : null}
            </figure>
          );

          return item.href ? (
            <Link key={index} href={item.href}>
              {media}
            </Link>
          ) : (
            <div key={index}>{media}</div>
          );
        })}
      </div>
    </section>
  );
}
