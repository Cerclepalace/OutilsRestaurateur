'use client';

import { useActionState } from 'react';

import { saveSetting, saveShippingMethod, type AdminResult } from '@/features/admin/actions';
import type { ShippingMethod } from '@/types/catalog';
import type { Json } from '@/types/database';

/**
 * Commercial rules.
 *
 * Shipping gets a proper form because a merchant changes those numbers often.
 * The remaining settings are edited as JSON — they are structured content, and
 * inventing a bespoke form for each one would age badly.
 */
export function ShippingMethodForm({ method }: { method: ShippingMethod }) {
  const [state, action, pending] = useActionState<AdminResult | null, FormData>(
    saveShippingMethod,
    null,
  );

  return (
    <form action={action} className="grid gap-4 border border-line p-5 sm:grid-cols-2">
      <input type="hidden" name="id" value={method.id} />

      <label className="sm:col-span-2">
        <span className="bobo-label">Nom — {method.code}</span>
        <input name="name" defaultValue={method.name} required className="bobo-field" />
      </label>

      <label className="sm:col-span-2">
        <span className="bobo-label">Description</span>
        <input name="description" defaultValue={method.description ?? ''} className="bobo-field" />
      </label>

      <label>
        <span className="bobo-label">Tarif (€)</span>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={(method.price_cents / 100).toFixed(2)}
          required
          className="bobo-field"
        />
      </label>

      <label>
        <span className="bobo-label">Offerte à partir de (€)</span>
        <input
          name="free_above"
          type="number"
          step="0.01"
          min="0"
          defaultValue={
            method.free_above_cents === null ? '' : (method.free_above_cents / 100).toFixed(2)
          }
          className="bobo-field"
        />
      </label>

      <label className="flex items-center gap-3 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={method.is_active}
          className="accent-[var(--color-ink)]"
        />
        Actif
      </label>

      {state && !state.ok ? (
        <p className="text-xs text-danger sm:col-span-2" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-xs text-success sm:col-span-2" role="status">
          Enregistré.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="bobo-btn bobo-btn-outline self-start">
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}

export function SettingForm({
  settingKey,
  value,
  description,
}: {
  settingKey: string;
  value: Json;
  description: string | null;
}) {
  const [state, action, pending] = useActionState<AdminResult | null, FormData>(saveSetting, null);

  return (
    <form action={action} className="flex flex-col gap-3 border border-line p-5">
      <input type="hidden" name="key" value={settingKey} />

      <div>
        <p className="bobo-eyebrow">{settingKey}</p>
        {description ? <p className="mt-1 text-xs text-ink-muted">{description}</p> : null}
      </div>

      <label>
        <span className="bobo-sr-only">Valeur JSON de {settingKey}</span>
        <textarea
          name="value"
          defaultValue={JSON.stringify(value, null, 2)}
          rows={10}
          spellCheck={false}
          className="bobo-field resize-y font-mono text-xs"
        />
      </label>

      {state && !state.ok ? (
        <p className="text-xs text-danger" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-xs text-success" role="status">
          Enregistré.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="bobo-btn bobo-btn-outline self-start">
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
