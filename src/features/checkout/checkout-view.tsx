'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Lock } from 'lucide-react';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import { COUNTRIES } from '@/config/site';
import { addressSchema } from '@/lib/validation';
import { useStore } from '@/features/cart/store-provider';
import { EmptyState } from '@/components/ui/empty-state';
import type { ShippingMethod } from '@/types/catalog';

/**
 * Checkout.
 *
 * One page, three disclosed steps, because a fashion basket is small and a
 * multi-page wizard loses people. Everything is validated client-side for
 * immediacy and re-validated server-side for truth: `/api/checkout` re-prices
 * the basket, holds the stock and opens the payment session.
 */

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.'),
  phone: z.string().trim().max(32).optional(),
  shipping: addressSchema,
  shippingMethodCode: z.string().min(1, 'Choisissez un mode de livraison.'),
  customerNote: z.string().trim().max(500).optional(),
  acceptTerms: z.literal(true, { message: 'Vous devez accepter les conditions de vente.' }),
});

type Values = z.infer<typeof schema>;

export function CheckoutView({
  shippingMethods,
  paymentEnabled,
}: {
  shippingMethods: ShippingMethod[];
  paymentEnabled: boolean;
}) {
  const { cart, items, discountCode } = useStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      shipping: { country_code: 'FR' },
      shippingMethodCode: '',
    },
  });

  // `useWatch` subscribes to the single field rather than re-rendering on every
  // keystroke in the form, and is the memoisation-safe API.
  const country = useWatch({ control, name: 'shipping.country_code' }) ?? 'FR';

  const available = useMemo(
    () =>
      shippingMethods.filter(
        (method) => method.country_codes.length === 0 || method.country_codes.includes(country),
      ),
    [shippingMethods, country],
  );

  const lines = cart?.lines ?? [];

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Votre panier est vide"
        body="Ajoutez une pièce avant de passer commande."
        actionLabel="Découvrir la boutique"
        actionHref="/boutique"
      />
    );
  }

  async function onSubmit(values: Values) {
    setServerError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.filter((item) => item.quantity > 0),
          email: values.email,
          phone: values.phone || null,
          shippingAddress: values.shipping,
          shippingMethodCode: values.shippingMethodCode,
          discountCode: discountCode ?? null,
          customerNote: values.customerNote || null,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        checkout_url?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setServerError(body.message ?? "La commande n'a pas pu être créée.");
        return;
      }

      if (body.checkout_url) {
        // Hand off to Stripe. The cart is cleared by /order/success once the
        // payment is confirmed, never before.
        window.location.assign(body.checkout_url);
        return;
      }

      setServerError("La session de paiement n'a pas pu être ouverte.");
    } catch {
      setServerError('Connexion impossible. Réessayez dans un instant.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-20">
      <div className="flex flex-col gap-12">
        <Step number={1} title="Vos informations">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="E-mail" error={errors.email?.message} className="sm:col-span-2">
              <input
                type="email"
                autoComplete="email"
                className="bobo-field"
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </Field>

            <Field label="Téléphone (facultatif)" error={errors.phone?.message}>
              <input type="tel" autoComplete="tel" className="bobo-field" {...register('phone')} />
            </Field>
          </div>
        </Step>

        <Step number={2} title="Adresse de livraison">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Prénom" error={errors.shipping?.first_name?.message}>
              <input
                autoComplete="given-name"
                className="bobo-field"
                aria-invalid={Boolean(errors.shipping?.first_name)}
                {...register('shipping.first_name')}
              />
            </Field>

            <Field label="Nom" error={errors.shipping?.last_name?.message}>
              <input
                autoComplete="family-name"
                className="bobo-field"
                aria-invalid={Boolean(errors.shipping?.last_name)}
                {...register('shipping.last_name')}
              />
            </Field>

            <Field label="Adresse" error={errors.shipping?.line1?.message} className="sm:col-span-2">
              <input
                autoComplete="address-line1"
                className="bobo-field"
                aria-invalid={Boolean(errors.shipping?.line1)}
                {...register('shipping.line1')}
              />
            </Field>

            <Field label="Complément (facultatif)" className="sm:col-span-2">
              <input
                autoComplete="address-line2"
                className="bobo-field"
                {...register('shipping.line2')}
              />
            </Field>

            <Field label="Code postal" error={errors.shipping?.postal_code?.message}>
              <input
                autoComplete="postal-code"
                className="bobo-field"
                aria-invalid={Boolean(errors.shipping?.postal_code)}
                {...register('shipping.postal_code')}
              />
            </Field>

            <Field label="Ville" error={errors.shipping?.city?.message}>
              <input
                autoComplete="address-level2"
                className="bobo-field"
                aria-invalid={Boolean(errors.shipping?.city)}
                {...register('shipping.city')}
              />
            </Field>

            <Field label="Pays" error={errors.shipping?.country_code?.message}>
              <select
                autoComplete="country"
                className="bobo-field"
                {...register('shipping.country_code')}
              >
                {COUNTRIES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Step>

        <Step number={3} title="Livraison">
          {available.length === 0 ? (
            <p className="text-sm text-danger" role="alert">
              Nous ne livrons pas encore dans ce pays. Écrivez-nous et nous trouverons une solution.
            </p>
          ) : (
            <fieldset className="flex flex-col gap-3">
              <legend className="bobo-sr-only">Mode de livraison</legend>
              {available.map((method) => (
                <label
                  key={method.code}
                  className="flex cursor-pointer items-start gap-3 border border-line p-4 transition-colors has-[:checked]:border-ink"
                >
                  <input
                    type="radio"
                    value={method.code}
                    className="mt-1 accent-[var(--color-ink)]"
                    {...register('shippingMethodCode')}
                  />
                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm">{method.name}</span>
                      <span className="text-sm tabular-nums">
                        {method.price_cents === 0 ? 'Offerte' : formatPrice(method.price_cents)}
                      </span>
                    </span>
                    {method.description ? (
                      <span className="mt-1 block text-xs text-ink-muted">{method.description}</span>
                    ) : null}
                    {method.free_above_cents ? (
                      <span className="mt-1 block text-xs text-ink-muted">
                        Offerte dès {formatPrice(method.free_above_cents)} d&apos;achat.
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
              {errors.shippingMethodCode ? (
                <p className="text-xs text-danger" role="alert">
                  {errors.shippingMethodCode.message}
                </p>
              ) : null}
            </fieldset>
          )}

          <Field label="Note pour l'atelier (facultatif)" className="mt-6">
            <textarea rows={3} className="bobo-field resize-none" {...register('customerNote')} />
          </Field>
        </Step>

        <Step number={4} title="Paiement">
          {paymentEnabled ? (
            <p className="flex items-start gap-2.5 text-sm text-ink-soft">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
              Vous serez redirigé vers notre page de paiement sécurisée pour saisir votre carte.
              Aucune donnée bancaire ne transite par ce site.
            </p>
          ) : (
            <p className="border border-line bg-paper-deep px-4 py-3 text-sm" role="status">
              Le paiement n&apos;est pas encore activé sur cette installation. Renseignez les clés
              Stripe dans <code>.env.local</code> pour finaliser une commande.
            </p>
          )}

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 accent-[var(--color-ink)]"
              {...register('acceptTerms')}
            />
            <span>
              J&apos;accepte les{' '}
              <Link href="/livraison-et-retours" className="bobo-link bobo-link-static">
                conditions de vente
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms ? (
            <p className="mt-2 text-xs text-danger" role="alert">
              {errors.acceptTerms.message}
            </p>
          ) : null}
        </Step>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line p-6">
          <h2 className="bobo-eyebrow mb-5">Votre commande</h2>

          <ul className="mb-5 flex flex-col gap-4">
            {lines.map((line) => (
              <li key={line.variant_id} className="flex gap-3">
                <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-paper-deep">
                  {line.image_url ? (
                    <Image
                      src={line.image_url}
                      alt={line.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                  <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-[0.625rem] text-paper">
                    {line.quantity}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{line.name}</p>
                  <p className="text-xs text-ink-muted">
                    {[line.size, line.color_name].filter(Boolean).join(' · ')}
                  </p>
                </div>

                <p className="text-sm tabular-nums">{formatPrice(line.line_total_cents)}</p>
              </li>
            ))}
          </ul>

          <dl className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
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
              <dt className="text-ink-soft">Livraison</dt>
              <dd className="tabular-nums">
                {cart?.shipping_cents === 0 ? 'Offerte' : formatPrice(cart?.shipping_cents ?? 0)}
              </dd>
            </div>
            <div className="mt-3 flex justify-between border-t border-line pt-4 text-base">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(cart?.total_cents ?? 0)}</dd>
            </div>
          </dl>

          {serverError ? (
            <p className="mt-5 border border-danger/40 bg-danger/5 px-3 py-2 text-xs text-danger" role="alert">
              {serverError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !paymentEnabled}
            className="bobo-btn bobo-btn-primary mt-6 w-full"
          >
            {submitting ? 'Traitement…' : paymentEnabled ? 'Payer' : 'Paiement non activé'}
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <Check className="size-3.5" aria-hidden />
            Le stock est réservé dès la validation.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-6 flex items-center gap-3">
        <span className="grid size-7 place-items-center border border-ink text-xs tabular-nums">
          {number}
        </span>
        <span className="bobo-eyebrow">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="bobo-label">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
