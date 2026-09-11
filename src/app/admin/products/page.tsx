import Link from 'next/link';

import { listAdminProducts } from '@/services/admin';
import { formatPrice } from '@/lib/format';
import { setProductStatus, archiveProduct } from '@/features/admin/actions';

export default async function AdminProductsPage(props: PageProps<'/admin/products'>) {
  const params = await props.searchParams;
  const search = typeof params.q === 'string' ? params.q : undefined;
  const products = await listAdminProducts(search);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <form method="get" className="flex items-end gap-3">
          <label>
            <span className="bobo-label">Rechercher</span>
            <input name="q" defaultValue={search ?? ''} className="bobo-field w-56" />
          </label>
          <button type="submit" className="bobo-btn bobo-btn-ghost">
            Filtrer
          </button>
        </form>

        <Link href="/admin/products/new" className="bobo-btn bobo-btn-primary">
          Nouveau produit
        </Link>
      </div>

      <p className="text-xs text-ink-muted">{products.length} produit(s)</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-3xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Produit</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Catégorie</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Prix</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Stock</th>
              <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Statut</th>
              <th scope="col" className="bobo-eyebrow pb-3 font-normal text-ink-muted">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const stock = (product.product_variants ?? []).reduce((total, variant) => {
                const inventory = Array.isArray(variant.inventory)
                  ? variant.inventory[0]
                  : variant.inventory;
                return total + Math.max((inventory?.quantity ?? 0) - (inventory?.reserved ?? 0), 0);
              }, 0);

              const category = Array.isArray(product.categories)
                ? product.categories[0]
                : product.categories;

              return (
                <tr key={product.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/products/${product.id}`} className="bobo-link">
                      {product.name}
                    </Link>
                    <span className="ml-2 text-xs text-ink-muted">{product.audience}</span>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{category?.name ?? '—'}</td>
                  <td className="py-3 pr-4 tabular-nums">
                    {formatPrice(product.base_price_cents)}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">
                    <span className={stock === 0 ? 'text-danger' : undefined}>{stock}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <form action={setProductStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={product.id} />
                      <select
                        name="status"
                        defaultValue={product.status}
                        className="border border-line bg-transparent px-2 py-1 text-xs"
                      >
                        <option value="draft">Brouillon</option>
                        <option value="active">Publié</option>
                        <option value="archived">Archivé</option>
                      </select>
                      <button type="submit" className="text-xs text-ink-soft hover:text-ink">
                        OK
                      </button>
                    </form>
                  </td>
                  <td className="py-3">
                    <form action={archiveProduct}>
                      <input type="hidden" name="id" value={product.id} />
                      <button type="submit" className="text-xs text-ink-soft hover:text-danger">
                        Retirer
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
