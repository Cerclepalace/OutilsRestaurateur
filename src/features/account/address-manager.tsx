'use client';

import { useActionState, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { COUNTRIES } from '@/config/site';
import { saveAddress, deleteAddress, type ActionResult } from '@/features/account/actions';
import type { Address } from '@/types/catalog';

/** Address book: list, add, edit, delete, with one default shipping address. */
export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<Address | 'new' | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {addresses.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="flex flex-col gap-3 border border-line p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm">
                  {address.first_name} {address.last_name}
                </p>
                {address.is_default_shipping ? (
                  <span className="bobo-eyebrow bg-ink px-2 py-0.5 text-paper">Par défaut</span>
                ) : null}
              </div>

              <address className="text-sm not-italic leading-relaxed text-ink-soft">
                {address.line1}
                {address.line2 ? (
                  <>
                    <br />
                    {address.line2}
                  </>
                ) : null}
                <br />
                {address.postal_code} {address.city}
                <br />
                {countryName(address.country_code)}
              </address>

              <div className="mt-auto flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(address)}
                  className="inline-flex items-center gap-1.5 text-xs text-ink-soft transition-colors hover:text-ink"
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Modifier
                </button>

                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={address.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 text-xs text-ink-soft transition-colors hover:text-danger"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-line px-5 py-10 text-center text-sm text-ink-soft">
          Aucune adresse enregistrée.
        </p>
      )}

      {editing ? (
        <AddressForm
          address={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="bobo-btn bobo-btn-outline self-start"
        >
          <Plus className="size-4" aria-hidden />
          Ajouter une adresse
        </button>
      )}
    </div>
  );
}

function AddressForm({ address, onDone }: { address: Address | null; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    async (previous, formData) => {
      const result = await saveAddress(previous, formData);
      if (result.ok) onDone();
      return result;
    },
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-5 border border-line p-6">
      <h2 className="bobo-eyebrow">{address ? "Modifier l'adresse" : 'Nouvelle adresse'}</h2>

      {address ? <input type="hidden" name="id" value={address.id} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="first_name" label="Prénom" defaultValue={address?.first_name} required />
        <Field name="last_name" label="Nom" defaultValue={address?.last_name} required />
        <Field
          name="line1"
          label="Adresse"
          defaultValue={address?.line1}
          required
          className="sm:col-span-2"
        />
        <Field
          name="line2"
          label="Complément (facultatif)"
          defaultValue={address?.line2 ?? ''}
          className="sm:col-span-2"
        />
        <Field name="postal_code" label="Code postal" defaultValue={address?.postal_code} required />
        <Field name="city" label="Ville" defaultValue={address?.city} required />

        <label>
          <span className="bobo-label">Pays</span>
          <select name="country_code" defaultValue={address?.country_code ?? 'FR'} className="bobo-field">
            {COUNTRIES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>

        <Field name="phone" label="Téléphone (facultatif)" defaultValue={address?.phone ?? ''} />
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          name="is_default_shipping"
          defaultChecked={address?.is_default_shipping ?? false}
          className="accent-[var(--color-ink)]"
        />
        Utiliser comme adresse de livraison par défaut
      </label>

      {state && !state.ok ? (
        <p className="text-xs text-danger" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="bobo-btn bobo-btn-primary">
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onDone} className="bobo-btn bobo-btn-ghost">
          Annuler
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="bobo-label">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        className="bobo-field"
      />
    </label>
  );
}

function countryName(code: string) {
  return COUNTRIES.find((entry) => entry.code === code)?.name ?? code;
}
