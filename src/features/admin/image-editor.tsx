'use client';

import { useActionState } from 'react';
import Image from 'next/image';

import { addProductImage, deleteProductImage, type AdminResult } from '@/features/admin/actions';

interface ImageRow {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

/**
 * Product media.
 *
 * Images are referenced by URL: upload the file to the Supabase Storage bucket
 * (or any CDN), then paste its public URL here. Keeping the reference rather
 * than the bytes means the same record works for a local asset and a hosted one.
 */
export function ImageEditor({ productId, images }: { productId: string; images: ImageRow[] }) {
  const [state, action, pending] = useActionState<AdminResult | null, FormData>(
    addProductImage,
    null,
  );

  return (
    <section className="flex flex-col gap-4">
      <h3 className="bobo-eyebrow text-ink-muted">Images</h3>

      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((image) => (
              <li key={image.id} className="flex flex-col gap-2">
                <div className="relative aspect-[3/4] overflow-hidden bg-paper-deep">
                  <Image
                    src={image.url}
                    alt={image.alt ?? ''}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
                <form action={deleteProductImage}>
                  <input type="hidden" name="id" value={image.id} />
                  <button type="submit" className="text-xs text-ink-soft hover:text-danger">
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
        </ul>
      ) : (
        <p className="border border-line px-4 py-6 text-center text-sm text-ink-soft">
          Aucune image.
        </p>
      )}

      <form action={action} className="grid gap-4 border border-line p-5 sm:grid-cols-[2fr_1fr_auto]">
        <input type="hidden" name="product_id" value={productId} />

        <label>
          <span className="bobo-label">URL de l&apos;image</span>
          <input
            name="url"
            required
            placeholder="https://…/storage/v1/object/public/products/…"
            className="bobo-field"
          />
        </label>

        <label>
          <span className="bobo-label">Texte alternatif</span>
          <input name="alt" className="bobo-field" />
        </label>

        <button type="submit" disabled={pending} className="bobo-btn bobo-btn-outline self-end">
          {pending ? 'Ajout…' : 'Ajouter'}
        </button>

        {state && !state.ok ? (
          <p className="text-xs text-danger sm:col-span-3" role="alert">
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
