'use client';

import { useId, useState } from 'react';
import { Plus, Minus } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Disclosure used on the product page.
 *
 * Built on a button + region rather than <details> so the open/close can be
 * animated and the state can be controlled from outside if needed.
 */
export function Accordion({
  title,
  children,
  defaultOpen = false,
  className,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={cn('border-b border-line', className)}>
      <h3>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-4 py-4 text-left"
        >
          <span className="bobo-eyebrow">{title}</span>
          {open ? (
            <Minus className="size-4 shrink-0" aria-hidden />
          ) : (
            <Plus className="size-4 shrink-0" aria-hidden />
          )}
        </button>
      </h3>

      <div
        id={panelId}
        hidden={!open}
        className="animate-fade-in pb-5 text-sm leading-relaxed text-ink-soft"
      >
        {children}
      </div>
    </div>
  );
}
