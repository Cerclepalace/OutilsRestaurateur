'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Trash2, Tag } from 'lucide-react';

import { formatPrice } from '@/lib/format';
import { Price } from '@/components/ui/price';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { EmptyState } from '@/components/ui/empty-state';
import { useStore } from '@/features/cart/store-provider';

/**
 * Full cart page — the same server-priced data as the drawer, laid out for a
 * considered review before checkout.
 */
export function CartPageView({ cancelledOrder }: { cancelledOrder?: string }) {
  const { cart, isPricing, setQuantity, removeItem, discountCode, applyDiscount } = useStore();
  const [codeInput, setCodeInput] = useState('');

  const lines = cart?.lines ?? [];

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Votre panier est vide"
        body="Nos pièces sont produites en très petites séries. Celles qui vous plaisent ne restent pas longtemps."
        actionLabel="Découvrir la boutique"
        actionHref="/boutique"
      />
    );
  }

  const discountRejected =
    discountCode && cart?.discount && !cart.discount.valid ? cart.discount.reason : null;

  return (
    <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
      <div>
        {cancelledOrder ? (
          <p className="mb-6 border border-line bg-paper-deep px-4 py-3 text-sm" role="status">
            Le paiement de la commande {cancelledOrder} a été interrompu. Votre panier est intact.
          </p>
        ) : null}

        <ul className="divide-y divide-line border-y border-line" aria-busy={isPricing}>
          {lines.map((line) => (
            <li key={line.variant_id} className="flex gap-5 py-6">
              <Link
                href={`/product/${line.slug}`}
                className="relative block aspect-[3/4] w-24 shrink-0 overflow-hidden bg-paper-deep sm:w-28"
              >
                {line.image_url ? (
                  <Image
                    src={line.image_url}
                    alt={line.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/product/${line.slug}`} className="block text-sm">
                      {line.name}
                    </Link>
                    <p className="mt-1 text-xs text-ink-muted">
                      {[line.size, line.color_name].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">Réf. {line.sku}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(line.variant_id)}
                    className="-m-2 p-2 text-ink-muted transition-colors hover:text-danger"
                    aria-label={`Retirer ${line.name}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>

                {line.adjusted ? (
                  <p className="text-xs text-clay" role="status">
                    Quantité ajustée : il reste {line.available} pièce
                    {line.available > 1 ? 's' : ''}.
                  </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between gap-4">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(next) => setQuantity(line.variant_id, next)}
                    max={line.available}
                    label={line.name}
                  />
                  <Price
                    cents={line.line_total_cents}
                    compareAtCents={
                      line.compare_at_price_cents
                        ? line.compare_at_price_cents * line.quantity
                        : null
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link href="/boutique" className="bobo-link mt-6 inline-block text-sm text-ink-soft">
          Continuer mes achats
        </Link>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line p-6">
          <h2 className="bobo-eyebrow mb-5">Récapitulatif</h2>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              applyDiscount(codeInput.trim() || null);
            }}
            className="mb-6 flex items-end gap-3"
          >
            <div className="flex-1">
              <label htmlFor="discount" className="bobo-label">
                Code de réduction
              </label>
              <input
                id="discount"
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                className="bobo-field"
                placeholder="Votre code"
                autoComplete="off"
              />
            </div>
            <button type="submit" className="bobo-btn bobo-btn-ghost shrink-0">
              Appliquer
            </button>
          </form>

          {discountRejected ? (
            <p className="-mt-4 mb-5 text-xs text-danger" role="alert">
              {discountMessage(discountRejected)}
            </p>
          ) : null}

          {cart?.discount?.valid ? (
            <p className="-mt-4 mb-5 flex items-center gap-2 text-xs text-success" role="status">
              <Tag className="size-3.5" aria-hidden />
              {cart.discount.name} appliqué.
            </p>
          ) : null}

          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Sous-total</dt>
              <dd className="tabular-nums">{formatPrice(cart?.subtotal_cents ?? 0)}</dd>
            </div>

            {cart && cart.discount_cents > 0 ? (
              <div className="flex justify-between text-clay">
                <dt>Remise</dt>
                <dd className="tabular-nums">−{formatPrice(cart.discount_cents)}</dd>
              </div>
            ) : null}

            <div className="flex justify-between">
              <dt className="text-ink-soft">
                Livraison
                {cart?.shipping_method ? (
                  <span className="block text-xs text-ink-muted">{cart.shipping_method.name}</span>
                ) : null}
              </dt>
              <dd className="tabular-nums">
                {cart?.shipping_cents === 0 ? 'Offerte' : formatPrice(cart?.shipping_cents ?? 0)}
              </dd>
            </div>

            <div className="mt-3 flex justify-between border-t border-line pt-4 text-base">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(cart?.total_cents ?? 0)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className="bobo-btn bobo-btn-primary mt-6 w-full">
            Passer commande
          </Link>

          <p className="mt-3 text-xs text-ink-muted">
            TVA incluse. Paiement sécurisé par carte bancaire.
          </p>
        </div>
      </aside>
    </div>
  );
}

function discountMessage(reason: string) {
  switch (reason) {
    case 'unknown':
      return "Ce code n'existe pas.";
    case 'expired':
      return 'Ce code a expiré.';
    case 'not_started':
      return "Ce code n'est pas encore actif.";
    case 'inactive':
      return "Ce code n'est plus actif.";
    case 'usage_limit_reached':
      return 'Ce code a atteint sa limite d’utilisation.';
    case 'min_subtotal':
      return "Votre panier n'atteint pas le minimum requis pour ce code.";
    default:
      return "Ce code n'a pas pu être appliqué.";
  }
}
