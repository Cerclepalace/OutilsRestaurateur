import Image from 'next/image';
import Link from 'next/link';

import { formatPrice, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Order, OrderItem, OrderStatus } from '@/types/catalog';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente de paiement',
  paid: 'Payée',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

/** One order, with its lines and totals. Shared by the account and the guest lookup. */
export function OrderSummary({
  order,
}: {
  order: Order & { order_items?: OrderItem[]; items?: OrderItem[] };
}) {
  const items = order.order_items ?? order.items ?? [];
  const address = order.shipping_address as Record<string, string> | null;

  return (
    <article className="border border-line">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <p className="bobo-eyebrow">{order.order_number}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {formatDate(order.placed_at ?? order.created_at)}
          </p>
        </div>

        <span
          className={cn(
            'bobo-eyebrow px-2.5 py-1',
            order.status === 'cancelled' || order.status === 'refunded'
              ? 'bg-paper-warm text-ink-soft'
              : 'bg-ink text-paper',
          )}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </header>

      <ul className="divide-y divide-line px-6">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 py-4">
            <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-paper-deep">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.product_name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              {item.slug ? (
                <Link href={`/product/${item.slug}`} className="bobo-link text-sm">
                  {item.product_name}
                </Link>
              ) : (
                <p className="text-sm">{item.product_name}</p>
              )}
              {item.variant_label ? (
                <p className="mt-0.5 text-xs text-ink-muted">{item.variant_label}</p>
              ) : null}
              <p className="mt-0.5 text-xs text-ink-muted">Quantité {item.quantity}</p>
            </div>

            <p className="text-sm tabular-nums">{formatPrice(item.total_cents, order.currency)}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 border-t border-line px-6 py-5 sm:grid-cols-2">
        {address ? (
          <div>
            <p className="bobo-eyebrow mb-2 text-ink-muted">Livraison</p>
            <address className="text-sm not-italic leading-relaxed text-ink-soft">
              {address.first_name} {address.last_name}
              <br />
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {address.postal_code} {address.city}
              <br />
              {address.country_code}
            </address>
          </div>
        ) : null}

        <dl className="flex flex-col gap-1.5 text-sm sm:text-right">
          <div className="flex justify-between sm:justify-end sm:gap-8">
            <dt className="text-ink-soft">Sous-total</dt>
            <dd className="tabular-nums">{formatPrice(order.subtotal_cents, order.currency)}</dd>
          </div>
          {order.discount_cents > 0 ? (
            <div className="flex justify-between text-clay sm:justify-end sm:gap-8">
              <dt>Remise</dt>
              <dd className="tabular-nums">−{formatPrice(order.discount_cents, order.currency)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between sm:justify-end sm:gap-8">
            <dt className="text-ink-soft">Livraison</dt>
            <dd className="tabular-nums">
              {order.shipping_cents === 0
                ? 'Offerte'
                : formatPrice(order.shipping_cents, order.currency)}
            </dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-line pt-2 sm:justify-end sm:gap-8">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.total_cents, order.currency)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
