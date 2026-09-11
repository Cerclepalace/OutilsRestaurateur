-- =============================================================================
-- BOBO PARIS — 0003 Catalog
-- Categories, collections, products, variants, media, server-side inventory.
-- Money is stored as integer cents; never floats.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Categories (self-nesting tree: Femme > Manteaux & Vestes)
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references public.categories (id) on delete set null,
  slug          text not null unique,
  name          text not null,
  description   text,
  audience      audience,
  image_url     text,
  position      integer not null default 0,
  is_published  boolean not null default true,
  show_in_nav   boolean not null default true,
  seo_title     text,
  seo_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  constraint categories_not_self_parent check (parent_id is distinct from id)
);

create index if not exists categories_parent_idx on public.categories (parent_id, position);
create index if not exists categories_audience_idx on public.categories (audience) where deleted_at is null;

drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Collections (capsules: Les Jours Chauds, L'Héritage Bleu, ...)
-- -----------------------------------------------------------------------------
create table if not exists public.collections (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  subtitle      text,
  description   text,
  story         text,
  cover_image_url text,
  hero_image_url  text,
  hero_video_url  text,
  position      integer not null default 0,
  is_published  boolean not null default true,
  is_featured   boolean not null default false,
  published_at  timestamptz,
  seo_title     text,
  seo_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists collections_published_idx
  on public.collections (is_published, position) where deleted_at is null;

drop trigger if exists collections_touch on public.collections;
create trigger collections_touch before update on public.collections
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Products
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  model_name      text,                       -- "Camille", "Gauthier" — the BOBO naming ritual
  subtitle        text,
  description     text,
  composition     text,
  care_guide      text,
  manufacturing   text,                       -- "Atelier parisien", "Casablanca"
  origin_country  text,
  category_id     uuid references public.categories (id) on delete set null,
  audience        audience not null default 'unisexe',
  status          product_status not null default 'draft',
  is_one_of_a_kind boolean not null default false,
  is_new          boolean not null default false,
  base_price_cents integer not null check (base_price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents >= 0),
  currency        char(3) not null default 'EUR',
  size_guide      jsonb,
  published_at    timestamptz,
  position        integer not null default 0,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  constraint products_compare_at_is_higher
    check (compare_at_price_cents is null or compare_at_price_cents > base_price_cents)
);

create index if not exists products_status_idx
  on public.products (status, published_at desc) where deleted_at is null;
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_audience_idx on public.products (audience);
create index if not exists products_price_idx on public.products (base_price_cents);

-- Accent-insensitive fuzzy search over the customer-visible text.
create index if not exists products_search_idx on public.products
  using gin (public.normalize_text(coalesce(name, '') || ' ' || coalesce(model_name, '') || ' ' || coalesce(description, '')) gin_trgm_ops);

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Variants — the unit that actually carries stock and gets sold
-- -----------------------------------------------------------------------------
create table if not exists public.product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  sku           text not null unique,
  size          text,
  color_name    text,
  color_hex     text,
  price_cents   integer check (price_cents >= 0),          -- null => inherit product price
  compare_at_price_cents integer check (compare_at_price_cents >= 0),
  barcode       text,
  weight_grams  integer,
  position      integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists product_variants_product_idx
  on public.product_variants (product_id, position);
create unique index if not exists product_variants_unique_combo
  on public.product_variants (product_id, coalesce(size, ''), coalesce(color_name, ''));

drop trigger if exists product_variants_touch on public.product_variants;
create trigger product_variants_touch before update on public.product_variants
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Inventory — one row per variant, the single source of truth for stock.
-- Never trusted from the client; only mutated through SECURITY DEFINER functions.
-- -----------------------------------------------------------------------------
create table if not exists public.inventory (
  variant_id      uuid primary key references public.product_variants (id) on delete cascade,
  quantity        integer not null default 0 check (quantity >= 0),
  reserved        integer not null default 0 check (reserved >= 0),
  low_stock_threshold integer not null default 2,
  track_inventory boolean not null default true,
  allow_backorder boolean not null default false,
  updated_at      timestamptz not null default now(),
  constraint inventory_reserved_within_quantity check (reserved <= quantity)
);

comment on column public.inventory.reserved is
  'Units held by an in-flight checkout. available = quantity - reserved.';

drop trigger if exists inventory_touch on public.inventory;
create trigger inventory_touch before update on public.inventory
  for each row execute function public.touch_updated_at();

-- Audit ledger: every stock movement is explainable after the fact.
create table if not exists public.inventory_movements (
  id            bigserial primary key,
  variant_id    uuid not null references public.product_variants (id) on delete cascade,
  delta         integer not null,
  reason        text not null,
  reference_id  uuid,
  created_at    timestamptz not null default now()
);

create index if not exists inventory_movements_variant_idx
  on public.inventory_movements (variant_id, created_at desc);

-- Every variant gets an inventory row automatically.
create or replace function public.ensure_inventory_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.inventory (variant_id) values (new.id)
  on conflict (variant_id) do nothing;
  return new;
end;
$$;

drop trigger if exists product_variants_inventory on public.product_variants;
create trigger product_variants_inventory after insert on public.product_variants
  for each row execute function public.ensure_inventory_row();

-- -----------------------------------------------------------------------------
-- Media
-- -----------------------------------------------------------------------------
create table if not exists public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  variant_id    uuid references public.product_variants (id) on delete set null,
  url           text not null,
  alt           text,
  width         integer,
  height        integer,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists product_images_product_idx
  on public.product_images (product_id, position);

create table if not exists public.product_videos (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  url           text not null,
  poster_url    text,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists product_videos_product_idx
  on public.product_videos (product_id, position);

-- -----------------------------------------------------------------------------
-- Collection membership
-- -----------------------------------------------------------------------------
create table if not exists public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  position      integer not null default 0,
  primary key (collection_id, product_id)
);

create index if not exists collection_products_product_idx
  on public.collection_products (product_id);

-- -----------------------------------------------------------------------------
-- Editorially curated cross-sell ("Vous pourriez aimer", "Compléter le look")
-- -----------------------------------------------------------------------------
create table if not exists public.product_recommendations (
  product_id      uuid not null references public.products (id) on delete cascade,
  recommended_id  uuid not null references public.products (id) on delete cascade,
  kind            text not null default 'similar',
  position        integer not null default 0,
  primary key (product_id, recommended_id, kind),
  constraint product_recommendations_not_self check (product_id <> recommended_id)
);

-- -----------------------------------------------------------------------------
-- Reviews — schema exists so the feature can be switched on with real data.
-- No seeded content: a fabricated review is a lie to the customer.
-- -----------------------------------------------------------------------------
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  profile_id    uuid references public.profiles (id) on delete set null,
  rating        smallint not null check (rating between 1 and 5),
  title         text,
  body          text,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists reviews_product_idx
  on public.reviews (product_id) where is_published;

drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch before update on public.reviews
  for each row execute function public.touch_updated_at();
