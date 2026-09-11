-- =============================================================================
-- BOBO PARIS — 0006 Row Level Security
--
-- Posture: every table is locked by default. The storefront reads published
-- catalogue and content anonymously; everything that belongs to a customer is
-- reachable only by that customer; everything that changes money or stock goes
-- through a SECURITY DEFINER function in 0007 rather than a direct write.
--
-- The guest cart deliberately has no table: it lives in the browser and is
-- re-priced server-side at checkout, so an anonymous visitor never needs write
-- access to commerce tables.
-- =============================================================================

alter table public.profiles              enable row level security;
alter table public.addresses             enable row level security;
alter table public.categories            enable row level security;
alter table public.collections           enable row level security;
alter table public.products              enable row level security;
alter table public.product_variants      enable row level security;
alter table public.product_images        enable row level security;
alter table public.product_videos        enable row level security;
alter table public.collection_products   enable row level security;
alter table public.product_recommendations enable row level security;
alter table public.inventory             enable row level security;
alter table public.inventory_movements   enable row level security;
alter table public.reviews               enable row level security;
alter table public.wishlists             enable row level security;
alter table public.wishlist_items        enable row level security;
alter table public.carts                 enable row level security;
alter table public.cart_items            enable row level security;
alter table public.shipping_methods      enable row level security;
alter table public.discounts             enable row level security;
alter table public.discount_codes        enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.payments              enable row level security;
alter table public.pages                 enable row level security;
alter table public.page_sections         enable row level security;
alter table public.navigation_items      enable row level security;
alter table public.settings              enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.stores                enable row level security;

-- -----------------------------------------------------------------------------
-- Identity
-- -----------------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists addresses_own on public.addresses;
create policy addresses_own on public.addresses
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists addresses_admin_read on public.addresses;
create policy addresses_admin_read on public.addresses
  for select using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Catalogue — anonymous read of what is published, admin write.
-- -----------------------------------------------------------------------------
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select using (is_published and deleted_at is null);

drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists collections_public_read on public.collections;
create policy collections_public_read on public.collections
  for select using (is_published and deleted_at is null);

drop policy if exists collections_admin_all on public.collections;
create policy collections_admin_all on public.collections
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (status = 'active' and deleted_at is null);

drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists product_variants_public_read on public.product_variants;
create policy product_variants_public_read on public.product_variants
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.deleted_at is null
    )
  );

drop policy if exists product_variants_admin_all on public.product_variants;
create policy product_variants_admin_all on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.deleted_at is null
    )
  );

drop policy if exists product_images_admin_all on public.product_images;
create policy product_images_admin_all on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists product_videos_public_read on public.product_videos;
create policy product_videos_public_read on public.product_videos
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'active' and p.deleted_at is null
    )
  );

drop policy if exists product_videos_admin_all on public.product_videos;
create policy product_videos_admin_all on public.product_videos
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists collection_products_public_read on public.collection_products;
create policy collection_products_public_read on public.collection_products
  for select using (true);

drop policy if exists collection_products_admin_all on public.collection_products;
create policy collection_products_admin_all on public.collection_products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists product_recommendations_public_read on public.product_recommendations;
create policy product_recommendations_public_read on public.product_recommendations
  for select using (true);

drop policy if exists product_recommendations_admin_all on public.product_recommendations;
create policy product_recommendations_admin_all on public.product_recommendations
  for all using (public.is_admin()) with check (public.is_admin());

-- Availability is public information; mutation is not.
drop policy if exists inventory_public_read on public.inventory;
create policy inventory_public_read on public.inventory
  for select using (true);

drop policy if exists inventory_admin_all on public.inventory;
create policy inventory_admin_all on public.inventory
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists inventory_movements_admin on public.inventory_movements;
create policy inventory_movements_admin on public.inventory_movements
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select using (is_published or profile_id = auth.uid() or public.is_admin());

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert with check (profile_id = auth.uid());

drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Customer-owned commerce data
-- -----------------------------------------------------------------------------
drop policy if exists wishlists_own on public.wishlists;
create policy wishlists_own on public.wishlists
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists wishlist_items_own on public.wishlist_items;
create policy wishlist_items_own on public.wishlist_items
  for all using (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.profile_id = auth.uid())
  ) with check (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.profile_id = auth.uid())
  );

drop policy if exists carts_own on public.carts;
create policy carts_own on public.carts
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists cart_items_own on public.cart_items;
create policy cart_items_own on public.cart_items
  for all using (
    exists (select 1 from public.carts c where c.id = cart_id and c.profile_id = auth.uid())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_id and c.profile_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- Orders — readable by the customer who placed them, written only by the
-- checkout function and the Stripe webhook.
-- -----------------------------------------------------------------------------
drop policy if exists orders_select_own on public.orders;
create policy orders_select_own on public.orders
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists orders_admin_write on public.orders;
create policy orders_admin_write on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_select_own on public.order_items;
create policy order_items_select_own on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.profile_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists order_items_admin_write on public.order_items;
create policy order_items_admin_write on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.profile_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists payments_admin_write on public.payments;
create policy payments_admin_write on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Commercial rules
-- -----------------------------------------------------------------------------
drop policy if exists shipping_methods_public_read on public.shipping_methods;
create policy shipping_methods_public_read on public.shipping_methods
  for select using (is_active);

drop policy if exists shipping_methods_admin_all on public.shipping_methods;
create policy shipping_methods_admin_all on public.shipping_methods
  for all using (public.is_admin()) with check (public.is_admin());

-- No public read: codes must not be enumerable. Validation goes through the
-- validate_discount_code function instead.
drop policy if exists discounts_admin_all on public.discounts;
create policy discounts_admin_all on public.discounts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists discount_codes_admin_all on public.discount_codes;
create policy discount_codes_admin_all on public.discount_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Content
-- -----------------------------------------------------------------------------
drop policy if exists pages_public_read on public.pages;
create policy pages_public_read on public.pages
  for select using (is_published);

drop policy if exists pages_admin_all on public.pages;
create policy pages_admin_all on public.pages
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists page_sections_public_read on public.page_sections;
create policy page_sections_public_read on public.page_sections
  for select using (
    is_published and exists (select 1 from public.pages p where p.id = page_id and p.is_published)
  );

drop policy if exists page_sections_admin_all on public.page_sections;
create policy page_sections_admin_all on public.page_sections
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists navigation_items_public_read on public.navigation_items;
create policy navigation_items_public_read on public.navigation_items
  for select using (is_published);

drop policy if exists navigation_items_admin_all on public.navigation_items;
create policy navigation_items_admin_all on public.navigation_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Storefront configuration only. Never put a secret in this table.
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings
  for select using (true);

drop policy if exists settings_admin_all on public.settings;
create policy settings_admin_all on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Anyone may subscribe; only staff may read the list.
drop policy if exists newsletter_insert_anyone on public.newsletter_subscribers;
create policy newsletter_insert_anyone on public.newsletter_subscribers
  for insert with check (true);

drop policy if exists newsletter_admin_all on public.newsletter_subscribers;
create policy newsletter_admin_all on public.newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists stores_public_read on public.stores;
create policy stores_public_read on public.stores
  for select using (is_published);

drop policy if exists stores_admin_all on public.stores;
create policy stores_admin_all on public.stores
  for all using (public.is_admin()) with check (public.is_admin());
