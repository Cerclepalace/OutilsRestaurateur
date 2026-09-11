import type { Metadata } from 'next';

import { CartPageView } from '@/features/cart/cart-page-view';

export const metadata: Metadata = {
  title: 'Panier',
  robots: { index: false, follow: false },
};

export default async function CartPage(props: PageProps<'/cart'>) {
  const params = await props.searchParams;
  const cancelled = typeof params.cancelled === 'string' ? params.cancelled : undefined;

  return (
    <div className="bobo-container pb-section pt-12 lg:pt-16">
      <h1 className="bobo-display mb-10 text-display-lg">Panier</h1>
      <CartPageView cancelledOrder={cancelled} />
    </div>
  );
}
