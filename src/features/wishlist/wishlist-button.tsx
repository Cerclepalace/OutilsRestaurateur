'use client';

import { Heart } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useStore } from '@/features/cart/store-provider';

/**
 * Save-to-wishlist toggle.
 *
 * Optimistic: the heart fills immediately and the store handles persistence —
 * server-side for signed-in customers, localStorage for guests.
 */
export function WishlistButton({
  productId,
  variantId = null,
  productName,
  className,
  size = 'md',
}: {
  productId: string;
  variantId?: string | null;
  productName: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const { isWishlisted, toggleWishlist } = useStore();
  const saved = isWishlisted(productId);

  return (
    <button
      type="button"
      onClick={(event) => {
        // Cards wrap the whole tile in a link; do not follow it.
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist({ product_id: productId, variant_id: variantId });
      }}
      aria-pressed={saved}
      aria-label={
        saved
          ? `Retirer ${productName} de la liste de souhaits`
          : `Ajouter ${productName} à la liste de souhaits`
      }
      className={cn(
        'grid place-items-center transition-transform duration-300 hover:scale-110',
        size === 'sm' ? 'size-8' : 'size-10',
        className,
      )}
    >
      <Heart
        className={cn(
          size === 'sm' ? 'size-4' : 'size-5',
          'transition-colors duration-300',
          saved ? 'fill-ink stroke-ink' : 'fill-transparent',
        )}
        aria-hidden
      />
    </button>
  );
}
