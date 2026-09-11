'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';

import { createClient } from '@/lib/supabase/client';
import { cartStore } from '@/features/cart/store';
import type { CartItemInput, PricedCart, WishlistEntry } from '@/types/cart';

/**
 * Client store for cart, wishlist and the overlay UI.
 *
 * The browser holds *intent* only — which variant, how many. Prices and
 * availability always come back from the server (`/api/cart/price`), so the
 * totals a shopper sees are the totals the database will charge.
 *
 * Guests persist to localStorage (see ./store). On sign-in, both lists are
 * merged into the customer's server-side records.
 */

type Overlay = 'cart' | 'search' | 'menu' | null;

interface StoreValue {
  items: CartItemInput[];
  cart: PricedCart | null;
  isPricing: boolean;
  addItem: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;

  discountCode: string | null;
  applyDiscount: (code: string | null) => void;

  wishlist: WishlistEntry[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (entry: WishlistEntry) => void;

  overlay: Overlay;
  openOverlay: (overlay: Exclude<Overlay, null>) => void;
  closeOverlay: () => void;

  isAuthenticated: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const persisted = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );

  // Only ever set from a server response. An empty basket is derived below
  // rather than written here, so the effect never sets state synchronously.
  const [pricedCart, setPricedCart] = useState<PricedCart | null>(null);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPricing, startPricing] = useTransition();

  const { items, wishlist } = persisted;

  // --- Server pricing -------------------------------------------------------
  const requestId = useRef(0);

  const repriceCart = useCallback((nextItems: CartItemInput[], code: string | null) => {
    // Nothing to price: the derived `cart` below is already null.
    if (nextItems.length === 0) return;

    const id = ++requestId.current;

    startPricing(async () => {
      try {
        const response = await fetch('/api/cart/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: nextItems, discountCode: code }),
        });
        if (!response.ok) return;

        const priced = (await response.json()) as PricedCart;
        // Ignore a stale response that lost the race with a newer edit.
        if (id !== requestId.current) return;

        setPricedCart(priced);

        // The server is the authority on availability: if it capped a line or
        // dropped a delisted product, mirror that back into local state.
        const reconciled = priced.lines.map((line) => ({
          variant_id: line.variant_id,
          quantity: line.quantity,
        }));
        const changed =
          reconciled.length !== nextItems.length ||
          reconciled.some((line, index) => {
            const previous = nextItems[index];
            return previous?.variant_id !== line.variant_id || previous?.quantity !== line.quantity;
          });
        if (changed) cartStore.setItems(reconciled);
      } catch {
        // Network hiccup: keep the last known good cart on screen.
      }
    });
  }, []);

  useEffect(() => {
    repriceCart(items, discountCode);
  }, [items, discountCode, repriceCart]);

  // --- Auth -----------------------------------------------------------------
  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => setIsAuthenticated(Boolean(data.user)));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(Boolean(session?.user));

      if (event !== 'SIGNED_IN') return;

      // Hand the guest lists to the server; the merge is idempotent, so a retry
      // after a dropped connection cannot duplicate a line.
      const local = cartStore.read();
      if (local.items.length === 0 && local.wishlist.length === 0) return;

      void fetch('/api/account/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: local.items, wishlist: local.wishlist }),
      }).catch(() => undefined);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // --- Cart actions ---------------------------------------------------------
  const addItem = useCallback((variantId: string, quantity = 1) => {
    const current = cartStore.read().items;
    const existing = current.find((item) => item.variant_id === variantId);

    cartStore.setItems(
      existing
        ? current.map((item) =>
            item.variant_id === variantId ? { ...item, quantity: item.quantity + quantity } : item,
          )
        : [...current, { variant_id: variantId, quantity }],
    );

    setOverlay('cart');
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    const current = cartStore.read().items;
    cartStore.setItems(
      quantity <= 0
        ? current.filter((item) => item.variant_id !== variantId)
        : current.map((item) => (item.variant_id === variantId ? { ...item, quantity } : item)),
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    cartStore.setItems(cartStore.read().items.filter((item) => item.variant_id !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    cartStore.setItems([]);
    setDiscountCode(null);
  }, []);

  // --- Wishlist -------------------------------------------------------------
  const isWishlisted = useCallback(
    (productId: string) => wishlist.some((entry) => entry.product_id === productId),
    [wishlist],
  );

  const toggleWishlist = useCallback((entry: WishlistEntry) => {
    const current = cartStore.read().wishlist;
    const exists = current.some((item) => item.product_id === entry.product_id);

    cartStore.setWishlist(
      exists ? current.filter((item) => item.product_id !== entry.product_id) : [...current, entry],
    );

    // Mirrored to the server for signed-in customers; a no-op for guests.
    void fetch('/api/wishlist', {
      method: exists ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => undefined);
  }, []);

  const closeOverlay = useCallback(() => setOverlay(null), []);

  // An empty basket has no totals, and a stale priced cart must never outlive
  // the last line being removed.
  const cart = items.length === 0 ? null : pricedCart;

  const value = useMemo<StoreValue>(
    () => ({
      items,
      cart,
      isPricing,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      discountCode,
      applyDiscount: setDiscountCode,
      wishlist,
      isWishlisted,
      toggleWishlist,
      overlay,
      openOverlay: setOverlay,
      closeOverlay,
      isAuthenticated,
    }),
    [
      items,
      cart,
      isPricing,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      discountCode,
      wishlist,
      isWishlisted,
      toggleWishlist,
      overlay,
      closeOverlay,
      isAuthenticated,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used inside <StoreProvider>');
  }
  return context;
}

/** Total units in the cart, for the header badge. */
export function useCartCount() {
  const { items } = useStore();
  return items.reduce((total, item) => total + item.quantity, 0);
}
