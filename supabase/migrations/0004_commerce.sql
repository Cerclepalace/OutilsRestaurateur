-- =============================================================================
-- BOBO PARIS — 0004 Commerce
-- Wishlists, carts, shipping, discounts, orders, payments.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Wishlist — server-backed for signed-in customers. Guests keep a local list
-- that is merged into this table on sign-in (see merge_wishlist RPC).
-- -----------------------------------------------------------------------------
create table if not exists public.wishlists (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null unique references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists wishlists_touch on public.wishlists;
create trigger wishlists_touch before update on public.wishlists
  for each row execute function public.touch_updated_at();

create table if not exists public.wishlist_items (
  id           uuid primary key default gen_random_uuid(),
  wishlist_id  uuid not null references public.wishlists (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete cascade,
  variant_id   uuid references public.product_variants (id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (wishlist_id, product_id, variant_id)
);

create index if not exists wishlist_items_wishlist_idx on public.wishlist_items (wishlist_id);

-- Nullable variant_id defeats the UNIQUE above (NULLs never collide), so guard
-- the "whole product" case separately.
create unique index if not exists wishlist_items_product_only
  on public.wishlist_items (wishlist_id, product_id) where variant_id is null;

-- -----------------------------------------------------------------------------
-- Cart — one open cart per customer, or per anonymous token.
-- -----------------------------------------------------------------------------
create table if not exists public.carts (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references public.profiles (id) on delete cascade,
  token       text unique,
  currency    char(3) not null default 'EUR',
  discount_code_id uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  converted_at timestamptz,
  constraint carts_owner_present check (profile_id is not null or token is not null)
);

create unique index if not exists carts_one_open_per_profile
  on public.carts (profile_id) where profile_id is not null and converted_at is null;

drop trigger if exists carts_touch on public.carts;
create trigger carts_touch before update on public.carts
  for each row execute function public.touch_updated_at();

create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts (id) on delete cascade,
  variant_id  uuid not null references public.product_variants (id) on delete cascade,
  quantity    integer not null check (quantity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create index if not exists cart_items_cart_idx on public.cart_items (cart_id);

drop trigger if exists cart_items_touch on public.cart_items;
create trigger cart_items_touch before update on public.cart_items
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Shipping — thresholds are data, not constants in the code.
-- The public BOBO PARIS site states different free-shipping thresholds in
-- different places, which is exactly why these live in the database.
-- -----------------------------------------------------------------------------
create table if not exists public.shipping_methods (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  name            text not null,
  description     text,
  country_codes   char(2)[] not null default '{}',   -- empty array => rest of world
  price_cents     integer not null check (price_cents >= 0),
  free_above_cents integer check (free_above_cents >= 0),
  min_days        integer,
  max_days        integer,
  position        integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists shipping_methods_touch on public.shipping_methods;
create trigger shipping_methods_touch before update on public.shipping_methods
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Discounts
-- -----------------------------------------------------------------------------
create table if not exists public.discounts (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  kind            discount_kind not null,
  value           integer not null check (value >= 0),  -- percent points, or cents
  min_subtotal_cents integer not null default 0,
  starts_at       timestamptz,
  ends_at         timestamptz,
  usage_limit     integer,
  usage_count     integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint discounts_percentage_within_range
    check (kind <> 'percentage' or value between 0 and 100),
  constraint discounts_window_ordered
    check (starts_at is null or ends_at is null or ends_at > starts_at)
);

drop trigger if exists discounts_touch on public.discounts;
create trigger discounts_touch before update on public.discounts
  for each row execute function public.touch_updated_at();

create table if not exists public.discount_codes (
  id          uuid primary key default gen_random_uuid(),
  discount_id uuid not null references public.discounts (id) on delete cascade,
  code        text not null unique,
  created_at  timestamptz not null default now()
);

create index if not exists discount_codes_discount_idx on public.discount_codes (discount_id);

alter table public.carts
  drop constraint if exists carts_discount_code_fk;
alter table public.carts
  add constraint carts_discount_code_fk
  foreign key (discount_code_id) references public.discount_codes (id) on delete set null;

-- -----------------------------------------------------------------------------
-- Orders — immutable commercial record. Addresses and prices are snapshotted so
-- that editing a product later never rewrites history.
-- -----------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1000;

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique default ('BP-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  profile_id        uuid references public.profiles (id) on delete set null,
  email             text not null,
  phone             text,
  status            order_status not null default 'pending',
  currency          char(3) not null default 'EUR',
  subtotal_cents    integer not null check (subtotal_cents >= 0),
  discount_cents    integer not null default 0 check (discount_cents >= 0),
  shipping_cents    integer not null default 0 check (shipping_cents >= 0),
  total_cents       integer not null check (total_cents >= 0),
  discount_code     text,
  shipping_method_code text,
  shipping_address  jsonb not null,
  billing_address   jsonb,
  customer_note     text,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  placed_at         timestamptz,
  cancelled_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists orders_profile_idx on public.orders (profile_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists orders_email_idx on public.orders (lower(email));

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  variant_id      uuid references public.product_variants (id) on delete set null,
  product_id      uuid references public.products (id) on delete set null,
  product_name    text not null,
  variant_label   text,
  sku             text,
  image_url       text,
  slug            text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity        integer not null check (quantity > 0),
  total_cents     integer not null check (total_cents >= 0),
  created_at      timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  provider          text not null default 'stripe',
  provider_reference text,
  status            payment_status not null default 'pending',
  amount_cents      integer not null check (amount_cents >= 0),
  currency          char(3) not null default 'EUR',
  raw_payload       jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists payments_order_idx on public.payments (order_id);
create unique index if not exists payments_provider_reference_idx
  on public.payments (provider, provider_reference) where provider_reference is not null;

drop trigger if exists payments_touch on public.payments;
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();
