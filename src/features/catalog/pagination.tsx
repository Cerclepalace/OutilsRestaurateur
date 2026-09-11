'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { withParam } from '@/lib/catalog-params';

/**
 * Page links, not an infinite scroll: a shopper who opens a piece and comes
 * back lands where they were, and the page is crawlable.
 */
export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pageCount <= 1) return null;

  const href = (target: number) => `${pathname}${withParam(searchParams, 'page', String(target))}`;
  const pages = pageNumbers(page, pageCount);

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-1">
      <PageLink href={href(page - 1)} disabled={page <= 1} label="Page précédente">
        <ChevronLeft className="size-4" aria-hidden />
      </PageLink>

      {pages.map((entry, index) =>
        entry === null ? (
          <span key={`gap-${index}`} className="px-2 text-ink-muted">
            …
          </span>
        ) : (
          <PageLink
            key={entry}
            href={href(entry)}
            current={entry === page}
            label={`Page ${entry}`}
          >
            {entry}
          </PageLink>
        ),
      )}

      <PageLink href={href(page + 1)} disabled={page >= pageCount} label="Page suivante">
        <ChevronRight className="size-4" aria-hidden />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  current = false,
  disabled = false,
  label,
}: {
  href: string;
  children: React.ReactNode;
  current?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const className = cn(
    'grid size-10 place-items-center text-sm tabular-nums transition-colors',
    current ? 'bg-ink text-paper' : 'hover:bg-paper-deep',
    disabled && 'pointer-events-none opacity-30',
  );

  if (disabled) {
    return (
      <span className={className} aria-hidden>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      scroll
    >
      {children}
    </Link>
  );
}

/** 1 … 4 5 6 … 20 — always shows the ends and a window around the current page. */
function pageNumbers(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const window = new Set([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...window].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);

  const result: (number | null)[] = [];
  let previous = 0;
  for (const entry of sorted) {
    if (entry - previous > 1) result.push(null);
    result.push(entry);
    previous = entry;
  }
  return result;
}
