import Link from 'next/link';

import { getDashboard } from '@/services/admin';
import { formatPrice, formatDate } from '@/lib/format';

export default async function AdminDashboard() {
  const stats = await getDashboard();

  if (!stats) {
    return <p className="text-sm text-ink-soft">Les statistiques ne sont pas disponibles.</p>;
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Chiffre d'affaires" value={formatPrice(stats.revenue_cents)} />
        <Stat label="CA 30 jours" value={formatPrice(stats.revenue_30d_cents)} />
        <Stat label="Commandes" value={String(stats.orders_count)} href="/admin/orders" />
        <Stat label="Clients" value={String(stats.customers_count)} href="/admin/customers" />
        <Stat label="Produits publiés" value={String(stats.products_active)} href="/admin/products" />
        <Stat label="Brouillons" value={String(stats.products_draft)} href="/admin/products" />
        <Stat
          label="Paiements en attente"
          value={String(stats.orders_pending)}
          href="/admin/orders"
        />
        <Stat label="Newsletter" value={String(stats.newsletter_count)} href="/admin/newsletter" />
      </section>

      <section>
        <h2 className="bobo-eyebrow mb-4 text-ink-muted">Dernières commandes</h2>
        {stats.recent_orders.length === 0 ? (
          <p className="border border-line px-4 py-8 text-center text-sm text-ink-soft">
            Aucune commande.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-xl border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <Th>Commande</Th>
                  <Th>Client</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map((order) => (
                  <tr key={order.id} className="border-b border-line last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/orders/${order.id}`} className="bobo-link">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">{order.email}</td>
                    <td className="py-3 pr-4 text-ink-soft">{order.status}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatPrice(order.total_cents)}
                    </td>
                    <td className="py-3 text-ink-muted">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="bobo-eyebrow mb-4 text-ink-muted">Stock faible</h2>
        {stats.low_stock.length === 0 ? (
          <p className="border border-line px-4 py-8 text-center text-sm text-ink-soft">
            Aucune alerte de stock.
          </p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {stats.low_stock.map((row) => (
              <li key={row.sku} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span>
                  {row.product}
                  <span className="ml-2 text-ink-muted">
                    {[row.size, row.color].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="tabular-nums text-clay">{row.available} restant(s)</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <p className="bobo-eyebrow text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl tabular-nums">{value}</p>
    </>
  );

  return href ? (
    <Link href={href} className="border border-line p-5 transition-colors hover:border-ink">
      {content}
    </Link>
  ) : (
    <div className="border border-line p-5">{content}</div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={`bobo-eyebrow pb-3 pr-4 font-normal text-ink-muted ${className ?? ''}`}>
      {children}
    </th>
  );
}
