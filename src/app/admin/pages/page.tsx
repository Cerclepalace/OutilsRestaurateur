import Link from 'next/link';

import { listAdminPages } from '@/services/admin';

export default async function AdminPagesPage() {
  const pages = await listAdminPages();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft">
        Chaque page éditoriale est une suite de sections typées. Les contenus se modifient dans la
        table <code>page_sections</code> ou via le script de seed.
      </p>

      <ul className="divide-y divide-line border-y border-line">
        {pages.map((page) => (
          <li key={page.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm">{page.title}</p>
              <p className="mt-0.5 font-mono text-xs text-ink-muted">/{page.slug}</p>
            </div>

            <div className="flex items-center gap-5 text-xs text-ink-soft">
              <span>{(page.page_sections ?? []).length} section(s)</span>
              <span>{page.is_published ? 'Publiée' : 'Brouillon'}</span>
              <Link
                href={page.slug === 'home' ? '/' : `/${page.slug}`}
                className="bobo-link text-ink"
              >
                Voir
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
