import Link from 'next/link';

/** Used wherever a list can legitimately be empty. Never a dead end. */
export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <h2 className="bobo-display text-display-sm">{title}</h2>
      {body ? <p className="max-w-sm text-ink-soft">{body}</p> : null}
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="bobo-btn bobo-btn-outline mt-2">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
