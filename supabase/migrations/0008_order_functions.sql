-- =============================================================================
-- BOBO PARIS — 0008 Order lifecycle
--
-- Stock is reserved with a conditional UPDATE, so two customers racing for the
-- last piece cannot both win: the row lock serialises them and the loser's
-- UPDATE matches zero rows.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Reserve a single variant. Returns true only if the units were actually held.
-- -----------------------------------------------------------------------------
create or replace function public.reserve_variant(p_variant_id uuid, p_quantity integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if p_quantity <= 0 then
    return false;
  end if;

  update public.inventory
     set reserved = reserved + p_quantity
   where variant_id = p_variant_id
     and (
       not track_inventory
       or allow_backorder
       or quantity - reserved >= p_quantity
     );

  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

-- -----------------------------------------------------------------------------
-- Create a pending order from a client-supplied basket.
-- Prices, availability and totals are recomputed here and the reservation is
-- taken inside the same transaction, so an order never exists without its stock.
-- -----------------------------------------------------------------------------
create or replace function public.create_order(
  p_items jsonb,
  p_email text,
  p_shipping_address jsonb,
  p_billing_address jsonb default null,
  p_shipping_method_code text default null,
  p_discount_code text default null,
  p_phone text default null,
  p_customer_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country char(2);
  v_priced jsonb;
  v_line jsonb;
  v_order public.orders%rowtype;
  v_reserved jsonb := '[]'::jsonb;
  v_ok boolean;
begin
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  if p_shipping_address is null or coalesce(p_shipping_address ->> 'line1', '') = '' then
    raise exception 'invalid_shipping_address' using errcode = '22023';
  end if;

  v_country := upper(coalesce(p_shipping_address ->> 'country_code', 'FR'));

  v_priced := public.price_cart(p_items, v_country, p_discount_code, p_shipping_method_code);

  if jsonb_array_length(v_priced -> 'lines') = 0 then
    raise exception 'empty_cart' using errcode = '22023';
  end if;

  -- Reserve every line before writing the order; bail out on the first miss so
  -- the whole transaction rolls back, releasing anything already held.
  for v_line in select * from jsonb_array_elements(v_priced -> 'lines')
  loop
    if (v_line ->> 'quantity')::integer <= 0 then
      raise exception 'out_of_stock:%', (v_line ->> 'sku') using errcode = '22023';
    end if;

    v_ok := public.reserve_variant(
      (v_line ->> 'variant_id')::uuid,
      (v_line ->> 'quantity')::integer
    );

    if not v_ok then
      raise exception 'out_of_stock:%', (v_line ->> 'sku') using errcode = '22023';
    end if;

    v_reserved := v_reserved || jsonb_build_array(v_line);
  end loop;

  insert into public.orders (
    profile_id, email, phone, status, currency,
    subtotal_cents, discount_cents, shipping_cents, total_cents,
    discount_code, shipping_method_code,
    shipping_address, billing_address, customer_note
  ) values (
    auth.uid(),
    lower(btrim(p_email)),
    p_phone,
    'pending',
    'EUR',
    (v_priced ->> 'subtotal_cents')::integer,
    (v_priced ->> 'discount_cents')::integer,
    (v_priced ->> 'shipping_cents')::integer,
    (v_priced ->> 'total_cents')::integer,
    nullif(v_priced -> 'discount' ->> 'code', ''),
    v_priced -> 'shipping_method' ->> 'code',
    p_shipping_address,
    coalesce(p_billing_address, p_shipping_address),
    nullif(btrim(coalesce(p_customer_note, '')), '')
  )
  returning * into v_order;

  insert into public.order_items (
    order_id, variant_id, product_id, product_name, variant_label, sku,
    image_url, slug, unit_price_cents, quantity, total_cents
  )
  select
    v_order.id,
    (l ->> 'variant_id')::uuid,
    (l ->> 'product_id')::uuid,
    l ->> 'name',
    nullif(concat_ws(' / ', nullif(l ->> 'size', ''), nullif(l ->> 'color_name', '')), ''),
    l ->> 'sku',
    l ->> 'image_url',
    l ->> 'slug',
    (l ->> 'unit_price_cents')::integer,
    (l ->> 'quantity')::integer,
    (l ->> 'line_total_cents')::integer
  from jsonb_array_elements(v_reserved) l;

  insert into public.inventory_movements (variant_id, delta, reason, reference_id)
  select (l ->> 'variant_id')::uuid, -(l ->> 'quantity')::integer, 'reserved', v_order.id
  from jsonb_array_elements(v_reserved) l;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'total_cents', v_order.total_cents,
    'subtotal_cents', v_order.subtotal_cents,
    'discount_cents', v_order.discount_cents,
    'shipping_cents', v_order.shipping_cents,
    'currency', v_order.currency,
    'email', v_order.email,
    'lines', v_priced -> 'lines'
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Payment succeeded: turn the reservation into a real decrement. Idempotent,
-- because Stripe will happily deliver the same webhook twice.
-- -----------------------------------------------------------------------------
create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_payment_reference text,
  p_amount_cents integer default null,
  p_payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.status <> 'pending' then
    -- Already handled. Report success so the webhook stops retrying.
    return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'idempotent', true);
  end if;

  for v_item in
    select * from public.order_items where order_id = p_order_id and variant_id is not null
  loop
    update public.inventory
       set quantity = greatest(quantity - v_item.quantity, 0),
           reserved = greatest(reserved - v_item.quantity, 0)
     where variant_id = v_item.variant_id;

    insert into public.inventory_movements (variant_id, delta, reason, reference_id)
    values (v_item.variant_id, -v_item.quantity, 'sold', p_order_id);
  end loop;

  update public.orders
     set status = 'paid',
         placed_at = coalesce(placed_at, now()),
         stripe_payment_intent_id = coalesce(p_payment_reference, stripe_payment_intent_id)
   where id = p_order_id
  returning * into v_order;

  insert into public.payments (order_id, provider, provider_reference, status, amount_cents, currency, raw_payload)
  values (
    p_order_id, 'stripe', p_payment_reference, 'succeeded',
    coalesce(p_amount_cents, v_order.total_cents), v_order.currency, p_payload
  )
  on conflict (provider, provider_reference) where provider_reference is not null
  do update set status = 'succeeded', raw_payload = excluded.raw_payload;

  if v_order.discount_code is not null then
    update public.discounts d
       set usage_count = d.usage_count + 1
      from public.discount_codes c
     where c.discount_id = d.id
       and upper(c.code) = upper(v_order.discount_code);
  end if;

  return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'idempotent', false);
