'use client';

import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import type { NavNode } from '@/services/navigation';

/**
 * Desktop mega menu.
 *
 * One panel per top-level entry, laid out as columns of links with an optional
 * campaign image on the right. Columns come from the `column_label` on each
 * second-level item, so merchandising controls the structure from the admin.
 */
export function MegaMenu({
  items,
  openId,
  onClose,
}: {
  items: NavNode[];
  openId: string | null;
  onClose: () => void;
}) {
  const active = items.find((item) => item.id === openId && item.children.length > 0);

  return (
    <div
      className={cn(
        'absolute inset-x-0 top-full hidden overflow-hidden border-line bg-paper text-ink lg:block',
        'transition-[max-height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        active ? 'max-h-[32rem] border-b opacity-100' : 'pointer-events-none max-h-0 opacity-0',
      )}
      onMouseLeave={onClose}
    >
      {active ? (
        <div className="bobo-container grid grid-cols-[1fr_auto] gap-12 py-10">
          <div className="flex gap-14">
            {groupByColumn(active.children).map((column) => (
              <div key={column.label ?? 'default'} className="min-w-40">
                {column.label ? (
                  <p className="bobo-eyebrow mb-4 text-ink-muted">{column.label}</p>
                ) : null}

                <ul className="flex flex-col gap-2.5">
                  {column.items.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={child.href ?? '#'}
                        onClick={onClose}
                        className="bobo-link text-sm text-ink-soft transition-colors hover:text-ink"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {active.imageUrl ? (
            <Link
              href={active.href ?? '#'}
              onClick={onClose}
              className="group relative block h-72 w-56 overflow-hidden bg-paper-deep"
            >
              <Image
                src={active.imageUrl}
                alt=""
                fill
                sizes="224px"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
              <span className="bobo-eyebrow absolute bottom-4 left-4 bg-paper px-2 py-1">
                {active.label}
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Groups second-level items under their `column_label`, preserving order. */
function groupByColumn(children: NavNode[]) {
  const columns: { label: string | null; items: NavNode[] }[] = [];

  for (const child of children) {
    const label = child.columnLabel ?? null;
    const existing = columns.find((column) => column.label === label);
    if (existing) {
      existing.items.push(child);
    } else {
      columns.push({ label, items: [child] });
    }
  }

  return columns;
}
