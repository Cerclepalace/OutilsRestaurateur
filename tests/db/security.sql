-- =============================================================================
-- BOBO PARIS — database security suite
--
-- Exercises Row Level Security and the commerce functions as the roles that
-- actually reach them (anon, authenticated), not as the superuser. Running
-- these as `postgres` would prove nothing: a superuser bypasses RLS.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/db/security.sql
--
-- Any failed assertion aborts with a non-zero exit code.
-- =============================================================================

\set ON_ERROR_STOP on
\timing off

begin;

-- --------------------------------------------------------------------------
-- Fixtures: two customers and one staff member.
-- --------------------------------------------------------------------------
create temporary table t_ids (label text primary key, id uuid);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'alice@test.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'bob@test.invalid'),
  ('33333333-3333-4333-8333-333333333333', 'staff@test.invalid')
on conflict (id) do nothing;

-- The auth trigger mirrors these into profiles; make sure they exist either way.
insert into public.profiles (id, email, role) values
  ('11111111-1111-4111-8111-111111111111', 'alice@test.invalid', 'customer'),
  ('22222222-2222-4222-8222-222222222222', 'bob@test.invalid', 'customer'),
  ('33333333-3333-4333-8333-333333333333', 'staff@test.invalid', 'admin')
on conflict (id) do update set role = excluded.role;

insert into public.addresses (id, profile_id, first_name, last_name, line1, postal_code, city, country_code)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Alice', 'Test', '1 rue de Test', '75011', 'Paris', 'FR'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
   'Bob', 'Test', '2 rue de Test', '75011', 'Paris', 'FR')
on conflict (id) do nothing;

