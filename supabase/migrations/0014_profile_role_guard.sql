-- =============================================================================
-- BOBO PARIS — 0014 Close the privilege-escalation hole on profiles.role
--
-- THE BUG
--
-- `profiles_update_own` allowed a customer to update their own row:
--
--   for update using (id = auth.uid()) with check (id = auth.uid())
--
-- Row Level Security decides which ROWS a role may touch, never which COLUMNS.
-- Both clauses were satisfied by:
--
--   update public.profiles set role = 'admin' where id = auth.uid();
--
-- and `is_admin()` reads exactly that column. Any signed-in customer could
-- therefore grant themselves staff rights and reach every order, every
-- customer record and the whole back office.
--
-- THE FIX, in two independent layers
--
--   1. Column-level privileges: `authenticated` may update only the four
--      fields a customer owns. Postgres refuses the statement before RLS is
--      even consulted.
--   2. A trigger that rejects any role change arriving through the REST roles,
--      so a future broad `grant update` cannot silently reopen the hole.
--
-- Changing a role stays a deliberate act, performed with the service role or
-- directly in SQL:
--
--   update public.profiles set role = 'admin' where email = '…';
-- =============================================================================

-- Layer 1 — column privileges.
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone, accepts_marketing)
  on public.profiles to authenticated;

-- `email` is deliberately excluded too: it mirrors auth.users and is shown as
-- read-only in the account screen.

-- Layer 2 — trigger guard.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and current_user in ('anon', 'authenticated') then
    raise exception 'role_change_forbidden'
      using errcode = '42501',
            hint = 'Roles are changed with the service role or directly in SQL.';
  end if;
  return new;
end;
$$;

comment on function public.guard_profile_role is
  'Defence in depth for profiles.role: a request arriving through PostgREST as anon or authenticated can never change a role.';

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update of role on public.profiles
  for each row execute function public.guard_profile_role();

revoke all on function public.guard_profile_role() from public, anon, authenticated;
