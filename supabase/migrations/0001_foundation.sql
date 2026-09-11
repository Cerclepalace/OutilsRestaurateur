-- =============================================================================
-- BOBO PARIS — 0001 Foundation
-- Extensions, enums, shared helpers, audit columns.
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type product_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type audience as enum ('femme', 'homme', 'unisexe');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'authorized', 'succeeded', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discount_kind as enum ('percentage', 'fixed_amount', 'free_shipping');
exception when duplicate_object then null; end $$;

do $$ begin
  create type page_section_kind as enum (
    'hero', 'image_text', 'product_grid', 'collection_grid',
    'editorial', 'banner', 'video', 'manifesto', 'commitments', 'newsletter', 'rich_text'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('customer', 'staff', 'admin');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------

-- Keeps updated_at honest without trusting the client.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- unaccent() is stable, not immutable; wrap it so it can be used in indexes.
create or replace function public.unaccent_immutable(value text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select public.unaccent('public.unaccent', value);
$$;

-- Accent/case-insensitive text used by search indexes and filters.
create or replace function public.normalize_text(value text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select lower(public.unaccent_immutable(value));
$$;
