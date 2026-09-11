'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

import { Drawer } from '@/components/ui/drawer';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { Price } from '@/components/ui/price';
import { formatPrice } from '@/lib/format';
import { useStore } from '@/features/cart/store-provider';
import type { PricedLine } from '@/types/cart';

/**
 * Cart panel.
 *
 * Every figure shown here was computed by the database, including the
 * free-shipping progress. When stock forces a line down, the drawer says so
 * plainly instead of silently changing the number under the shopper.
 */
export function CartDrawer() {
  const { overlay, closeOverlay, cart, isPricing, setQuantity, removeItem } = useStore();
  const open = overlay === 'cart';

  const lines = cart?.lines ?? [];
  const isEmpty = lines.length === 0;

  return (
    <Drawer open={open} onClose={closeOverlay} title="Panier">
      {isEmpty ? (
        <div className="flex flex-col items-center gap-5 px-6 py-24 text-center">
          <p className="bobo-display text-display-sm">Votre panier est vide</p>
          <p className="max-w-xs text-sm text-ink-soft">
            Nos pièces sont produites en très petites séries. Celles qui vous plaisent ne restent
            pas longtemps.
          </p>
          <Link href="/boutique" onClick={closeOverlay} className="bobo-btn bobo-btn-outline mt-2">
            Découvrir la boutique
          </Link>
        </div>
      ) : (
        <>
          {cart?.shipping_method?.free_above_cents ? (
            <FreeShippingProgress
              subtotal={cart.subtotal_cents - cart.discount_cents}
              threshold={cart.shipping_method.free_above_cents}
            />
          ) : null}

          <ul className="divide-y divide-line px-6" aria-busy={isPricing}>
            {lines.map((line) => (
              <CartLine
                key={line.variant_id}
                line={line}
                onQuantityChange={(quantity) => setQuantity(line.variant_id, quantity)}
                onRemove={() => removeItem(line.variant_id)}
              />
            ))}
          </ul>
        </>
      )}

      {!isEmpty && cart ? (
        <CartFooter cart={cart} onNavigate={closeOverlay} />
      ) : null}
    </Drawer>
  );
}

function CartLine({
  line,
  onQuantityChange,
  onRemove,
}: {
  line: PricedLine;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const variantLabel = [line.size, line.color_name].filter(Boolean).join(' · ');

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/product/${line.slug}`}
        className="relative block aspect-[3/4] w-20 shrink-0 overflow-hidden bg-paper-deep"
      >
        {line.image_url ? (
          <Image src={line.image_url} alt={line.name} fill sizes="80px" className="object-cover" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${line.slug}`} className="block truncate text-sm">
              {line.name}
            </Link>
            {variantLabel ? (
              <p className="mt-0.5 text-xs text-ink-muted">{variantLabel}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="-m-1.5 p-1.5 text-ink-muted transition-colors hover:text-danger"
            aria-label={`Retirer ${line.name} du panier`}
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>

        {line.adjusted ? (
          <p className="text-xs text-clay" role="status">
            Quantité ajustée : il reste {line.available} pièce{line.available > 1 ? 's' : ''}.
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3">
          <QuantityStepper
            value={line.quantity}
            onChange={onQuantityChange}
            max={line.available}
            label={line.name}
            compact
          />
          <Price
            cents={line.line_total_cents}
            compareAtCents={
              line.compare_at_price_cents ? line.compare_at_price_cents * line.quantity : null
            }
            size="sm"
          />
        </div>
      </div>
    </li>
  );
}

function FreeShippingProgress({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const reached = subtotal >= threshold;
  const percent = Math.min(Math.round((subtotal / threshold) * 100), 100);

  return (
    <div className="border-b border-line px-6 py-4">
      <p className="text-xs text-ink-soft" role="status">
        {reached ? (
          <>La livraison vous est offerte.</>
        ) : (
          <>
            Plus que <strong className="font-medium">{formatPrice(threshold - subtotal)}</strong>{' '}
            pour bénéficier de la livraison offerte.
          </>
        )}
      </p>
      <div
        className="mt-2 h-px w-full bg-line"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression vers la livraison offerte"
      >
        <div
          className="h-px bg-ink transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function CartFooter({
  cart,
  onNavigate,
}: {
  cart: NonNullable<ReturnType<typeof useStore>['cart']>;
  onNavigate: () => void;
}) {
  const hasUnavailable = cart.lines.some((line) => !line.in_stock);

  return (
    <div className="sticky bottom-0 border-t border-line bg-paper px-6 py-5">
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Sous-total</dt>
          <dd className="tabular-nums">{formatPrice(cart.subtotal_cents)}</dd>
        </div>

        {cart.discount_cents > 0 ? (
          <div className="flex justify-between text-clay">
            <dt>Remise {cart.discount?.code ? `(${cart.discount.code})` : ''}</dt>
            <dd className="tabular-nums">−{formatPrice(cart.discount_cents)}</dd>
          </div>
        ) : null}

        <div className="flex justify-between">
          <dt className="text-ink-soft">Livraison</dt>
          <dd className="tabular-nums">
            {cart.shipping_cents === 0 ? 'Offerte' : formatPrice(cart.shipping_cents)}
          </dd>
        </div>

        <div className="mt-2 flex justify-between border-t border-line pt-3 text-base">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(cart.total_cents)}</dd>
        </div>
      </dl>

      <p className="mt-2 text-xs text-ink-muted">TVA incluse. Calculé à l&apos;étape suivante.</p>

      <Link
        href="/checkout"
        onClick={onNavigate}
        aria-disabled={hasUnavailable}
        className="bobo-btn bobo-btn-primary mt-4 w-full"
      >
        Passer commande
      </Link>

      <Link
        href="/cart"
        onClick={onNavigate}
        className="bobo-link mt-4 block text-center text-xs text-ink-soft"
      >
        Voir le panier
      </Link>
    </div>
  );
}
