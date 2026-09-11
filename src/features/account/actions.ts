'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { addressSchema } from '@/lib/validation';
import { z } from 'zod';

/**
 * Account mutations.
 *
 * Every one of these runs as the signed-in user, so Row Level Security is what
 * actually decides whether a write lands — the checks here are for a helpful
 * error message, not for security.
 */

export type ActionResult = { ok: true } | { ok: false; message: string };

const profileSchema = z.object({
  first_name: z.string().trim().max(80).optional(),
  last_name: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(32).optional(),
  accepts_marketing: z.coerce.boolean().optional(),
});

export async function updateProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: 'Vous devez être connecté.' };

  const parsed = profileSchema.safeParse({
    first_name: formData.get('first_name') ?? undefined,
    last_name: formData.get('last_name') ?? undefined,
    phone: formData.get('phone') ?? undefined,
    accepts_marketing: formData.get('accepts_marketing') === 'on',
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: parsed.data.first_name || null,
      last_name: parsed.data.last_name || null,
      phone: parsed.data.phone || null,
      accepts_marketing: parsed.data.accepts_marketing ?? false,
    })
    .eq('id', user.id);

  if (error) return { ok: false, message: "Le profil n'a pas pu être enregistré." };

  revalidatePath('/account/profile');
  return { ok: true };
}

export async function saveAddress(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: 'Vous devez être connecté.' };

  const parsed = addressSchema.safeParse({
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    line1: formData.get('line1'),
    line2: formData.get('line2') || null,
    postal_code: formData.get('postal_code'),
    city: formData.get('city'),
    country_code: formData.get('country_code'),
    phone: formData.get('phone') || null,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Adresse invalide.' };
  }

  const id = formData.get('id');
  const isDefault = formData.get('is_default_shipping') === 'on';

  // Only one default per customer: clear the previous one first, since the
  // partial unique index would otherwise reject the write.
  if (isDefault) {
    await supabase
      .from('addresses')
      .update({ is_default_shipping: false })
      .eq('profile_id', user.id)
      .eq('is_default_shipping', true);
  }

  const payload = {
    ...parsed.data,
    profile_id: user.id,
    is_default_shipping: isDefault,
  };

  const { error } =
    typeof id === 'string' && id
      ? await supabase.from('addresses').update(payload).eq('id', id)
      : await supabase.from('addresses').insert(payload);

  if (error) return { ok: false, message: "L'adresse n'a pas pu être enregistrée." };

  revalidatePath('/account/addresses');
  return { ok: true };
}

export async function deleteAddress(formData: FormData): Promise<void> {
  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return;

  const supabase = await createClient();
  await supabase.from('addresses').delete().eq('id', id);
  revalidatePath('/account/addresses');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
