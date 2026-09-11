-- =============================================================================
-- BOBO PARIS — 0002 Identity
-- Customer profiles mirrored from auth.users, address book, admin predicate.
-- =============================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  first_name    text,
  last_name     text,
  phone         text,
  role          user_role not null default 'customer',
  accepts_marketing boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Public mirror of auth.users. Role drives every admin authorisation check.';

create index if not exists profiles_role_idx on public.profiles (role) where role <> 'customer';

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Create the profile row the moment Supabase Auth creates the user, so the
-- application never has to deal with a signed-in user that has no profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, accepts_marketing)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce((new.raw_user_meta_data ->> 'accepts_marketing')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Address book
-- -----------------------------------------------------------------------------
create table if not exists public.addresses (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  label         text,
  first_name    text not null,
  last_name     text not null,
  company       text,
  line1         text not null,
  line2         text,
  postal_code   text not null,
  city          text not null,
  province      text,
  country_code  char(2) not null default 'FR',
  phone         text,
  is_default_shipping boolean not null default false,
  is_default_billing  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists addresses_profile_idx on public.addresses (profile_id);

-- At most one default of each kind per customer.
create unique index if not exists addresses_one_default_shipping
  on public.addresses (profile_id) where is_default_shipping;
create unique index if not exists addresses_one_default_billing
  on public.addresses (profile_id) where is_default_billing;

drop trigger if exists addresses_touch on public.addresses;
create trigger addresses_touch before update on public.addresses
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Admin predicate (depends on profiles)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'staff')
  );
$$;

comment on function public.is_admin is
  'True when the current auth user holds a staff or admin role. Used by RLS policies.';
