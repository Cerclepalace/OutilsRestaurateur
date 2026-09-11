import Link from 'next/link';

import { listInventory } from '@/services/admin';

export default async function AdminInventoryPage(props: PageProps<'/admin/inventory'>) {
  const params = await props.searchParams;
  const lowOnly = params.low === '1';
  const rows = await listInventory(lowOnly);

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex gap-5">
        <Link
          href="/admin/inventory"
          aria-current={!lowOnly ? 'page' : undefined}
          className={`bobo-eyebrow ${!lowOnly ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}
        >
          Tout le stock
        </Link>
        <Link
          href="/admin/inventory?low=1"
          aria-current={lowOnly ? 'page' : undefined}
          className={`bobo-eyebrow ${lowOnly ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}
        >
          Stock faible
        </Link>
      </nav>

      <p className="text-xs text-ink-muted">
        {rows.length} déclinaison(s). Le stock se corrige depuis la fiche produit.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-3xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">SKU</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Produit</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Déclinaison</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">En stock</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Réservé</th>
              <th scope="col" className="bobo-eyebrow pb-3 font-normal text-ink-muted">Disponible</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const product = Array.isArray(row.products) ? row.products[0] : row.products;
              const inventory = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
              const available = Math.max(
                (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0),
                0,
              );
              const low = inventory
                ? available <= inventory.low_stock_threshold && inventory.track_inventory
                : false;

              return (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="py-2.5 pr-4 font-mono text-xs">{row.sku}</td>
                  <td className="py-2.5 pr-4">{product?.name ?? '—'}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">
                    {[row.size, row.color_name].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums">{inventory?.quantity ?? 0}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{inventory?.reserved ?? 0}</td>
                  <td className={`py-2.5 tabular-nums ${low ? 'text-clay' : ''}`}>{available}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="border border-line px-4 py-10 text-center text-sm text-ink-soft">
          {lowOnly ? 'Aucune alerte de stock.' : 'Aucune déclinaison.'}
        </p>
      ) : null}
    </div>
  );
}
