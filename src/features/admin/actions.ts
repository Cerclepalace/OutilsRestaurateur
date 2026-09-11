'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';
import { slugify } from '@/lib/utils';

/**
 * Admin mutations.
 *
 * Each one runs as the signed-in staff member, so the `is_admin()` RLS policies
 * are the authorisation. A customer calling these gets zero rows changed, not a
 * privilege escalation.
 */

export type AdminResult = { ok: true; id?: string } | { ok: false; message: string };

async function assertAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('is_admin');
  if (error || data !== true) return null;
  return supabase;
}

/** Euro string from a form ("219", "219,50") to integer cents. */
function toCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const normalised = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(normalised) ? Math.round(normalised * 100) : null;
}

const productSchema = z.object({
  name: z.string().trim().min(1, 'Le nom est requis.'),
  slug: z.string().trim().optional(),
  model_name: z.string().trim().max(80).optional(),
  subtitle: z.string().trim().max(160).optional(),
  description: z.string().trim().max(4000).optional(),
  composition: z.string().trim().max(1000).optional(),
  care_guide: z.string().trim().max(1000).optional(),
  manufacturing: z.string().trim().max(1000).optional(),
  origin_country: z.string().trim().max(80).optional(),
  category_id: z.string().uuid().nullable().optional(),
  audience: z.enum(['femme', 'homme', 'unisexe']),
  status: z.enum(['draft', 'active', 'archived']),
  base_price_cents: z.number().int().min(0, 'Prix invalide.'),
  compare_at_price_cents: z.number().int().min(0).nullable(),
  is_new: z.boolean(),
  is_one_of_a_kind: z.boolean(),
  position: z.number().int().min(0),
});

export async function saveProduct(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  const supabase = await assertAdmin();
  if (!supabase) return { ok: false, message: 'Accès refusé.' };

  const name = String(formData.get('name') ?? '');
  const parsed = productSchema.safeParse({
    name,
    slug: formData.get('slug') || undefined,
    model_name: formData.get('model_name') || undefined,
    subtitle: formData.get('subtitle') || undefined,
    description: formData.get('description') || undefined,
    composition: formData.get('composition') || undefined,
    care_guide: formData.get('care_guide') || undefined,
    manufacturing: formData.get('manufacturing') || undefined,
    origin_country: formData.get('origin_country') || undefined,
    category_id: (formData.get('category_id') as string) || null,
    audience: formData.get('audience') ?? 'unisexe',
    status: formData.get('status') ?? 'draft',
    base_price_cents: toCents(formData.get('base_price')) ?? -1,
    compare_at_price_cents: toCents(formData.get('compare_at_price')),
    is_new: formData.get('is_new') === 'on',
    is_one_of_a_kind: formData.get('is_one_of_a_kind') === 'on',
    position: Number.parseInt(String(formData.get('position') ?? '0'), 10) || 0,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }

  const values = parsed.data;

  if (
    values.compare_at_price_cents !== null &&
    values.compare_at_price_cents <= values.base_price_cents
  ) {
    return {
      ok: false,
      message: "Le prix barré doit être supérieur au prix de vente (sinon laissez-le vide).",
    };
  }

  const id = formData.get('id');
  const payload = {
    ...values,
    slug: values.slug?.trim() || slugify(values.name),
    model_name: values.model_name || null,
    subtitle: values.subtitle || null,
    description: values.description || null,
    composition: values.composition || null,
    care_guide: values.care_guide || null,
    manufacturing: values.manufacturing || null,
    origin_country: values.origin_country || null,
    published_at: values.status === 'active' ? new Date().toISOString() : null,
  };

  if (typeof id === 'string' && id) {
    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) return { ok: false, message: friendly(error.message) };
    revalidatePath('/admin/products');
    revalidatePath(`/product/${payload.slug}`);
    return { ok: true, id };
  }

  const { data, error } = await supabase.from('products').insert(payload).select('id').single();
  if (error || !data) return { ok: false, message: friendly(error?.message ?? '') };

  revalidatePath('/admin/products');
  redirect(`/admin/products/${data.id}`);
}

export async function setProductStatus(formData: FormData): Promise<void> {
  const supabase = await assertAdmin();
  if (!supabase) return;

  const id = formData.get('id');
  const status = formData.get('status');
  if (typeof id !== 'string' || typeof status !== 'string') return;

  await supabase
    .from('products')
    .update({
      status: status as 'draft' | 'active' | 'archived',
      published_at: status === 'active' ? new Date().toISOString() : null,
    })
    .eq('id', id);

  revalidatePath('/admin/products');
}

/** Soft delete: the row stays for order history, it just leaves the catalogue. */
export async function archiveProduct(formData: FormData): Promise<void> {
  const supabase = await assertAdmin();
  if (!supabase) return;

  const id = formData.get('id');
  if (typeof id !== 'string') return;

  await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString(), status: 'archived' })
    .eq('id', id);

  revalidatePath('/admin/products');
}

const variantSchema = z.object({
  sku: z.string().trim().min(1, 'SKU requis.').max(60),
  size: z.string().trim().max(20).optional(),
  color_name: z.string().trim().max(60).optional(),
  color_hex: z.string().trim().max(9).optional(),
  price_cents: z.number().int().min(0).nullable(),
  quantity: z.number().int().min(0),
});

