-- =============================================================================
-- BOBO PARIS — 0005 Content
-- CMS pages and sections, database-driven navigation, settings, newsletter,
-- stockists.
-- =============================================================================

create table if not exists public.pages (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  subtitle      text,
  is_published  boolean not null default true,
  seo_title     text,
  seo_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists pages_touch on public.pages;
create trigger pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

-- Sections are typed blocks; `content` holds the props for that block type.
-- The renderer validates every block with Zod before rendering it.
create table if not exists public.page_sections (
  id            uuid primary key default gen_random_uuid(),
  page_id       uuid not null references public.pages (id) on delete cascade,
  kind          page_section_kind not null,
  content       jsonb not null default '{}'::jsonb,
  position      integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists page_sections_page_idx on public.page_sections (page_id, position);

drop trigger if exists page_sections_touch on public.page_sections;
create trigger page_sections_touch before update on public.page_sections
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Navigation — the mega menu is data, so merchandising can change it without
-- a deploy.
-- -----------------------------------------------------------------------------
create table if not exists public.navigation_items (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references public.navigation_items (id) on delete cascade,
  location      text not null default 'header',   -- header | footer | mobile
  label         text not null,
  href          text,
  column_label  text,
  image_url     text,
  position      integer not null default 0,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint navigation_items_not_self_parent check (parent_id is distinct from id)
);

create index if not exists navigation_items_location_idx
  on public.navigation_items (location, parent_id, position);

drop trigger if exists navigation_items_touch on public.navigation_items;
create trigger navigation_items_touch before update on public.navigation_items
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Settings — commercial rules and storefront copy, editable from the admin.
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Newsletter
-- -----------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  source        text,
  is_confirmed  boolean not null default false,
  unsubscribed_at timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists newsletter_active_idx
  on public.newsletter_subscribers (created_at desc) where unsubscribed_at is null;

-- -----------------------------------------------------------------------------
-- Stores / stockists
-- -----------------------------------------------------------------------------
create table if not exists public.stores (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  kind          text not null default 'stockist',   -- flagship | stockist | popup
  address_line  text,
  postal_code   text,
  city          text,
  country_code  char(2) not null default 'FR',
  latitude      numeric(9,6),
  longitude     numeric(9,6),
  opening_hours jsonb,
  phone         text,
  url           text,
  is_published  boolean not null default true,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists stores_touch on public.stores;
create trigger stores_touch before update on public.stores
  for each row execute function public.touch_updated_at();
