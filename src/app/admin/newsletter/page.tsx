import { listNewsletter } from '@/services/admin';
import { formatDate } from '@/lib/format';

export default async function AdminNewsletterPage() {
  const subscribers = await listNewsletter();
  const active = subscribers.filter((subscriber) => !subscriber.unsubscribed_at);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-ink-muted">
        {active.length} inscrit(s) actif(s) sur {subscribers.length}
      </p>

      {subscribers.length === 0 ? (
        <p className="border border-line px-4 py-10 text-center text-sm text-ink-soft">
          Aucune inscription.
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {subscribers.map((subscriber) => (
            <li key={subscriber.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span>{subscriber.email}</span>
              <span className="flex items-center gap-5 text-xs text-ink-muted">
                <span>{subscriber.source ?? '—'}</span>
                <span>{formatDate(subscriber.created_at)}</span>
                {subscriber.unsubscribed_at ? <span className="text-danger">désinscrit</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
