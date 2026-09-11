'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import { SORT_OPTIONS } from '@/config/site';
import { withParam } from '@/lib/catalog-params';

/** Native select: it is the control every phone already knows how to render. */
export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('sort') ?? 'featured';

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="catalog-sort" className="bobo-sr-only">
        Trier les résultats
      </label>

      <select
        id="catalog-sort"
        value={current}
        onChange={(event) => {
          router.push(`${pathname}${withParam(searchParams, 'sort', event.target.value)}`, {
            scroll: false,
          });
        }}
        className="bobo-eyebrow cursor-pointer appearance-none bg-transparent py-2 pr-6 outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-0 size-3.5" aria-hidden />
    </div>
  );
}
