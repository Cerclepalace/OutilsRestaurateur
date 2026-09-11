'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';
import { useFocusTrap } from '@/hooks/use-focus-trap';

/**
 * Side panel used by the cart and the mobile menu.
 *
 * Full-height, square-edged, sliding in over a soft scrim. Escape closes it,
 * focus is trapped while open, and the page behind cannot scroll.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  children,
  footer,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
  footer?: React.ReactNode;
  labelledBy?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={cn('fixed inset-0 z-50', !open && 'pointer-events-none')}
      aria-hidden={!open}
      data-state={open ? 'open' : 'closed'}
    >
      <button
        type="button"
        aria-label="Fermer"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={cn(
          'absolute inset-0 cursor-default bg-ink/25 transition-opacity duration-500',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 flex w-full max-w-[27rem] flex-col bg-paper',
          'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          side === 'right' ? 'right-0' : 'left-0',
          open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="bobo-eyebrow">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-m-2 p-2 text-ink-soft transition-colors hover:text-ink"
            aria-label="Fermer le panneau"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {footer ? <div className="border-t border-line px-6 py-5">{footer}</div> : null}
      </div>
    </div>
  );
}
