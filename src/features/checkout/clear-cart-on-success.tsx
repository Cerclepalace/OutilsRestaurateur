'use client';

import { useEffect, useRef } from 'react';

import { useStore } from '@/features/cart/store-provider';

/**
 * Empties the basket once, after a confirmed order.
 *
 * Deliberately runs on the confirmation page rather than at checkout: if a
 * shopper abandons the payment page, their basket is still there when they come
 * back.
 */
export function ClearCartOnSuccess() {
  const { clearCart } = useStore();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    clearCart();
  }, [clearCart]);

  return null;
}
