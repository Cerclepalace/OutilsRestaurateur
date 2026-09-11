import Link from 'next/link';
import type { Metadata } from 'next';
import { Check } from 'lucide-react';

import { ClearCartOnSuccess } from '@/features/checkout/clear-cart-on-success';
import { getMyOrder } from '@/services/orders';
import { getCurrentUser } from '@/services/account';
import { OrderSummary } from '@/features/account/order-summary';

export const metadata: Metadata = {
  title: 'Commande confirmée',
  robots: { index: false, follow: false },
};

export default async function OrderSuccessPage(props: PageProps<'/order/success'>) {
  const params = await props.searchParams;
  const orderNumber = typeof params.order === 'string' ? params.order : null;

  // A signed-in customer sees the full order straight away; a guest gets the
  // confirmation and the tracking link, because we will not expose an order to
  // anyone holding only its number.
  const user = await getCurrentUser();
  const order = user && orderNumber ? await getMyOrder(orderNumber) : null;

  return (
    <div className="bobo-container-tight pb-section pt-16 lg:pt-24">
      <ClearCartOnSuccess />

      <div className="flex flex-col items-center gap-5 text-center">
        <span className="grid size-12 place-items-center rounded-full border border-ink">
          <Check className="size-5" aria-hidden />
        </span>

        <h1 className="bobo-display text-display-md">Merci pour votre commande</h1>

        {orderNumber ? (
          <p className="text-ink-soft">
            Votre commande <strong className="font-medium text-ink">{orderNumber}</strong> est
            confirmée. Un e-mail de confirmation vous a été envoyé.
          </p>
        ) : (
          <p className="text-ink-soft">Votre commande est confirmée.</p>
        )}

        <p className="max-w-prose text-sm text-ink-soft">
          Chaque pièce est préparée à la main dans notre atelier parisien. Comptez 1 à 2 jours
          ouvrés avant l&apos;expédition.
        </p>
      </div>

      {order ? (
        <div className="mt-14">
          <OrderSummary order={order} />
        </div>
      ) : null}

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href="/boutique" className="bobo-btn bobo-btn-outline">
          Continuer mes achats
        </Link>
        <Link href="/order/track" className="bobo-btn bobo-btn-ghost">
          Suivre ma commande
        </Link>
      </div>
    </div>
  );
}
