'use client';

import { useActionState } from 'react';

import { saveProduct, type AdminResult } from '@/features/admin/actions';
import type { Category } from '@/types/catalog';

interface ProductValues {
  id?: string;
  name?: string;
  slug?: string;
  model_name?: string | null;
  subtitle?: string | null;
  description?: string | null;
  composition?: string | null;
  care_guide?: string | null;
  manufacturing?: string | null;
  origin_country?: string | null;
  category_id?: string | null;
  audience?: string;
  status?: string;
  base_price_cents?: number;
  compare_at_price_cents?: number | null;
  is_new?: boolean;
  is_one_of_a_kind?: boolean;
  position?: number;
}

const euros = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? '' : (cents / 100).toFixed(2);

/** Create or edit a product. Prices are entered in euros and stored in cents. */
export function ProductForm({
  product,
  categories,
}: {
  product?: ProductValues;
  categories: Category[];
}) {
  const [state, action, pending] = useActionState<AdminResult | null, FormData>(saveProduct, null);

  return (
    <form action={action} className="flex flex-col gap-8">
      {product?.id ? <input type="hidden" name="id" value={product.id} /> : null}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="bobo-eyebrow mb-4 text-ink-muted">Identité</legend>

        <Field name="name" label="Nom" defaultValue={product?.name} required />
        <Field name="model_name" label="Modèle" defaultValue={product?.model_name ?? ''} />
        <Field
          name="slug"
          label="Slug (laisser vide pour générer)"
          defaultValue={product?.slug ?? ''}
          className="sm:col-span-2"
        />
        <Field name="subtitle" label="Sous-titre" defaultValue={product?.subtitle ?? ''} className="sm:col-span-2" />

        <Area name="description" label="Description" defaultValue={product?.description ?? ''} className="sm:col-span-2" />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="bobo-eyebrow mb-4 text-ink-muted">Matière &amp; fabrication</legend>
        <Area name="composition" label="Composition" defaultValue={product?.composition ?? ''} />
        <Area name="care_guide" label="Entretien" defaultValue={product?.care_guide ?? ''} />
        <Area name="manufacturing" label="Fabrication" defaultValue={product?.manufacturing ?? ''} />
        <Field name="origin_country" label="Pays d'origine" defaultValue={product?.origin_country ?? ''} />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="bobo-eyebrow mb-4 text-ink-muted">Commerce</legend>

        <Field
          name="base_price"
          label="Prix (€)"
          type="number"
          step="0.01"
          min="0"
          defaultValue={euros(product?.base_price_cents)}
          required
        />
        <Field
          name="compare_at_price"
          label="Prix barré (€, facultatif)"
          type="number"
          step="0.01"
          min="0"
          defaultValue={euros(product?.compare_at_price_cents)}
        />

        <label>
          <span className="bobo-label">Catégorie</span>
          <select name="category_id" defaultValue={product?.category_id ?? ''} className="bobo-field">
            <option value="">—</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.audience ? ` (${category.audience})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="bobo-label">Public</span>
          <select name="audience" defaultValue={product?.audience ?? 'unisexe'} className="bobo-field">
            <option value="femme">Femme</option>
            <option value="homme">Homme</option>
            <option value="unisexe">Unisexe</option>
          </select>
        </label>

        <label>
          <span className="bobo-label">Statut</span>
          <select name="status" defaultValue={product?.status ?? 'draft'} className="bobo-field">
            <option value="draft">Brouillon</option>
            <option value="active">Publié</option>
            <option value="archived">Archivé</option>
          </select>
        </label>

        <Field
          name="position"
          label="Ordre d'affichage"
          type="number"
          min="0"
          defaultValue={String(product?.position ?? 0)}
        />

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="is_new"
            defaultChecked={product?.is_new ?? false}
            className="accent-[var(--color-ink)]"
          />
          Nouveauté
        </label>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="is_one_of_a_kind"
            defaultChecked={product?.is_one_of_a_kind ?? false}
            className="accent-[var(--color-ink)]"
          />
          Pièce unique
        </label>
      </fieldset>

      {state && !state.ok ? (
        <p className="border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-success" role="status">
          Produit enregistré.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="bobo-btn bobo-btn-primary self-start">
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  type = 'text',
  step,
  min,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  type?: string;
  step?: string;
  min?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="bobo-label">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        defaultValue={defaultValue ?? ''}
        required={required}
        className="bobo-field"
      />
    </label>
  );
}

function Area({
  name,
  label,
  defaultValue,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="bobo-label">{label}</span>
      <textarea name={name} defaultValue={defaultValue ?? ''} rows={4} className="bobo-field resize-y" />
    </label>
  );
}
