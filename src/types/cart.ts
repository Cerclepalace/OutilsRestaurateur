/** Cart shapes shared by the client store and the server pricing function. */

/** What the browser persists: intent only, never a price. */
export interface CartItemInput {
  variant_id: string;
  quantity: number;
}

/** A line as priced by the database. */
export interface PricedLine {
  variant_id: string;
  product_id: string;
  slug: string;
  name: string;
  model_name: string | null;
  sku: string;
  size: string | null;
  color_name: string | null;
  unit_price_cents: number;
  compare_at_price_cents: number | null;
  image_url: string | null;
  quantity: number;
  requested_quantity: number;
  available: number;
  in_stock: boolean;
  /** True when stock forced the quantity below what the shopper asked for. */
  adjusted: boolean;
  line_total_cents: number;
}

export interface DiscountResult {
  valid: boolean;
  reason?: string;
  code?: string;
  name?: string;
  kind?: string;
  amount_cents?: number;
  free_shipping?: boolean;
  min_subtotal_cents?: number;
}

export interface PricedCart {
  lines: PricedLine[];
  item_count: number;
  subtotal_cents: number;
  discount_cents: number;
  discount: DiscountResult | null;
  shipping_cents: number;
  shipping_method: {
    code: string;
    name: string;
    description: string | null;
    price_cents: number;
    free_above_cents: number | null;
    min_days: number | null;
    max_days: number | null;
  } | null;
  total_cents: number;
  currency: string;
}

export interface WishlistEntry {
  product_id: string;
  variant_id: string | null;
}
