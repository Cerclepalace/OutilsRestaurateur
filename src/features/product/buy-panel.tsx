'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Ruler } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SIZE_ORDER } from '@/config/site';
import { Price } from '@/components/ui/price';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { WishlistButton } from '@/features/wishlist/wishlist-button';
import { useStore } from '@/features/cart/store-provider';
import type { ProductDetail, Variant } from '@/types/catalog';

/**
 * Colour and size selection, then add to cart.
 *
 * Availability comes from the server with the page. A size with no stock stays
 * visible but struck through: a shopper should be able to see that the piece
 * exists in that size and is gone, which is the whole point of small series.
 */
export function BuyPanel({ product }: { product: ProductDetail }) {
  const { addItem } = useStore();

  const colors = useMemo(() => uniqueColors(product.variants), [product.variants]);
  const [color, setColor] = useState<string | null>(colors[0]?.name ?? null);

  // A piece offered in a single size (a bag, a bucket hat) needs no choice:
  // preselect it so it can be added in one click.
  const [size, setSize] = useState<string | null>(() => {
    const sizes = [...new Set(product.variants.map((variant) => variant.size).filter(Boolean))];
    return sizes.length === 1 ? (sizes[0] as string) : null;
  });
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const sizesForColor = useMemo(
    () =>
      product.variants
        .filter((variant) => (color ? variant.color_name === color : true))
        .sort((a, b) => sizeRank(a.size) - sizeRank(b.size)),
    [product.variants, color],
  );

  const selected = useMemo(
    () =>
      product.variants.find(
        (variant) =>
          (color ? variant.color_name === color : true) &&
          (size ? variant.size === size : variant.size === null),
      ) ?? null,
    [product.variants, color, size],
  );

  // A single untyped variant (a bag, a hat) needs no size step.
  const needsSize = sizesForColor.some((variant) => variant.size !== null);
  const ready = selected !== null && selected.in_stock && (!needsSize || size !== null);

  function onAdd() {
    if (!selected) {
      setError('Choisissez une taille.');
      return;
    }
    if (!selected.in_stock) {
      setError("Cette taille n'est plus disponible.");
      return;
    }

    setError(null);
    addItem(selected.id, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  }

  const displayPrice = selected?.price_cents ?? product.price_cents;
  const displayCompare = selected?.compare_at_price_cents ?? product.compare_at_price_cents;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="bobo-display text-display-sm">{product.name}</h1>
          <WishlistButton
            productId={product.id}
            variantId={selected?.id ?? null}
            productName={product.name}
            className="-mr-2 -mt-1 shrink-0"
          />
        </div>

        <Price cents={displayPrice} compareAtCents={displayCompare} size="lg" />
        <p className="text-xs text-ink-muted">TVA incluse. Livraison calculée au paiement.</p>
      </div>

      {colors.length > 1 ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="bobo-eyebrow text-ink-muted">
            Couleur{color ? <span className="ml-2 text-ink">{color}</span> : null}
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((entry) => (
              <button
                key={entry.name}
                type="button"
                onClick={() => {
                  setColor(entry.name);
                  setSize(null);
                  setError(null);
                }}
                aria-pressed={color === entry.name}
                aria-label={entry.name}
                title={entry.name}
                className={cn(
                  'size-8 rounded-full border transition-shadow',
                  color === entry.name
                    ? 'border-ink ring-1 ring-ink ring-offset-2'
                    : 'border-line-strong hover:border-ink-muted',
                )}
                style={{ backgroundColor: entry.hex ?? 'transparent' }}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {needsSize ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="flex w-full items-center justify-between">
            <span className="bobo-eyebrow text-ink-muted">Taille</span>
            {product.size_guide ? (
              <a href="#taille" className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                <Ruler className="size-3.5" aria-hidden />
                <span className="bobo-link">Guide des tailles</span>
              </a>
            ) : null}
          </legend>

          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((variant) => {
              const isSelected = size === variant.size;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={!variant.in_stock}
                  onClick={() => {
                    setSize(variant.size);
                    setQuantity(1);
                    setError(null);
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    'min-w-14 border px-4 py-3 text-sm transition-colors',
                    isSelected ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink',
                    !variant.in_stock &&
                      'cursor-not-allowed border-line text-ink-muted line-through hover:border-line',
                  )}
                  title={variant.in_stock ? undefined : 'Épuisé'}
                >
                  {variant.size}
                </button>
              );
            })}
          </div>

          {selected?.in_stock && selected.available <= 3 ? (
            <p className="text-xs text-clay" role="status">
              Il ne reste que {selected.available} pièce{selected.available > 1 ? 's' : ''} dans
              cette taille.
            </p>
          ) : null}
        </fieldset>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <QuantityStepper
            value={quantity}
            onChange={(next) => setQuantity(Math.max(1, Math.min(next, selected?.available ?? 1)))}
            max={selected?.available ?? 1}
            label={product.name}
          />

          <button
            type="button"
            onClick={onAdd}
            disabled={Boolean(selected) && !selected?.in_stock}
            className="bobo-btn bobo-btn-primary flex-1"
          >
            {added ? (
              <>
                <Check className="size-4" aria-hidden />
                Ajouté au panier
              </>
            ) : ready || !needsSize ? (
              'Ajouter au panier'
            ) : (
              'Choisir une taille'
            )}
          </button>
        </div>

        {error ? (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {product.is_one_of_a_kind ? (
          <p className="text-xs text-ink-soft">
            Pièce unique — un seul exemplaire, qui ne sera pas réédité.
          </p>
        ) : null}

        <Link href="/livraison-et-retours" className="bobo-link self-start text-xs text-ink-soft">
          Livraison &amp; retours
        </Link>
      </div>
    </div>
  );
}

function uniqueColors(variants: Variant[]) {
  const seen = new Map<string, { name: string; hex: string | null }>();
  for (const variant of variants) {
    if (variant.color_name && !seen.has(variant.color_name)) {
      seen.set(variant.color_name, { name: variant.color_name, hex: variant.color_hex });
    }
  }
  return [...seen.values()];
}

function sizeRank(size: string | null) {
  if (!size) return -1;
  const index = (SIZE_ORDER as readonly string[]).indexOf(size);
  return index === -1 ? SIZE_ORDER.length : index;
}
