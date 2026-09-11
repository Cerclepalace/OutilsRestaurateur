/**
 * Cart and wishlist state, held outside React.
 *
 * A module-level store read through `useSyncExternalStore` rather than state
 * hydrated inside an effect: the server renders the empty snapshot, the client
 * reads localStorage on its first snapshot, and there is no cascading render
 * on mount. It also means non-React code (the auth listener) can read and write
 * the same state without a context.
 */
import type { CartItemInput, WishlistEntry } from '@/types/cart';

const CART_KEY = 'bobo.cart.v1';
const WISHLIST_KEY = 'bobo.wishlist.v1';

export interface PersistedState {
  items: CartItemInput[];
  wishlist: WishlistEntry[];
}

const EMPTY: PersistedState = { items: [], wishlist: [] };

let state: PersistedState = EMPTY;
let loaded = false;

const listeners = new Set<() => void>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Private mode, blocked storage, or corrupt JSON: start clean.
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the session still works, it just will not persist.
  }
}

/** Reads localStorage once, the first time a client snapshot is requested. */
function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  state = {
    items: read<CartItemInput[]>(CART_KEY, []),
    wishlist: read<WishlistEntry[]>(WISHLIST_KEY, []),
  };
}

function emit() {
  for (const listener of listeners) listener();
}

export const cartStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    // Another tab editing the same basket should be reflected here.
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_KEY || event.key === WISHLIST_KEY) {
        loaded = false;
        ensureLoaded();
        emit();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  },

  getSnapshot(): PersistedState {
    ensureLoaded();
    return state;
  },

  /** The server has no localStorage; both renders must agree on the empty set. */
  getServerSnapshot(): PersistedState {
    return EMPTY;
  },

  setItems(next: CartItemInput[]) {
    ensureLoaded();
    state = { ...state, items: next };
    write(CART_KEY, next);
    emit();
  },

  setWishlist(next: WishlistEntry[]) {
    ensureLoaded();
    state = { ...state, wishlist: next };
    write(WISHLIST_KEY, next);
    emit();
  },

  /** Used by the sign-in merge, which reads the guest lists before clearing them. */
  read(): PersistedState {
    ensureLoaded();
    return state;
  },
};
