'use client';

import { useEffect, useState } from 'react';

import { ProductGrid } from '@/features/catalog/product-grid';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useStore } from '@/features/cart/store-provider';
import type { ProductCard } from '@/types/catalog';

/**
 * Wishlist.
 *
 * The list itself lives in the client store (server-backed once signed in,
 * localStorage for guests); the product cards are hydrated from the catalogue
 * so prices and availability are never stale.
 */
export function WishlistView() {
  const { wishlist } = useStore();
  const [fetched, setFetched] = useState<ProductCard[] | null>(null);

  const ids = wishlist.map((entry) => entry.product_id);
  const key = ids.join(',');

  useEffect(() => {
    if (key === '') return;

    let cancelled = false;
    void fetch('/api/wishlist/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: key.split(',') }),
    })
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data: { items: ProductCard[] }) => {
        if (!cancelled) setFetched(data.items);
      })
      .catch(() => {
        if (!cancelled) setFetched([]);
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  // An empty list needs no request: the answer is derived, not fetched.
  const items = key === '' ? [] : fetched;

  if (items === null) return <ProductGridSkeleton count={4} />;

  if (items.length === 0) {
    return (
      <EmptyState
        title="Votre liste est vide"
        body="Enregistrez les pièces qui vous plaisent pour les retrouver ici, sur tous vos appareils une fois connecté."
        actionLabel="Découvrir la boutique"
        actionHref="/boutique"
      />
    );
  }

  return <ProductGrid products={items} priorityCount={2} />;
}
