import 'server-only';

import { createClient } from '@/lib/supabase/server';

/**
 * Admin data access.
 *
 * Everything runs through the signed-in user's client: the admin RLS policies
 * (`is_admin()`) are what grant access, so a customer hitting these functions
 * simply gets nothing back rather than an error that leaks the shape of the
 * data.
 */

export interface DashboardStats {
  revenue_cents: number;
  revenue_30d_cents: number;
  orders_count: number;
  orders_pending: number;
  customers_count: number;
  products_active: number;
  products_draft: number;
  low_stock: {
    sku: string;
    product: string;
    size: string | null;
    color: string | null;
    available: number;
  }[];
  recent_orders: {
    id: string;
    order_number: string;
    email: string;
    status: string;
    total_cents: number;
    created_at: string;
  }[];
  newsletter_count: number;
}

export async function getDashboard(): Promise<DashboardStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_dashboard');
  if (error) return null;
  return data as unknown as DashboardStats;
}

export async function listAdminProducts(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('products')
    .select(
      `id, slug, name, model_name, status, audience, base_price_cents, compare_at_price_cents,
       is_new, is_one_of_a_kind, position, updated_at,
       categories ( name ),
       product_variants ( id, sku, inventory ( quantity, reserved ) )`,
    )
    .is('deleted_at', null)
    .order('position');

  if (search) query = query.ilike('name', `%${search}%`);

  const { data } = await query;
  return data ?? [];
}

export async function getAdminProduct(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select(
      `*,
       product_images ( id, url, alt, position ),
       product_variants ( id, sku, size, color_name, color_hex, price_cents, is_active, position,
         inventory ( quantity, reserved, low_stock_threshold, track_inventory ) ),
       collection_products ( collection_id )`,
    )
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function listAdminCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('position');
  return data ?? [];
}

export async function listAdminCollections() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('collections')
    .select('*, collection_products ( product_id )')
    .is('deleted_at', null)
    .order('position');
  return data ?? [];
}

export async function listAdminOrders(status?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('orders')
    .select('*, order_items ( id, quantity )')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status as never);

  const { data } = await query;
  return data ?? [];
}

export async function getAdminOrder(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('*, order_items (*), payments (*)')
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function listAdminCustomers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function listInventory(lowOnly = false) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('product_variants')
    .select(
      `id, sku, size, color_name, is_active,
       products ( name, slug, status ),
       inventory ( quantity, reserved, low_stock_threshold, track_inventory, allow_backorder )`,
    )
    .order('sku');

  const rows = data ?? [];
  if (!lowOnly) return rows;

  return rows.filter((row) => {
    const inventory = Array.isArray(row.inventory) ? row.inventory[0] : row.inventory;
    if (!inventory?.track_inventory) return false;
    return inventory.quantity - inventory.reserved <= inventory.low_stock_threshold;
  });
}

export async function listNewsletter() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  return data ?? [];
}

export async function listAdminPages() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('pages')
    .select('*, page_sections ( id, kind, position, is_published )')
    .order('slug');
  return data ?? [];
}

export async function listSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from('settings').select('*').order('key');
  return data ?? [];
}

export async function listShippingMethodsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from('shipping_methods').select('*').order('position');
  return data ?? [];
}
