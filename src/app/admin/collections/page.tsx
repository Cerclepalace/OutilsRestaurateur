import Link from 'next/link';

import { listAdminCollections } from '@/services/admin';

export default async function AdminCollectionsPage() {
  const collections = await listAdminCollections();

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-ink-muted">{collections.length} collection(s)</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-2xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Collection</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Slug</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Pièces</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Publiée</th>
              <th scope="col" className="bobo-eyebrow pb-3 font-normal text-ink-muted">À la une</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection) => (
              <tr key={collection.id} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-4">
                  <Link href={`/collections/${collection.slug}`} className="bobo-link">
                    {collection.title}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 font-mono text-xs text-ink-soft">{collection.slug}</td>
                <td className="py-2.5 pr-4 tabular-nums">
                  {(collection.collection_products ?? []).length}
                </td>
                <td className="py-2.5 pr-4 text-ink-soft">
                  {collection.is_published ? 'Oui' : 'Non'}
                </td>
                <td className="py-2.5 text-ink-soft">{collection.is_featured ? 'Oui' : 'Non'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
