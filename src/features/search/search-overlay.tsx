'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import { useStore } from '@/features/cart/store-provider';
import { useLockBodyScroll } from '@/hooks/use-lock-body-scroll';

interface Suggestions {
  products: { slug: string; name: string; price_cents: number; image_url: string | null }[];
  collections: { slug: string; title: string }[];
  categories: { slug: string; name: string }[];
}

const EMPTY: Suggestions = { products: [], collections: [], categories: [] };

/**
 * Search panel.
 *
 * Drops from the top over a scrim, autofocuses, and answers as you type. The
 * request is debounced and every in-flight response is discarded once a newer
 * keystroke lands, so results can never arrive out of order.
 */
export function SearchOverlay() {
  const router = useRouter();
  const { overlay, closeOverlay } = useStore();
  const open = overlay === 'search';

  const [query, setQuery] = useState('');
  const [fetched, setFetched] = useState<Suggestions>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useLockBodyScroll(open);

  /** Closing clears the field, so the panel always reopens on a blank search. */
  const close = useCallback(() => {
    setQuery('');
    closeOverlay();
  }, [closeOverlay]);

  useEffect(() => {
    if (!open) return;
    // Wait for the panel transition before stealing focus, or iOS scrolls oddly.
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const fetchSuggestions = useCallback(async (term: string) => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = (await response.json()) as Suggestions;
      if (id === requestId.current) setFetched(data);
    } catch {
      if (id === requestId.current) setFetched(EMPTY);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const term = query.trim();
  const searched = term.length >= 2;

  useEffect(() => {
    if (!searched) return;
    const timer = window.setTimeout(() => void fetchSuggestions(term), 220);
    return () => window.clearTimeout(timer);
  }, [term, searched, fetchSuggestions]);

  // Below two characters there is nothing to show, so the panel renders the
  // empty set rather than an effect clearing the last results.
  const results = searched ? fetched : EMPTY;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (term.length === 0) return;
    close();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  const hasResults =
    results.products.length + results.collections.length + results.categories.length > 0;

  return (
    <div className={cn('fixed inset-0 z-50', !open && 'pointer-events-none')} aria-hidden={!open}>
      <button
        type="button"
        aria-label="Fermer la recherche"
        tabIndex={open ? 0 : -1}
        onClick={close}
        className={cn(
          'absolute inset-0 cursor-default bg-ink/25 transition-opacity duration-500',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        role="dialog"
        aria-modal={open}
        aria-label="Recherche"
        className={cn(
          'absolute inset-x-0 top-0 max-h-[85vh] overflow-y-auto bg-paper',
          'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open ? 'translate-y-0' : '-translate-y-full',
        )}
      >
        <div className="bobo-container py-6">
          <form onSubmit={submit} className="flex items-center gap-4 border-b border-line pb-3">
            <Search className="size-5 shrink-0 text-ink-muted" aria-hidden />
            <label htmlFor="site-search" className="bobo-sr-only">
              Rechercher une pièce, une collection
            </label>
            <input
              id="site-search"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une pièce, une collection…"
              autoComplete="off"
              className="flex-1 border-0 bg-transparent py-2 text-lg outline-none placeholder:text-ink-muted"
            />
            <button
              type="button"
              onClick={close}
              className="-m-2 p-2 text-ink-soft transition-colors hover:text-ink"
              aria-label="Fermer la recherche"
            >
              <X className="size-5" aria-hidden />
            </button>
          </form>

          <div className="min-h-24 py-6" aria-live="polite" aria-busy={loading}>
            {!searched ? (
              <p className="text-sm text-ink-muted">
                Tapez au moins deux caractères pour lancer la recherche.
              </p>
            ) : loading && !hasResults ? (
              <p className="text-sm text-ink-muted">Recherche…</p>
            ) : !hasResults ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-ink-soft">
                  Aucun résultat pour « {query.trim()} ».
                </p>
                <Link href="/boutique" onClick={close} className="bobo-link text-sm">
                  Parcourir toute la boutique
                </Link>
              </div>
            ) : (
              <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                {results.products.length > 0 ? (
                  <section>
                    <h2 className="bobo-eyebrow mb-4 text-ink-muted">Pièces</h2>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
                      {results.products.map((product) => (
                        <li key={product.slug}>
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={close}
                            className="group flex flex-col gap-2"
                          >
                            <div className="bobo-media">
                              {product.image_url ? (
                                <Image
                                  src={product.image_url}
                                  alt={product.name}
                                  fill
                                  sizes="(max-width: 640px) 50vw, 200px"
                                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                                />
                              ) : null}
                            </div>
                            <span className="truncate text-sm">{product.name}</span>
                            <span className="text-xs text-ink-soft tabular-nums">
                              {formatPrice(product.price_cents)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <div className="flex flex-col gap-8">
                  {results.collections.length > 0 ? (
                    <section>
                      <h2 className="bobo-eyebrow mb-4 text-ink-muted">Collections</h2>
                      <ul className="flex flex-col gap-2.5">
                        {results.collections.map((collection) => (
                          <li key={collection.slug}>
                            <Link
                              href={`/collections/${collection.slug}`}
                              onClick={close}
                              className="bobo-link text-sm"
                            >
                              {collection.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {results.categories.length > 0 ? (
                    <section>
                      <h2 className="bobo-eyebrow mb-4 text-ink-muted">Catégories</h2>
                      <ul className="flex flex-col gap-2.5">
                        {results.categories.map((category) => (
                          <li key={category.slug}>
                            <Link
                              href={`/boutique?category=${category.slug}`}
                              onClick={close}
                              className="bobo-link text-sm"
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
