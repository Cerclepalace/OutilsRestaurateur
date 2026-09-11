import 'server-only';

import { createPublicClient } from '@/lib/supabase/public';
import { formatPrice } from '@/lib/format';
import type { ShippingMethod } from '@/types/catalog';

/**
 * Commercial rules and storefront copy, read from the `settings` table.
 *
 * Nothing here is hardcoded: the free-shipping thresholds, the announcement
 * bar and the commitments block are all editable from the admin.
 */

export interface Announcement {
  message: string;
  href?: string;
  enabled: boolean;
}

export interface Commitment {
  title: string;
  body: string;
}

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error || !data) return fallback;
  return data.value as T;
}

/**
 * Token the announcement copy can use to quote the live free-shipping
 * threshold, e.g. "Livraison offerte dès {seuil_franco} d'achat".
 *
 * The banner is merchant-written prose, so it stays editable — but a number
 * typed into it would go stale the moment the threshold changes in the admin,
 * and a banner advertising a condition the checkout does not honour is a
 * commercial problem, not a cosmetic one. A message without the token is
 * rendered exactly as written.
 */
const FREE_SHIPPING_TOKEN = '{seuil_franco}';

export async function getAnnouncement(): Promise<Announcement | null> {
  const value = await readSetting<Announcement | null>('announcement', null);
  if (!value?.enabled) return null;
  if (!value.message.includes(FREE_SHIPPING_TOKEN)) return value;

  const threshold = await getFreeShippingThreshold('FR');
  return {
    ...value,
    message: value.message.replaceAll(
      FREE_SHIPPING_TOKEN,
      threshold === null ? '' : formatPrice(threshold),
    ),
  };
}

export async function getCommitments(): Promise<Commitment[]> {
  return readSetting<Commitment[]>('commitments', []);
}

export async function getShippingMethods(): Promise<ShippingMethod[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('shipping_methods')
    .select('*')
    .eq('is_active', true)
    .order('position');
  return data ?? [];
}

/**
 * The free-shipping threshold for a country, used by the cart's progress hint.
 * Returns null when no method for that country offers free shipping.
 */
export async function getFreeShippingThreshold(countryCode = 'FR'): Promise<number | null> {
  const methods = await getShippingMethods();
  const candidates = methods.filter(
    (m) =>
      m.free_above_cents !== null &&
      (m.country_codes.length === 0 || m.country_codes.includes(countryCode)),
  );
  if (candidates.length === 0) return null;
  return Math.min(...candidates.map((m) => m.free_above_cents as number));
}