export async function saveVariant(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  const supabase = await assertAdmin();
  if (!supabase) return { ok: false, message: 'Accès refusé.' };

  const productId = formData.get('product_id');
  if (typeof productId !== 'string' || !productId) {
    return { ok: false, message: 'Produit inconnu.' };
  }

  const parsed = variantSchema.safeParse({
    sku: formData.get('sku') ?? '',
    size: formData.get('size') || undefined,
    color_name: formData.get('color_name') || undefined,
    color_hex: formData.get('color_hex') || undefined,
    price_cents: toCents(formData.get('price')),
    quantity: Number.parseInt(String(formData.get('quantity') ?? '0'), 10) || 0,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }

  const id = formData.get('id');
  const payload = {
    product_id: productId,
    sku: parsed.data.sku,
    size: parsed.data.size || null,
    color_name: parsed.data.color_name || null,
    color_hex: parsed.data.color_hex || null,
    price_cents: parsed.data.price_cents,
  };

  const variantId =
    typeof id === 'string' && id
      ? ((await supabase.from('product_variants').update(payload).eq('id', id).select('id').single())
          .data?.id ?? null)
      : ((await supabase.from('product_variants').insert(payload).select('id').single()).data?.id ??
        null);

  if (!variantId) return { ok: false, message: "La déclinaison n'a pas pu être enregistrée." };

  // Stock is a separate table so the ledger stays meaningful; setting it here
  // records the correction as a movement.
  const { data: current } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('variant_id', variantId)
    .maybeSingle();

  const delta = parsed.data.quantity - (current?.quantity ?? 0);

  await supabase.from('inventory').upsert(
    { variant_id: variantId, quantity: parsed.data.quantity },
    { onConflict: 'variant_id' },
  );

  if (delta !== 0) {
    await supabase
      .from('inventory_movements')
      .insert({ variant_id: variantId, delta, reason: 'admin_adjustment' });
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/inventory');
  return { ok: true, id: variantId };
}

export async function deleteVariant(formData: FormData): Promise<void> {
  const supabase = await assertAdmin();
  if (!supabase) return;

  const id = formData.get('id');
  if (typeof id !== 'string') return;

  await supabase.from('product_variants').delete().eq('id', id);
  revalidatePath('/admin/products');
}

export async function addProductImage(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  const supabase = await assertAdmin();
  if (!supabase) return { ok: false, message: 'Accès refusé.' };

  const productId = formData.get('product_id');
  const url = formData.get('url');

  if (typeof productId !== 'string' || typeof url !== 'string' || !url.trim()) {
    return { ok: false, message: "L'URL de l'image est requise." };
  }

  const { count } = await supabase
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);

  const { error } = await supabase.from('product_images').insert({
    product_id: productId,
    url: url.trim(),
    alt: (formData.get('alt') as string)?.trim() || null,
    position: count ?? 0,
  });

  if (error) return { ok: false, message: "L'image n'a pas pu être ajoutée." };

  revalidatePath('/admin/products');
  return { ok: true };
}

export async function deleteProductImage(formData: FormData): Promise<void> {
  const supabase = await assertAdmin();
  if (!supabase) return;

  const id = formData.get('id');
  if (typeof id !== 'string') return;

  await supabase.from('product_images').delete().eq('id', id);
  revalidatePath('/admin/products');
}

export async function updateOrderStatus(formData: FormData): Promise<void> {
  const supabase = await assertAdmin();
  if (!supabase) return;

  const id = formData.get('id');
  const status = formData.get('status');
  if (typeof id !== 'string' || typeof status !== 'string') return;

  await supabase
    .from('orders')
    .update({ status: status as never })
    .eq('id', id);

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
}

export async function saveSetting(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  const supabase = await assertAdmin();
  if (!supabase) return { ok: false, message: 'Accès refusé.' };

  const key = formData.get('key');
  const raw = formData.get('value');

  if (typeof key !== 'string' || typeof raw !== 'string') {
    return { ok: false, message: 'Réglage invalide.' };
  }

  // The column is jsonb: anything JSON.parse accepts is a valid value.
  let value: Json;
  try {
    value = JSON.parse(raw) as Json;
  } catch {
    return { ok: false, message: "La valeur doit être un JSON valide." };
  }

  const { error } = await supabase.from('settings').update({ value }).eq('key', key);
  if (error) return { ok: false, message: "Le réglage n'a pas pu être enregistré." };

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function saveShippingMethod(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  const supabase = await assertAdmin();
  if (!supabase) return { ok: false, message: 'Accès refusé.' };

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { ok: false, message: 'Mode de livraison inconnu.' };

  const price = toCents(formData.get('price'));
  const freeAbove = toCents(formData.get('free_above'));

  if (price === null) return { ok: false, message: 'Tarif invalide.' };

  const { error } = await supabase
    .from('shipping_methods')
    .update({
      name: String(formData.get('name') ?? ''),
      description: (formData.get('description') as string) || null,
      price_cents: price,
      free_above_cents: freeAbove,
      is_active: formData.get('is_active') === 'on',
    })
    .eq('id', id);

  if (error) return { ok: false, message: "Le mode de livraison n'a pas pu être enregistré." };

  revalidatePath('/admin/settings');
  return { ok: true };
}

function friendly(message: string) {
  if (message.includes('products_slug_key')) return 'Ce slug est déjà utilisé.';
  if (message.includes('product_variants_sku_key')) return 'Ce SKU est déjà utilisé.';
  if (message.includes('products_compare_at_is_higher')) {
    return 'Le prix barré doit être supérieur au prix de vente.';
  }
  return "L'enregistrement a échoué.";
}
