'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Drawer } from '@/components/ui/drawer';
import type { NavNode } from '@/services/navigation';

/**
 * Full-height mobile navigation.
 *
 * Drills one level at a time rather than showing a long accordion: on a phone,
 * a short list you step through beats a wall of links you scroll past.
 */
export function MobileMenu({
  open,
  onClose,
  navigation,
}: {
  open: boolean;
  onClose: () => void;
  navigation: NavNode[];
}) {
  const [drilled, setDrilled] = useState<NavNode | null>(null);

  function close() {
    onClose();
    // Reset after the closing animation so the panel does not visibly rewind.
    window.setTimeout(() => setDrilled(null), 400);
  }

  const items = drilled?.children ?? navigation;

  return (
    <Drawer open={open} onClose={close} title={drilled?.label ?? 'Menu'} side="left">
      <nav aria-label="Navigation mobile" className="flex flex-col">
        {drilled ? (
          <button
            type="button"
            onClick={() => setDrilled(null)}
            className="flex items-center gap-2 border-b border-line px-6 py-4 text-left"
          >
            <ChevronLeft className="size-4" aria-hidden />
            <span className="bobo-eyebrow">Retour</span>
          </button>
        ) : null}

        {drilled?.href ? (
          <Link
            href={drilled.href}
            onClick={close}
            className="border-b border-line px-6 py-4 text-sm italic text-ink-soft"
          >
            Voir tout — {drilled.label}
          </Link>
        ) : null}

        <ul>
          {items.map((item) => (
            <li key={item.id} className="border-b border-line">
              {item.children.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setDrilled(item)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="bobo-eyebrow">{item.label}</span>
                  <ChevronRight className="size-4 text-ink-muted" aria-hidden />
                </button>
              ) : (
                <Link
                  href={item.href ?? '#'}
                  onClick={close}
                  className="block px-6 py-4"
                >
                  <span className="bobo-eyebrow">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

        {!drilled ? (
          <div className="flex flex-col gap-3 px-6 py-8">
            <Link href="/account" onClick={close} className="bobo-link text-sm">
              Mon compte
            </Link>
            <Link href="/wishlist" onClick={close} className="bobo-link text-sm">
              Liste de souhaits
            </Link>
            <Link href="/engagements" onClick={close} className="bobo-link text-sm">
              Nos engagements
            </Link>
          </div>
        ) : null}
      </nav>
    </Drawer>
  );
}
