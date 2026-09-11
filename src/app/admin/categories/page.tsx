import { listAdminCategories } from '@/services/admin';

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();
  const byId = new Map(categories.map((category) => [category.id, category]));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-soft">
        L&apos;arborescence alimente les URLs (<code>/femme/robes</code>) et le menu. Elle se
        modifie directement en base ou via le script de seed.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-2xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Catégorie</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Slug</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Parent</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Public</th>
              <th scope="col" className="bobo-eyebrow pb-3 font-normal text-ink-muted">Ordre</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-4">{category.name}</td>
                <td className="py-2.5 pr-4 font-mono text-xs text-ink-soft">{category.slug}</td>
                <td className="py-2.5 pr-4 text-ink-soft">
                  {category.parent_id ? (byId.get(category.parent_id)?.name ?? '—') : '—'}
                </td>
                <td className="py-2.5 pr-4 text-ink-soft">{category.audience ?? '—'}</td>
                <td className="py-2.5 tabular-nums">{category.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
