'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import { SIZE_ORDER } from '@/config/site';
import { activeFilterCount, toggleParam, withParam } from '@/lib/catalog-params';
import { Drawer } from '@/components/ui/drawer';
import type { CatalogFacets } from '@/types/catalog';

/**
 * Filters.
 *
 * Every control is a link, so the whole rail works before JavaScript loads and
 * each state is a real URL. Counts come from the same query that produced the
 * grid, so a facet shown is always a facet that returns something.
 *
 * Desktop: a persistent left column. Mobile: the same markup inside a drawer.
 */
export function FilterRail({ facets }: { facets: CatalogFacets }) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const count = activeFilterCount(searchParams);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bobo-btn bobo-btn-ghost lg:hidden"
        aria-expanded={open}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        <span>Filtrer</span>
        {count > 0 ? <span className="tabular-nums">({count})</span> : null}
      </button>

      <aside className="hidden w-56 shrink-0 lg:block">
        <FilterGroups facets={facets} />
      </aside>

      <Drawer open={open} onClose={() => setOpen(false)} title="Filtrer" side="left">
        <div className="px-6 py-6">
          <FilterGroups facets={facets} onNavigate={() => setOpen(false)} />
        </div>
      </Drawer>
    </>
  );
}

function FilterGroups({
  facets,
  onNavigate,
}: {
  facets: CatalogFacets;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSizes = searchParams.getAll('size').flatMap((v) => v.split(','));
  const selectedColors = searchParams.getAll('color').flatMap((v) => v.split(','));
  const count = activeFilterCount(searchParams);

  const sizes = [...facets.sizes].sort(
    (a, b) => sizeRank(a.value) - sizeRank(b.value) || a.value.localeCompare(b.value),
  );

  return (
    <div className="flex flex-col gap-8">
      {count > 0 ? (
        <Link
          href={pathname}
          onClick={onNavigate}
          className="inline-flex items-center gap-2 self-start text-xs text-ink-soft transition-colors hover:text-ink"
        >
          <X className="size-3.5" aria-hidden />
          Tout effacer ({count})
        </Link>
      ) : null}

      {sizes.length > 0 ? (
        <fieldset>
          <legend className="bobo-eyebrow mb-3 text-ink-muted">Taille</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const active = selectedSizes.includes(size.value);
              return (
                <Link
                  key={size.value}
                  href={`${pathname}${toggleParam(searchParams, 'size', size.value)}`}
                  onClick={onNavigate}
                  aria-pressed={active}
                  scroll={false}
                  className={cn(
                    'min-w-11 border px-3 py-2 text-center text-xs transition-colors',
                    active
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line hover:border-ink-muted',
                  )}
                >
                  {size.value}
                  <span className="ml-1 text-[0.625rem] opacity-60 tabular-nums">{size.count}</span>
                </Link>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {facets.colors.length > 0 ? (
        <fieldset>
          <legend className="bobo-eyebrow mb-3 text-ink-muted">Couleur</legend>
          <ul className="flex flex-col gap-2">
            {facets.colors.map((color) => {
              const active = selectedColors.includes(color.value);
              return (
                <li key={color.value}>
                  <Link
                    href={`${pathname}${toggleParam(searchParams, 'color', color.value)}`}
                    onClick={onNavigate}
                    aria-pressed={active}
                    scroll={false}
                    className={cn(
                      'flex items-center gap-2.5 text-sm transition-colors',
                      active ? 'text-ink' : 'text-ink-soft hover:text-ink',
                    )}
                  >
                    <span
                      className={cn(
                        'size-3.5 rounded-full border transition-shadow',
                        active ? 'border-ink ring-1 ring-ink ring-offset-2' : 'border-line-strong',
                      )}
                      style={{ backgroundColor: color.hex ?? 'transparent' }}
                      aria-hidden
                    />
                    <span className="flex-1">{color.value}</span>
                    <span className="text-xs text-ink-muted tabular-nums">{color.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="bobo-eyebrow mb-3 text-ink-muted">Prix</legend>
        <PriceBrackets facets={facets} onNavigate={onNavigate} />
      </fieldset>

      <fieldset>
        <legend className="bobo-eyebrow mb-3 text-ink-muted">Disponibilité</legend>
        <ul className="flex flex-col gap-2">
          <ToggleLink param="stock" label="En stock uniquement" onNavigate={onNavigate} />
          <ToggleLink param="on_sale" label="En promotion" onNavigate={onNavigate} />
          <ToggleLink param="is_new" label="Nouveautés" onNavigate={onNavigate} />
        </ul>
      </fieldset>
    </div>
  );
}

function ToggleLink({
  param,
  label,
  onNavigate,
}: {
  param: string;
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(param) === '1';

  return (
    <li>
      <Link
        href={`${pathname}${withParam(searchParams, param, active ? null : '1')}`}
        onClick={onNavigate}
        aria-pressed={active}
        scroll={false}
        className={cn(
          'flex items-center gap-2.5 text-sm transition-colors',
          active ? 'text-ink' : 'text-ink-soft hover:text-ink',
        )}
      >
        <span
          className={cn(
            'grid size-3.5 place-items-center border transition-colors',
            active ? 'border-ink bg-ink' : 'border-line-strong',
          )}
          aria-hidden
        >
          {active ? <span className="size-1.5 bg-paper" /> : null}
        </span>
        {label}
      </Link>
    </li>
  );
}

/**
 * Price is offered as brackets rather than a slider: on a catalogue of this
 * size a slider is fiddly on a phone and produces URLs nobody can read.
 */
function PriceBrackets({
  facets,
  onNavigate,
}: {
  facets: CatalogFacets;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const min = facets.price.min_cents;
  const max = facets.price.max_cents;
  if (max <= min) return null;

  const edges = [min, ...[0.25, 0.5, 0.75].map((r) => roundTo(min + (max - min) * r, 1000)), max];
  const brackets = edges
    .slice(0, -1)
    .map((from, index) => ({ from, to: edges[index + 1] }))
    .filter((bracket) => bracket.to > bracket.from);

  const activeMin = searchParams.get('min');
  const activeMax = searchParams.get('max');

  return (
    <ul className="flex flex-col gap-2">
      {brackets.map((bracket) => {
        const fromEuros = String(Math.round(bracket.from / 100));
        const toEuros = String(Math.round(bracket.to / 100));
        const active = activeMin === fromEuros && activeMax === toEuros;

        const href = active
          ? `${pathname}${withParam(withParamsObject(searchParams, 'min', null), 'max', null)}`
          : `${pathname}${withParam(withParamsObject(searchParams, 'min', fromEuros), 'max', toEuros)}`;

        return (
          <li key={`${bracket.from}-${bracket.to}`}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-pressed={active}
              scroll={false}
              className={cn(
                'text-sm transition-colors',
                active ? 'text-ink' : 'text-ink-soft hover:text-ink',
              )}
            >
              {formatPrice(bracket.from)} – {formatPrice(bracket.to)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Applies one change and returns params, so two can be chained. */
function withParamsObject(current: URLSearchParams, key: string, value: string | null) {
  const next = new URLSearchParams(current);
  next.delete(key);
  if (value !== null) next.set(key, value);
  next.delete('page');
  return next;
}

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

function sizeRank(size: string) {
  const index = (SIZE_ORDER as readonly string[]).indexOf(size);
  return index === -1 ? SIZE_ORDER.length : index;
}
