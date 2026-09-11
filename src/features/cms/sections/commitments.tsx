import { getCommitments } from '@/services/settings';
import type { CommitmentsContent } from '@/services/cms';

/**
 * The five brand commitments. Items come from the `commitments` setting unless
 * the section overrides them, so the same list can be edited in one place and
 * appear on several pages.
 */
export async function CommitmentsSection({ content }: { content: CommitmentsContent }) {
  const items = content.items.length > 0 ? content.items : await getCommitments();
  if (items.length === 0) return null;

  return (
    <section className="border-y border-line py-section-sm">
      <div className="bobo-container">
        {content.title ? (
          <h2 className="bobo-eyebrow mb-9 text-ink-muted">{content.title}</h2>
        ) : null}

        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {items.map((item) => (
            <li key={item.title} className="flex flex-col gap-2 border-t border-line pt-4">
              <h3 className="bobo-eyebrow">{item.title}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
