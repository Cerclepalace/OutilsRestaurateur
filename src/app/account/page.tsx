import Link from 'next/link';
import type { Metadata } from 'next';

import { getMyOrders } from '@/services/orders';
import { getAddresses, getProfile } from '@/services/account';
import { OrderSummary } from '@/features/account/order-summary';

export const metadata: Metadata = {
  title: 'Mon compte',
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const [profile, orders, addresses] = await Promise.all([
    getProfile(),
    getMyOrders(),
    getAddresses(),
  ]);

  if (!profile) return null;

  const latest = orders[0];

  return (
    <div className="flex flex-col gap-12">
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Commandes" value={String(orders.length)} href="/account/orders" />
        <Stat label="Adresses" value={String(addresses.length)} href="/account/addresses" />
        <Stat
          label="Newsletter"
          value={profile.accepts_marketing ? 'Inscrit' : 'Non inscrit'}
          href="/account/profile"
        />
      </section>

      <section>
        <h2 className="bobo-eyebrow mb-5 text-ink-muted">Dernière commande</h2>
        {latest ? (
          <OrderSummary order={latest} />
        ) : (
          <p className="border border-line px-5 py-8 text-center text-sm text-ink-soft">
            Vous n&apos;avez pas encore commandé.{' '}
            <Link href="/boutique" className="bobo-link bobo-link-static text-ink">
              Découvrir la boutique
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="border border-line p-5 transition-colors hover:border-ink">
      <p className="bobo-eyebrow text-ink-muted">{label}</p>
      <p className="bobo-display mt-2 text-display-sm">{value}</p>
    </Link>
  );
}
