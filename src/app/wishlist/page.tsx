import type { Metadata } from 'next';

import { WishlistView } from '@/features/wishlist/wishlist-view';

export const metadata: Metadata = {
  title: 'Liste de souhaits',
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return (
    <div className="bobo-container pb-section pt-12 lg:pt-16">
      <header className="mb-10 flex flex-col gap-3">
        <h1 className="bobo-display text-display-lg">Liste de souhaits</h1>
        <p className="max-w-xl text-ink-soft">
          Vos pièces enregistrées. Connectez-vous pour les retrouver sur tous vos appareils.
        </p>
      </header>

      <WishlistView />
    </div>
  );
}
