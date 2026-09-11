import { notFound } from 'next/navigation';

import { getAdminOrder } from '@/services/admin';
import { OrderSummary } from '@/features/account/order-summary';
import { updateOrderStatus } from '@/features/admin/actions';
import { formatDateTime } from '@/lib/format';

const STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

export default async function AdminOrderPage(props: PageProps<'/admin/orders/[id]'>) {
  const { id } = await props.params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="bobo-display text-display-sm">{order.order_number}</h2>

        <form action={updateOrderStatus} className="flex items-end gap-3">
          <input type="hidden" name="id" value={order.id} />
          <label>
            <span className="bobo-label">Statut</span>
            <select name="status" defaultValue={order.status} className="bobo-field w-44">
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="bobo-btn bobo-btn-outline">
            Mettre à jour
          </button>
        </form>
      </div>

      <OrderSummary order={order} />

      <section>
        <h3 className="bobo-eyebrow mb-3 text-ink-muted">Paiement</h3>
        {(order.payments ?? []).length === 0 ? (
          <p className="text-sm text-ink-soft">Aucun paiement enregistré.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line text-sm">
            {(order.payments ?? []).map((payment) => (
              <li key={payment.id} className="flex flex-wrap justify-between gap-3 py-3">
                <span>
                  {payment.provider} · {payment.status}
                </span>
                <span className="font-mono text-xs text-ink-muted">
                  {payment.provider_reference ?? '—'}
                </span>
                <span className="text-ink-muted">{formatDateTime(payment.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {order.customer_note ? (
        <section>
          <h3 className="bobo-eyebrow mb-2 text-ink-muted">Note du client</h3>
          <p className="text-sm leading-relaxed text-ink-soft">{order.customer_note}</p>
        </section>
      ) : null}
    </div>
  );
}
