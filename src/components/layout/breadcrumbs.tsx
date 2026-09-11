import Link from 'next/link';

import { clientEnv } from '@/lib/env';

export interface Crumb {
  label: string;
  href: string;
}

/**
 * Breadcrumb trail plus its BreadcrumbList structured data, emitted together so
 * the two can never drift apart.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: 'Accueil', href: '/' }, ...items];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: `${clientEnv.NEXT_PUBLIC_SITE_URL}${crumb.href}`,
    })),
  };

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="bobo-container pt-8">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
          {trail.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {index === trail.length - 1 ? (
                <span aria-current="page" className="text-ink-soft">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="bobo-link transition-colors hover:text-ink">
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <script
        type="application/ld+json"
        // Serialised from values we control; no user input reaches this string.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
