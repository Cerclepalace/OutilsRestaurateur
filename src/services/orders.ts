import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import type { CartItemInput } from '@/types/cart';
import type { Order, OrderItem } from '@/types/catalog';

export interface AddressInput {
  first_name: string;
  last_name: string;
  company?: string | null;
  line1: string;
  line2?: string | null;
  postal_code: string;
  city: string;
  province?: string | null;
  country_code: string;
  phone?: string | null;
}

export interface CreatedOrder {
  order_id: string;
  order_number: string;
  total_cents: number;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  currency: string;
  email: string;
}

/**
 * Create a pending order.
 *
 * Runs through the `create_order` function, which re-prices the basket, holds
 * the stock and writes the order inside a single transaction. If any line is
 * short, nothing is written and the reservation is rolled back.
 *
 * Called with the request's session so a signed-in customer's order is attached
 * to their profile; guests get an order keyed by email.
 */
export async function createOrder(input: {
  items: CartItemInput[];
  email: string;
  shippingAddress: AddressInput;
  billingAddress?: AddressInput | null;
  shippingMethodCode?: string | null;
  discountCode?: string | null;
  phone?: string | null;
  customerNote?: string | null;
}): Promise<CreatedOrder> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('create_order', {
    p_items: input.items as never,
    p_email: input.email,
    p_shipping_address: input.shippingAddress as never,
    p_billing_address: (input.billingAddress ?? null) as never,
    p_shipping_method_code: input.shippingMethodCode ?? undefined,
    p_discount_code: input.discountCode ?? undefined,
    p_phone: input.phone ?? undefined,
    p_customer_note: input.customerNote ?? undefined,
  });

  if (error) {
    throw new OrderError(error.message);
  }

  return data as unknown as CreatedOrder;
}

/** Raised by `createOrder`; carries the database's machine-readable reason. */
export class OrderError extends Error {
  readonly reason: string;
  readonly sku: string | null;

  constructor(message: string) {
    super(message);
    this.name = 'OrderError';
    const match = /out_of_stock:(.*)$/.exec(message);
    this.sku = match ? match[1].trim() : null;
    this.reason = match
      ? 'out_of_stock'
      : /invalid_email|invalid_shipping_address|empty_cart/.exec(message)?.[0] ?? 'unknown';
  }

  /** A sentence a customer can act on. */
  get customerMessage(): string {
    switch (this.reason) {
      case 'out_of_stock':
        return this.sku
          ? `Une pièce de votre panier vient d'être vendue (${this.sku}). Ajustez la quantité pour continuer.`
          : "Une pièce de votre panier n'est plus disponible.";
      case 'invalid_email':
        return "L'adresse e-mail saisie n'est pas valide.";
      case 'invalid_shipping_address':
        return "L'adresse de livraison est incomplète.";
      case 'empty_cart':
        return 'Votre panier est vide.';
      default:
        return "La commande n'a pas pu être créée. Réessayez dans un instant.";
    }
  }
}

/** Guest-safe order lookup: order number plus the email it was placed with. */
export async function lookupOrder(orderNumber: string, email: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('lookup_order', {
    p_order_number: orderNumber,
    p_email: email,
  });

  if (error || !data) return null;
  return data as unknown as Order & { items: OrderItem[] };
}

/** Orders belonging to the signed-in customer. RLS does the filtering. */
export async function getMyOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('*, order_items (*)')
    .neq('status', 'pending')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getMyOrder(orderNumber: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('*, order_items (*)')
    .eq('order_number', orderNumber)
    .maybeSingle();
  return data;
}
