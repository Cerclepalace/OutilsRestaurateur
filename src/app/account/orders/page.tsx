import Link from 'next/link';
import type { Metadata } from 'next';

import { getMyOrders } from '@/services/orders';
import { OrderSummary } from '@/features/account/order-summary';

export const metadata: Metadata = {
  title: 'Mes commandes',
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <p className="border border-line px-5 py-12 text-center text-sm text-ink-soft">
        Aucune commande pour le moment.{' '}
        <Link href="/boutique" className="bobo-link bobo-link-static text-ink">
          Découvrir la boutique
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {orders.map((order) => (
        <OrderSummary key={order.id} order={order} />
      ))}
    </div>
  );
}