insert into public.orders (id, profile_id, email, status, subtotal_cents, total_cents, shipping_address)
values
  ('cccccccc-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'alice@test.invalid', 'paid', 10000, 10000, '{"line1":"1 rue de Test"}'::jsonb),
  ('dddddddd-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
   'bob@test.invalid', 'paid', 20000, 20000, '{"line1":"2 rue de Test"}'::jsonb)
on conflict (id) do nothing;

-- Helper: run the rest of the session as a given signed-in user.
create or replace function pg_temp.become(p_user uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end;
$$;

create or replace function pg_temp.become_anon() returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end;
$$;

-- Counts rows, or reports -1 when the role is refused outright. Access can be
-- denied by a missing grant or by RLS returning nothing; the suite asserts the
-- outcome (no access) rather than the mechanism.
create or replace function pg_temp.visible_rows(p_table text) returns integer
language plpgsql as $$
declare
  v_count integer;
begin
  execute format('select count(*) from public.%I', p_table) into v_count;
  return v_count;
exception
  when insufficient_privilege then return -1;
end;
$$;

-- --------------------------------------------------------------------------
do $$
declare
  v_count integer;
  v_ok boolean;
  v_escalated boolean;
begin
  -- === 1. Anonymous visitors ==============================================
  perform pg_temp.become_anon();
  set local role anon;

  v_count := pg_temp.visible_rows('orders');
  assert v_count <= 0, format('anon reads %s orders', v_count);

  v_count := pg_temp.visible_rows('addresses');
  assert v_count <= 0, format('anon reads %s addresses', v_count);

  v_count := pg_temp.visible_rows('profiles');
  assert v_count <= 0, format('anon reads %s profiles', v_count);

  -- Discount codes must not be enumerable: only validate_discount_code answers.
  v_count := pg_temp.visible_rows('discount_codes');
  assert v_count <= 0, format('anon reads %s discount codes', v_count);

  v_count := pg_temp.visible_rows('discounts');
  assert v_count <= 0, format('anon reads %s discounts', v_count);

  -- But the published catalogue is public.
  select count(*) into v_count from public.products;
  assert v_count > 0, 'anon cannot read the published catalogue';

  select count(*) into v_count from public.inventory;
  assert v_count > 0, 'anon cannot read availability';

  raise notice 'OK  1. anonymous: catalogue readable, customer data and discount codes unreachable';

  reset role;

  -- === 2. One customer cannot see another =================================
  perform pg_temp.become('11111111-1111-4111-8111-111111111111'::uuid);
  set local role authenticated;

  select count(*) into v_count from public.orders;
  assert v_count = 1, format('Alice sees %s orders — expected only her own', v_count);

  select count(*) into v_count
  from public.orders where id = 'dddddddd-0000-4000-8000-000000000002';
  assert v_count = 0, 'Alice can read Bob''s order';

  select count(*) into v_count
  from public.addresses where id = 'bbbbbbbb-0000-4000-8000-000000000002';
  assert v_count = 0, 'Alice can read Bob''s address';

  select count(*) into v_count
  from public.profiles where id = '22222222-2222-4222-8222-222222222222';
  assert v_count = 0, 'Alice can read Bob''s profile';

  raise notice 'OK  2. customer isolation: orders, addresses and profiles are per-customer';

  -- === 3. No privilege escalation =========================================
  -- Regression guard for the hole closed by migration 0014: RLS decides which
  -- ROWS a role may touch, never which COLUMNS, so `profiles_update_own` alone
  -- let a customer set their own role to 'admin'.
  begin
    update public.profiles set role = 'admin'
     where id = '11111111-1111-4111-8111-111111111111';
    -- Reaching here means the statement was accepted; the trigger or the column
    -- privilege should have refused it.
    v_escalated := true;
  exception
    when insufficient_privilege then v_escalated := false;
  end;

  reset role;
  select (role = 'admin') into v_ok from public.profiles
   where id = '11111111-1111-4111-8111-111111111111';
  assert not v_ok and not v_escalated,
    'PRIVILEGE ESCALATION: a customer promoted themselves to admin';

  perform pg_temp.become('11111111-1111-4111-8111-111111111111'::uuid);
  set local role authenticated;
  select public.is_admin() into v_ok;
  assert not v_ok, 'is_admin() answers true for a plain customer';

  -- A customer may edit their own name, which is the point of the account page.
  update public.profiles set first_name = 'Alice II'
   where id = '11111111-1111-4111-8111-111111111111';
  reset role;
  select (first_name = 'Alice II') into v_ok from public.profiles
   where id = '11111111-1111-4111-8111-111111111111';
  assert v_ok, 'a customer can no longer edit their own name';

  perform pg_temp.become('11111111-1111-4111-8111-111111111111'::uuid);
  set local role authenticated;

  -- Writing to someone else's order must change nothing.
  update public.orders set total_cents = 1
   where id = 'dddddddd-0000-4000-8000-000000000002';
  -- Nor to one's own: an order is an immutable commercial record.
  update public.orders set total_cents = 1
   where id = 'cccccccc-0000-4000-8000-000000000001';

  -- Nor may a customer invent stock for themselves.
  update public.inventory set quantity = 9999
   where variant_id = (select id from public.product_variants limit 1);

  reset role;
  select (total_cents = 20000) into v_ok from public.orders
   where id = 'dddddddd-0000-4000-8000-000000000002';
  assert v_ok, 'Alice modified Bob''s order total';

  select (total_cents = 10000) into v_ok from public.orders
   where id = 'cccccccc-0000-4000-8000-000000000001';
  assert v_ok, 'a customer rewrote the total of their own order';

  select (quantity < 9999) into v_ok from public.inventory
   where variant_id = (select id from public.product_variants limit 1);
  assert v_ok, 'a customer wrote their own stock level';

  raise notice 'OK  3. escalation: role, orders and stock are all out of a customer''s reach';

  -- === 4. Staff can administer ============================================
  perform pg_temp.become('33333333-3333-4333-8333-333333333333'::uuid);
  set local role authenticated;

  select public.is_admin() into v_ok;
  assert v_ok, 'is_admin() answers false for a staff member';

  select count(*) into v_count from public.orders;
  assert v_count >= 2, format('staff sees %s orders — expected every order', v_count);

  raise notice 'OK  4. staff: administration reaches every order';

  reset role;
end $$;

-- --------------------------------------------------------------------------
-- 5. Money and stock are computed by the database, never sent by the client.
-- --------------------------------------------------------------------------
do $$
declare
  v_variant uuid;
  v_price integer;
  v_priced jsonb;
  v_line jsonb;
begin
  select v.id, coalesce(v.price_cents, p.base_price_cents)
    into v_variant, v_price
  from public.product_variants v
  join public.products p on p.id = v.product_id
  join public.inventory i on i.variant_id = v.id
  where p.status = 'active' and i.quantity - i.reserved >= 2
  limit 1;

  assert v_variant is not null, 'no sellable variant to test with';

  perform pg_temp.become_anon();
  set local role anon;

  -- A payload carrying invented prices and totals.
  v_priced := public.price_cart(
    jsonb_build_array(jsonb_build_object(
      'variant_id', v_variant,
      'quantity', 2,
      'unit_price_cents', 1,          -- ignored
      'line_total_cents', 2,          -- ignored
      'price', 0.01                   -- ignored
    )), 'FR');

  v_line := v_priced -> 'lines' -> 0;

  assert (v_line ->> 'unit_price_cents')::integer = v_price,
    format('price_cart honoured a client price: %s instead of %s',
           v_line ->> 'unit_price_cents', v_price);

  assert (v_priced ->> 'subtotal_cents')::integer = v_price * 2,
    format('subtotal was not recomputed: %s', v_priced ->> 'subtotal_cents');

  -- Shipping and discount are equally the database's decision.
  assert (v_priced ->> 'discount_cents')::integer = 0,
    'a discount appeared without a valid code';

  reset role;
  raise notice 'OK  5. tampering: client-sent prices, totals and discounts are ignored';
end $$;

-- --------------------------------------------------------------------------
-- 6. Quantity is capped by real availability.
-- --------------------------------------------------------------------------
do $$
declare
  v_variant uuid;
  v_available integer;
  v_line jsonb;
begin
  select v.id, greatest(i.quantity - i.reserved, 0)
    into v_variant, v_available
  from public.product_variants v
  join public.products p on p.id = v.product_id
  join public.inventory i on i.variant_id = v.id
  where p.status = 'active' and i.track_inventory and not i.allow_backorder
    and i.quantity - i.reserved between 1 and 20
  limit 1;

  assert v_variant is not null, 'no stock-tracked variant to test with';

  perform pg_temp.become_anon();
  set local role anon;

  v_line := public.price_cart(
    jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 999)),
    'FR') -> 'lines' -> 0;

  assert (v_line ->> 'quantity')::integer = v_available,
    format('quantity was not capped: asked 999, granted %s, available %s',
           v_line ->> 'quantity', v_available);
  assert (v_line ->> 'adjusted')::boolean,
    'the cart did not flag the adjustment to the shopper';

  reset role;
  raise notice 'OK  6. quantity: an inflated quantity is capped at real availability';
