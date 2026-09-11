'use client';

import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';

import { formatPrice } from '@/lib/format';
import { saveVariant, deleteVariant, type AdminResult } from '@/features/admin/actions';

interface VariantRow {
  id: string;
  sku: string;
  size: string | null;
  color_name: string | null;
  color_hex: string | null;
  price_cents: number | null;
  inventory: { quantity: number; reserved: number } | { quantity: number; reserved: number }[] | null;
}

/**
 * Declinations and their stock.
 *
 * Stock is edited here rather than on a separate screen because a shopkeeper
 * thinks in "this size, this colour, this many", not in inventory rows.
 */
export function VariantEditor({
  productId,
  variants,
  basePriceCents,
}: {
  productId: string;
  variants: VariantRow[];
  basePriceCents: number;
}) {
  const [editing, setEditing] = useState<VariantRow | 'new' | null>(null);

  return (
    <section className="flex flex-col gap-4">
      <h3 className="bobo-eyebrow text-ink-muted">Déclinaisons</h3>

      {variants.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-2xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="bobo-eyebrow pb-2 pr-4 font-normal text-ink-muted">SKU</th>
                <th scope="col" className="bobo-eyebrow pb-2 pr-4 font-normal text-ink-muted">Taille</th>
                <th scope="col" className="bobo-eyebrow pb-2 pr-4 font-normal text-ink-muted">Couleur</th>
                <th scope="col" className="bobo-eyebrow pb-2 pr-4 font-normal text-ink-muted">Prix</th>
                <th scope="col" className="bobo-eyebrow pb-2 pr-4 font-normal text-ink-muted">Stock</th>
                <th scope="col" className="bobo-eyebrow pb-2 font-normal text-ink-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => {
                const inventory = Array.isArray(variant.inventory)
                  ? variant.inventory[0]
                  : variant.inventory;
                const available = Math.max(
                  (inventory?.quantity ?? 0) - (inventory?.reserved ?? 0),
                  0,
                );

                return (
                  <tr key={variant.id} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-xs">{variant.sku}</td>
                    <td className="py-2.5 pr-4">{variant.size ?? '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-2">
                        {variant.color_hex ? (
                          <span
                            className="size-3 rounded-full border border-line-strong"
                            style={{ backgroundColor: variant.color_hex }}
                            aria-hidden
                          />
                        ) : null}
                        {variant.color_name ?? '—'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {formatPrice(variant.price_cents ?? basePriceCents)}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {available}
                      {inventory && inventory.reserved > 0 ? (
                        <span className="ml-1 text-xs text-ink-muted">
                          ({inventory.reserved} réservé)
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditing(variant)}
                          className="text-xs text-ink-soft hover:text-ink"
                        >
                          Modifier
                        </button>
                        <form action={deleteVariant}>
                          <input type="hidden" name="id" value={variant.id} />
                          <button type="submit" className="text-xs text-ink-soft hover:text-danger">
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="border border-line px-4 py-6 text-center text-sm text-ink-soft">
          Aucune déclinaison. Un produit sans déclinaison ne peut pas être vendu.
        </p>
      )}

      {editing ? (
        <VariantForm
          productId={productId}
          variant={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="bobo-btn bobo-btn-outline self-start"
        >
          <Plus className="size-4" aria-hidden />
          Ajouter une déclinaison
        </button>
      )}
    </section>
  );
}

function VariantForm({
  productId,
  variant,
  onDone,
}: {
  productId: string;
  variant: VariantRow | null;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<AdminResult | null, FormData>(
    async (previous, formData) => {
      const result = await saveVariant(previous, formData);
      if (result.ok) onDone();
      return result;
    },
    null,
  );

  const inventory = Array.isArray(variant?.inventory) ? variant?.inventory[0] : variant?.inventory;

  return (
    <form action={action} className="grid gap-5 border border-line p-5 sm:grid-cols-3">
      <input type="hidden" name="product_id" value={productId} />
      {variant ? <input type="hidden" name="id" value={variant.id} /> : null}

      <label>
        <span className="bobo-label">SKU</span>
        <input name="sku" defaultValue={variant?.sku ?? ''} required className="bobo-field" />
      </label>

      <label>
        <span className="bobo-label">Taille</span>
        <input name="size" defaultValue={variant?.size ?? ''} className="bobo-field" />
      </label>

      <label>
        <span className="bobo-label">Couleur</span>
        <input name="color_name" defaultValue={variant?.color_name ?? ''} className="bobo-field" />
      </label>

      <label>
        <span className="bobo-label">Nuance (hex)</span>
        <input
          name="color_hex"
          defaultValue={variant?.color_hex ?? ''}
          placeholder="#3f5a78"
          className="bobo-field"
        />
      </label>

      <label>
        <span className="bobo-label">Prix spécifique (€)</span>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={variant?.price_cents ? (variant.price_cents / 100).toFixed(2) : ''}
          className="bobo-field"
        />
      </label>

      <label>
        <span className="bobo-label">Stock</span>
        <input
          name="quantity"
          type="number"
          min="0"
          defaultValue={String(inventory?.quantity ?? 0)}
          className="bobo-field"
        />
      </label>

      {state && !state.ok ? (
        <p className="text-xs text-danger sm:col-span-3" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-3 sm:col-span-3">
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