end;
$$;

-- -----------------------------------------------------------------------------
-- Payment failed or abandoned: give the stock back.
-- -----------------------------------------------------------------------------
create or replace function public.release_order(p_order_id uuid, p_reason text default 'cancelled')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if not found then
    raise exception 'order_not_found' using errcode = 'P0002';
  end if;

  if v_order.status <> 'pending' then
    return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'idempotent', true);
  end if;

  for v_item in
    select * from public.order_items where order_id = p_order_id and variant_id is not null
  loop
    update public.inventory
       set reserved = greatest(reserved - v_item.quantity, 0)
     where variant_id = v_item.variant_id;

    insert into public.inventory_movements (variant_id, delta, reason, reference_id)
    values (v_item.variant_id, v_item.quantity, 'released', p_order_id);
  end loop;

  update public.orders
     set status = 'cancelled', cancelled_at = now()
   where id = p_order_id
  returning * into v_order;

  return jsonb_build_object('order_id', v_order.id, 'status', v_order.status, 'idempotent', false);
end;
$$;

-- -----------------------------------------------------------------------------
-- Guest order lookup: order number plus the email it was placed with.
-- -----------------------------------------------------------------------------
create or replace function public.lookup_order(p_order_number text, p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order
  from public.orders
  where upper(order_number) = upper(btrim(p_order_number))
    and lower(email) = lower(btrim(p_email));

  if not found then
    return null;
  end if;

  return to_jsonb(v_order) || jsonb_build_object(
    'items', (
      select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at), '[]'::jsonb)
      from public.order_items i where i.order_id = v_order.id
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Merge a guest wishlist into the signed-in customer's server wishlist.
-- -----------------------------------------------------------------------------
create or replace function public.merge_wishlist(p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wishlist_id uuid;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  insert into public.wishlists (profile_id) values (auth.uid())
  on conflict (profile_id) do update set updated_at = now()
  returning id into v_wishlist_id;

  insert into public.wishlist_items (wishlist_id, product_id, variant_id)
  select
    v_wishlist_id,
    (item ->> 'product_id')::uuid,
    nullif(item ->> 'variant_id', '')::uuid
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) item
  where exists (
    select 1 from public.products p
    where p.id = (item ->> 'product_id')::uuid
      and p.status = 'active' and p.deleted_at is null
  )
  on conflict do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- Merge a guest cart into the signed-in customer's server cart.
-- -----------------------------------------------------------------------------
create or replace function public.merge_cart(p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select id into v_cart_id
  from public.carts
  where profile_id = auth.uid() and converted_at is null
  limit 1;

  if v_cart_id is null then
    insert into public.carts (profile_id) values (auth.uid()) returning id into v_cart_id;
  end if;

  insert into public.cart_items (cart_id, variant_id, quantity)
  select
    v_cart_id,
    (item ->> 'variant_id')::uuid,
    greatest(coalesce((item ->> 'quantity')::integer, 1), 1)
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) item
  where exists (
    select 1 from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = (item ->> 'variant_id')::uuid
      and v.is_active and p.status = 'active' and p.deleted_at is null
  )
  on conflict (cart_id, variant_id)
  do update set quantity = public.cart_items.quantity + excluded.quantity;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