end $$;

-- --------------------------------------------------------------------------
-- 7. An unknown or unpublished variant simply drops out.
-- --------------------------------------------------------------------------
do $$
declare
  v_priced jsonb;
begin
  perform pg_temp.become_anon();
  set local role anon;

  v_priced := public.price_cart(
    jsonb_build_array(jsonb_build_object(
      'variant_id', '00000000-0000-4000-8000-000000000000', 'quantity', 1)), 'FR');

  assert jsonb_array_length(v_priced -> 'lines') = 0,
    'a non-existent variant produced a cart line';
  assert (v_priced ->> 'total_cents')::integer = 0,
    'a non-existent variant produced a total';

  reset role;
  raise notice 'OK  7. variant tampering: an unknown variant id yields nothing';
end $$;

-- --------------------------------------------------------------------------
-- 8. mark_order_paid is idempotent — Stripe retries must not sell twice.
-- --------------------------------------------------------------------------
do $$
declare
  v_variant uuid;
  v_order jsonb;
  v_first jsonb;
  v_second jsonb;
  v_before integer;
  v_after integer;
begin
  select v.id into v_variant
  from public.product_variants v
  join public.products p on p.id = v.product_id
  join public.inventory i on i.variant_id = v.id
  where p.status = 'active' and i.quantity - i.reserved >= 2
  limit 1;

  select quantity into v_before from public.inventory where variant_id = v_variant;

  perform pg_temp.become_anon();
  set local role anon;
  v_order := public.create_order(
    jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 1)),
    'idempotence@test.invalid',
    '{"line1":"1 rue de Test","postal_code":"75011","city":"Paris","country_code":"FR"}'::jsonb);
  reset role;

  v_first  := public.mark_order_paid((v_order ->> 'order_id')::uuid, 'pi_test_idempotent');
  v_second := public.mark_order_paid((v_order ->> 'order_id')::uuid, 'pi_test_idempotent');

  assert not (v_first ->> 'idempotent')::boolean, 'the first settlement reported itself as a replay';
  assert (v_second ->> 'idempotent')::boolean, 'the second settlement was not detected as a replay';

  select quantity into v_after from public.inventory where variant_id = v_variant;
  assert v_after = v_before - 1,
    format('stock moved by %s instead of 1 — the webhook replay sold twice', v_before - v_after);

  assert (select count(*) from public.payments
           where order_id = (v_order ->> 'order_id')::uuid) = 1,
    'the replay recorded a second payment';

  raise notice 'OK  8. idempotence: a replayed webhook settles the order exactly once';
