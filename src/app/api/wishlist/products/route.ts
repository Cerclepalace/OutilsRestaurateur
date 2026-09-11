import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createPublicClient } from '@/lib/supabase/public';

/**
 * Hydrates a wishlist held in the browser.
 *
 * The client stores only product ids; this returns the cards to render them,
 * filtered by the catalogue's own visibility rules (a delisted product simply
 * drops out of the list).
 */
const schema = z.object({ ids: z.array(z.string().uuid()).max(200) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  if (parsed.data.ids.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, slug, name, model_name, subtitle, audience, is_new, is_one_of_a_kind,
       base_price_cents, compare_at_price_cents, currency,
       product_images ( url, alt, position ),
       product_variants ( size, color_name, color_hex, is_active,
         inventory ( quantity, reserved, track_inventory, allow_backorder ) )`,
    )
    .in('id', parsed.data.ids)
    .eq('status', 'active')
    .is('deleted_at', null);

  if (error) {
    console.error('[api/wishlist/products]', error);
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 });
  }

  const items = (data ?? []).map((product) => {
    const variants = (product.product_variants ?? []).filter((v) => v.is_active);
    const colors = new Map<string, { name: string; hex: string | null }>();
    const sizes = new Set<string>();

    for (const variant of variants) {
      if (variant.color_name) {
        colors.set(variant.color_name, { name: variant.color_name, hex: variant.color_hex });
      }
      if (variant.size) sizes.add(variant.size);
    }

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      model_name: product.model_name,
      subtitle: product.subtitle,
      audience: product.audience,
      is_new: product.is_new,
      is_one_of_a_kind: product.is_one_of_a_kind,
      price_cents: product.base_price_cents,
      compare_at_price_cents: product.compare_at_price_cents,
      currency: product.currency,
      images: (product.product_images ?? [])
        .sort((a, b) => a.position - b.position)
        .map((image) => ({ url: image.url, alt: image.alt })),
      colors: [...colors.values()],
      sizes: [...sizes],
      in_stock: variants.some((variant) => {
        const inventory = Array.isArray(variant.inventory)
          ? variant.inventory[0]
          : variant.inventory;
        if (!inventory || !inventory.track_inventory || inventory.allow_backorder) return true;
        return inventory.quantity - inventory.reserved > 0;
      }),
    };
  });

  // Preserve the order the shopper saved them in.
  const order = new Map(parsed.data.ids.map((id, index) => [id, index]));
  items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return NextResponse.json({ items });
}
