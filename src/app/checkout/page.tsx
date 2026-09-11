import type { Metadata } from 'next';

import { CheckoutView } from '@/features/checkout/checkout-view';
import { getShippingMethods } from '@/services/settings';
import { isStripeConfigured } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Paiement',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const shippingMethods = await getShippingMethods();

  return (
    <div className="bobo-container pb-section pt-12 lg:pt-16">
      <h1 className="bobo-display mb-10 text-display-lg">Paiement</h1>
      <CheckoutView shippingMethods={shippingMethods} paymentEnabled={isStripeConfigured} />
    </div>
  );
}
