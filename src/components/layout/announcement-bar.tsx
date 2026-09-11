'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

import type { Announcement } from '@/services/settings';

const DISMISS_KEY = 'bobo.announcement.dismissed';

/**
 * Thin promotional strip. Dismissible, and the choice is remembered per
 * message — changing the copy brings the bar back for everyone.
 *
 * The stored value is read through `useSyncExternalStore` so the server and the
 * first client render agree (nothing dismissed) without an effect that sets
 * state on mount.
 */
export function AnnouncementBar({ announcement }: { announcement: Announcement }) {
  const [dismissedNow, setDismissedNow] = useState<string | null>(null);

  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const dismissed = (dismissedNow ?? stored) === announcement.message;

  const dismiss = useCallback(() => {
    setDismissedNow(announcement.message);
    try {
      window.localStorage.setItem(DISMISS_KEY, announcement.message);
    } catch {
      // Storage blocked: the bar simply returns on the next visit.
    }
  }, [announcement.message]);

  if (dismissed) return null;

  const content = <span className="bobo-eyebrow block text-center">{announcement.message}</span>;

  return (
    <div className="relative bg-ink text-paper">
      <div className="bobo-container flex min-h-9 items-center justify-center py-2 pr-8">
        {announcement.href ? (
          <Link href={announcement.href} className="bobo-link">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-70 transition-opacity hover:opacity-100"
        aria-label="Masquer l'annonce"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

/** The value never changes except through this component, so nothing to watch. */
function subscribe() {
  return () => undefined;
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}
