import Link from 'next/link';

import { listAdminOrders } from '@/services/admin';
import { formatPrice, formatDateTime } from '@/lib/format';

const STATUSES = [
  ['', 'Toutes'],
  ['pending', 'En attente'],
  ['paid', 'Payées'],
  ['processing', 'En préparation'],
  ['shipped', 'Expédiées'],
  ['delivered', 'Livrées'],
  ['cancelled', 'Annulées'],
] as const;

export default async function AdminOrdersPage(props: PageProps<'/admin/orders'>) {
  const params = await props.searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const orders = await listAdminOrders(status);

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-4">
        {STATUSES.map(([value, label]) => (
          <Link
            key={value || 'all'}
            href={value ? `/admin/orders?status=${value}` : '/admin/orders'}
            aria-current={(status ?? '') === value ? 'page' : undefined}
            className={`bobo-eyebrow transition-colors ${
              (status ?? '') === value ? 'text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <p className="text-xs text-ink-muted">{orders.length} commande(s)</p>

      {orders.length === 0 ? (
        <p className="border border-line px-4 py-10 text-center text-sm text-ink-soft">
          Aucune commande.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-2xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Numéro</th>
                <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Client</th>
                <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Pièces</th>
                <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Statut</th>
                <th scope="col" className="bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted">Total</th>
                <th scope="col" className="bobo-eyebrow pb-3 font-normal text-ink-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/orders/${order.id}`} className="bobo-link">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{order.email}</td>
                  <td className="py-3 pr-4 tabular-nums">
                    {(order.order_items ?? []).reduce((n, item) => n + item.quantity, 0)}
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{order.status}</td>
                  <td className="py-3 pr-4 tabular-nums">{formatPrice(order.total_cents)}</td>
                  <td className="py-3 text-ink-muted">{formatDateTime(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
