import Link from 'next/link';

import type { ManifestoContent } from '@/services/cms';

/**
 * The brand statement. Set on the deep paper tone and centred, with generous
 * measure — this is the one place the page is allowed to slow down.
 */
export function ManifestoSection({ content }: { content: ManifestoContent }) {
  return (
    <section className="bg-paper-deep py-section">
      <div className="bobo-container-tight flex flex-col items-center gap-6 text-center">
        {content.eyebrow ? <p className="bobo-eyebrow text-ink-muted">{content.eyebrow}</p> : null}

        <h2 className="bobo-display text-display-md">{content.title}</h2>

        {content.paragraphs.map((paragraph, index) => (
          <p key={index} className="max-w-prose leading-relaxed text-ink-soft">
            {paragraph}
          </p>
        ))}

        {content.ctaLabel && content.ctaHref ? (
          <Link href={content.ctaHref} className="bobo-btn bobo-btn-outline mt-4">
            {content.ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