end $$;

-- --------------------------------------------------------------------------
-- 9. A released order gives its stock back.
-- --------------------------------------------------------------------------
do $$
declare
  v_variant uuid;
  v_order jsonb;
  v_reserved_before integer;
  v_reserved_after integer;
begin
  select v.id into v_variant
  from public.product_variants v
  join public.products p on p.id = v.product_id
  join public.inventory i on i.variant_id = v.id
  where p.status = 'active' and i.quantity - i.reserved >= 2
  limit 1;

  select reserved into v_reserved_before from public.inventory where variant_id = v_variant;

  perform pg_temp.become_anon();
  set local role anon;
  v_order := public.create_order(
    jsonb_build_array(jsonb_build_object('variant_id', v_variant, 'quantity', 1)),
    'release@test.invalid',
    '{"line1":"1 rue de Test","postal_code":"75011","city":"Paris","country_code":"FR"}'::jsonb);
  reset role;

  select reserved into v_reserved_after from public.inventory where variant_id = v_variant;
  assert v_reserved_after = v_reserved_before + 1,
    'create_order did not hold the stock';

  perform public.release_order((v_order ->> 'order_id')::uuid, 'test');

  select reserved into v_reserved_after from public.inventory where variant_id = v_variant;
  assert v_reserved_after = v_reserved_before,
    'release_order did not hand the stock back';

  raise notice 'OK  9. release: an abandoned checkout returns its reservation';
end $$;

-- --------------------------------------------------------------------------
-- 10. A guest can look up an order only with the matching email.
-- --------------------------------------------------------------------------
do $$
declare
  v_found jsonb;
  v_number text;
begin
  -- Read the order number first: as anon, `orders` is unreachable by design,
  -- which is the very thing lookup_order exists to work around.
  select order_number into v_number
  from public.orders where id = 'cccccccc-0000-4000-8000-000000000001';

  perform pg_temp.become_anon();
  set local role anon;

  v_found := public.lookup_order('BP-000000', 'nobody@test.invalid');
  assert v_found is null, 'lookup_order answered for an unknown order';

  v_found := public.lookup_order(v_number, 'bob@test.invalid');
  assert v_found is null, 'lookup_order revealed an order to the wrong email';

  v_found := public.lookup_order(v_number, 'alice@test.invalid');
  assert v_found is not null, 'lookup_order refused the rightful owner';

  -- Casing and stray whitespace must not defeat a legitimate lookup.
  v_found := public.lookup_order('  ' || lower(v_number) || '  ', '  ALICE@test.invalid ');
  assert v_found is not null, 'lookup_order is fragile to casing or whitespace';

  reset role;
  raise notice 'OK 10. guest lookup: the order number alone is not enough';
end $$;

-- Nothing is kept: the suite is read-write but never commits.
rollback;

\echo ''
\echo '================================================'
\echo ' Database security suite: every assertion passed'
\echo '================================================'
