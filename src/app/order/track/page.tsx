import type { Metadata } from 'next';

import { lookupOrder } from '@/services/orders';
import { OrderSummary } from '@/features/account/order-summary';

export const metadata: Metadata = {
  title: 'Suivre ma commande',
  robots: { index: false, follow: false },
};

/**
 * Guest order lookup.
 *
 * A plain server-rendered form: the order number alone is not enough, the
 * e-mail it was placed with is required too. Both are checked inside the
 * database function, so a wrong pair reveals nothing.
 */
export default async function TrackOrderPage(props: PageProps<'/order/track'>) {
  const params = await props.searchParams;
  const orderNumber = typeof params.order === 'string' ? params.order.trim() : '';
  const email = typeof params.email === 'string' ? params.email.trim() : '';

  const searched = orderNumber !== '' && email !== '';
  const order = searched ? await lookupOrder(orderNumber, email) : null;

  return (
    <div className="bobo-container-tight pb-section pt-12 lg:pt-16">
      <header className="mb-10 flex flex-col gap-3">
        <h1 className="bobo-display text-display-lg">Suivre ma commande</h1>
        <p className="text-ink-soft">
          Renseignez votre numéro de commande et l&apos;adresse e-mail utilisée lors de l&apos;achat.
        </p>
      </header>

      <form method="get" className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="bobo-label">Numéro de commande</span>
          <input
            name="order"
            defaultValue={orderNumber}
            placeholder="BP-001000"
            required
            className="bobo-field"
          />
        </label>

        <label className="flex-1">
          <span className="bobo-label">E-mail</span>
          <input
            name="email"
            type="email"
            defaultValue={email}
            autoComplete="email"
            required
            className="bobo-field"
          />
        </label>

        <button type="submit" className="bobo-btn bobo-btn-primary shrink-0">
          Rechercher
        </button>
      </form>

      {searched ? (
        <div className="mt-12">
          {order ? (
            <OrderSummary order={order} />
          ) : (
            <p className="border border-line bg-paper-deep px-4 py-3 text-sm" role="status">
              Aucune commande ne correspond à ce numéro et à cette adresse e-mail.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
