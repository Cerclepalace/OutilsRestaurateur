-- =============================================================================
-- BOBO PARIS — 0011 Role grants
--
-- A hosted Supabase project grants `anon` and `authenticated` table access by
-- default, but a self-hosted stack or a plain Postgres does not. Stating the
-- grants explicitly makes the schema portable: apply these migrations to any
-- Postgres with the standard Supabase roles and the storefront works.
--
-- These are table-level grants only. Row Level Security (0006) still decides
-- which rows each role can actually see or change.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Read-only for anonymous visitors: catalogue, content, commercial rules.
grant select on
  public.categories,
  public.collections,
  public.collection_products,
  public.products,
  public.product_variants,
  public.product_images,
  public.product_videos,
  public.product_recommendations,
  public.inventory,
  public.reviews,
  public.shipping_methods,
  public.pages,
  public.page_sections,
  public.navigation_items,
  public.settings,
  public.stores
to anon, authenticated;

-- Anyone may subscribe to the newsletter; only staff may read the list (RLS).
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, update, delete on public.newsletter_subscribers to authenticated;

-- Signed-in customers own their profile, addresses, wishlist, cart and orders.
grant select, insert, update, delete on
  public.profiles,
  public.addresses,
  public.wishlists,
  public.wishlist_items,
  public.carts,
  public.cart_items
to authenticated;

grant select, insert, update, delete on public.reviews to authenticated;

-- Orders are written by SECURITY DEFINER functions; staff may administer them
-- and RLS confines everyone else to their own rows.
grant select, insert, update, delete on
  public.orders,
  public.order_items,
  public.payments
to authenticated;

-- Staff administration of the catalogue and content happens through the same
-- client, gated by is_admin() in the RLS policies.
grant insert, update, delete on
  public.categories,
  public.collections,
  public.collection_products,
  public.products,
  public.product_variants,
  public.product_images,
  public.product_videos,
  public.product_recommendations,
  public.inventory,
  public.shipping_methods,
  public.discounts,
  public.discount_codes,
  public.pages,
  public.page_sections,
  public.navigation_items,
  public.settings,
  public.stores
to authenticated;

grant select on public.discounts, public.discount_codes, public.inventory_movements to authenticated;
grant insert on public.inventory_movements to authenticated;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;
