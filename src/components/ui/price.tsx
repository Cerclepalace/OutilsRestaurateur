import { cn } from '@/lib/utils';
import { formatPrice, discountPercent } from '@/lib/format';

/**
 * Price display. A reduced price shows the old one struck through beside it —
 * the only place the clay accent is allowed to appear.
 */
export function Price({
  cents,
  compareAtCents,
  currency = 'EUR',
  size = 'base',
  className,
}: {
  cents: number;
  compareAtCents?: number | null;
  currency?: string;
  size?: 'sm' | 'base' | 'lg';
  className?: string;
}) {
  const isReduced = Boolean(compareAtCents && compareAtCents > cents);
  const percent = discountPercent(cents, compareAtCents);

  const sizes = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
  } as const;

  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2', sizes[size], className)}>
      <span className={cn('tabular-nums', isReduced && 'text-clay')}>
        {formatPrice(cents, currency)}
      </span>

      {isReduced && compareAtCents ? (
        <>
          <span className="text-ink-muted line-through tabular-nums">
            {formatPrice(compareAtCents, currency)}
          </span>
          <span className="bobo-sr-only">
            Prix réduit de {percent} pour cent.
          </span>
        </>
      ) : null}
    </span>
  );
}
