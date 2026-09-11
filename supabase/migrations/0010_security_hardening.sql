-- =============================================================================
-- BOBO PARIS — 0010 Security hardening
--
-- Answers the Supabase database linter:
--   * text-search extensions moved out of `public`
--   * every function pinned to an explicit search_path
--   * trigger-only functions taken off the REST surface
-- =============================================================================

create schema if not exists extensions;
grant usage on schema extensions to postgres, anon, authenticated, service_role;

-- The trigram index is an expression index over normalize_text(); drop it while
-- the underlying functions are rebuilt, then recreate it.
drop index if exists public.products_search_idx;

alter extension unaccent set schema extensions;
alter extension pg_trgm set schema extensions;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.unaccent_immutable(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = extensions, public
as $$
  select extensions.unaccent('extensions.unaccent', value);
$$;

create or replace function public.normalize_text(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = public
as $$
  select lower(public.unaccent_immutable(value));
$$;

create or replace function public.variant_price_cents(p_variant_id uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(v.price_cents, p.base_price_cents)
  from public.product_variants v
  join public.products p on p.id = v.product_id
  where v.id = p_variant_id;
$$;

create index if not exists products_search_idx on public.products
  using gin (
    public.normalize_text(
      coalesce(name, '') || ' ' || coalesce(model_name, '') || ' ' || coalesce(description, '')
    ) extensions.gin_trgm_ops
  );

-- Trigger functions are not an API. Take them off the REST surface.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.ensure_inventory_row() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

-- is_admin() answers "am I staff?" — only meaningful once signed in.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- admin_dashboard() guards itself, but do not advertise it to anonymous callers.
revoke all on function public.admin_dashboard() from public, anon;
grant execute on function public.admin_dashboard() to authenticated;
