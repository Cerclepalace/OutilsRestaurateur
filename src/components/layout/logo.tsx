import Link from 'next/link';

import { cn } from '@/lib/utils';

/**
 * The wordmark, set in letterspaced caps.
 *
 * Drawn as type rather than an image file: it stays crisp at any size, costs
 * no request, and is readable by search engines and screen readers.
 */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="BOBO PARIS — retour à l'accueil"
      className={cn('inline-flex items-baseline whitespace-nowrap', className)}
    >
      <span
        className={cn(
          'font-sans font-normal uppercase leading-none transition-all duration-500',
          compact ? 'text-base tracking-[0.34em]' : 'text-lg tracking-[0.42em] md:text-xl',
        )}
      >
        Bobo
      </span>
      <span
        className={cn(
          'font-sans font-light uppercase leading-none transition-all duration-500',
          compact ? 'text-base tracking-[0.34em]' : 'text-lg tracking-[0.42em] md:text-xl',
        )}
      >
        &nbsp;Paris
      </span>
    </Link>
  );
}
