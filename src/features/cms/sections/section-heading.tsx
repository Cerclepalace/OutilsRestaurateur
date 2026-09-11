import Link from 'next/link';

/** Shared heading for every grid section, so the rhythm stays identical. */
export function SectionHeading({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  if (!title && !subtitle) return null;

  return (
    <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        {title ? <h2 className="bobo-display text-display-sm">{title}</h2> : null}
        {subtitle ? <p className="text-sm text-ink-soft">{subtitle}</p> : null}
      </div>

      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className="bobo-link bobo-link-static">
          <span className="bobo-eyebrow">{ctaLabel}</span>
        </Link>
      ) : null}
    </header>
  );
}
