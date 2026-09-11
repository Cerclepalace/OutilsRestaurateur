-- =============================================================================
-- BOBO PARIS — 0007 Server-side commerce functions
--
-- Everything that decides a price, holds stock, or creates an order lives here.
-- The browser sends intent (variant ids and quantities); the database decides
-- the money. A tampered client payload can only ever buy the real product at
-- the real price.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Effective unit price of a variant (variant override, else product price).
-- -----------------------------------------------------------------------------
create or replace function public.variant_price_cents(p_variant_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(v.price_cents, p.base_price_cents)
  from public.product_variants v
  join public.products p on p.id = v.product_id
  where v.id = p_variant_id;
$$;

-- -----------------------------------------------------------------------------
-- Discount validation. Codes are not publicly readable, so this is the only
-- way the storefront can test one.
-- -----------------------------------------------------------------------------
create or replace function public.validate_discount_code(
  p_code text,
  p_subtotal_cents integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_discount public.discounts%rowtype;
  v_amount integer := 0;
begin
  if p_code is null or btrim(p_code) = '' then
    return jsonb_build_object('valid', false, 'reason', 'empty');
  end if;

  select d.* into v_discount
  from public.discount_codes c
  join public.discounts d on d.id = c.discount_id
  where upper(c.code) = upper(btrim(p_code))
  limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'unknown');
  end if;

  if not v_discount.is_active then
    return jsonb_build_object('valid', false, 'reason', 'inactive');
  end if;

  if v_discount.starts_at is not null and now() < v_discount.starts_at then
    return jsonb_build_object('valid', false, 'reason', 'not_started');
  end if;

  if v_discount.ends_at is not null and now() > v_discount.ends_at then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;

  if v_discount.usage_limit is not null and v_discount.usage_count >= v_discount.usage_limit then
    return jsonb_build_object('valid', false, 'reason', 'usage_limit_reached');
  end if;

  if p_subtotal_cents < v_discount.min_subtotal_cents then
    return jsonb_build_object(
      'valid', false,
      'reason', 'min_subtotal',
      'min_subtotal_cents', v_discount.min_subtotal_cents
    );
  end if;

  v_amount := case v_discount.kind
    when 'percentage'    then (p_subtotal_cents * v_discount.value) / 100
    when 'fixed_amount'  then least(v_discount.value, p_subtotal_cents)
    else 0
  end;

  return jsonb_build_object(
    'valid', true,
    'code', upper(btrim(p_code)),
    'kind', v_discount.kind,
    'name', v_discount.name,
    'amount_cents', v_amount,
    'free_shipping', v_discount.kind = 'free_shipping'
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Price a cart from scratch. `p_items` is [{ "variant_id": uuid, "quantity": n }].
-- Returns live lines, real availability, and the money — all computed here.
-- -----------------------------------------------------------------------------
create or replace function public.price_cart(
  p_items jsonb,
  p_country_code char(2) default 'FR',
  p_discount_code text default null,
  p_shipping_method_code text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_lines jsonb := '[]'::jsonb;
  v_line jsonb;
  v_subtotal integer := 0;
  v_discount jsonb;
  v_discount_cents integer := 0;
  v_shipping jsonb;
  v_shipping_cents integer := 0;
  v_free_shipping boolean := false;
  v_item jsonb;
  v_qty integer;
  v_available integer;
  v_granted integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    p_items := '[]'::jsonb;
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(coalesce((v_item ->> 'quantity')::integer, 0), 0);
    continue when v_qty = 0;

    -- Reset before the SELECT INTO: a miss leaves the previous row's values.
    v_line := null;
    v_available := 0;

    select
      jsonb_build_object(
        'variant_id', v.id,
        'product_id', p.id,
        'slug', p.slug,
        'name', p.name,
        'model_name', p.model_name,
        'sku', v.sku,
        'size', v.size,
        'color_name', v.color_name,
        'unit_price_cents', coalesce(v.price_cents, p.base_price_cents),
        'compare_at_price_cents', coalesce(v.compare_at_price_cents, p.compare_at_price_cents),
        'image_url', (
          select img.url from public.product_images img
          where img.product_id = p.id
            and (img.variant_id = v.id or img.variant_id is null)
          order by (img.variant_id = v.id) desc, img.position
          limit 1
        ),
        'is_active', v.is_active and p.status = 'active' and p.deleted_at is null
      ),
      case
        when not i.track_inventory then 9999
        when i.allow_backorder then 9999
        else greatest(i.quantity - i.reserved, 0)
      end
    into v_line, v_available
    from public.product_variants v
    join public.products p on p.id = v.product_id
    join public.inventory i on i.variant_id = v.id
    where v.id = (v_item ->> 'variant_id')::uuid;

    -- A variant that vanished or was unpublished simply drops out of the cart.
    continue when v_line is null or not (v_line ->> 'is_active')::boolean;

    v_granted := least(v_qty, v_available);

    v_line := v_line
      || jsonb_build_object(
           'requested_quantity', v_qty,
           'quantity', v_granted,
           'available', v_available,
           'in_stock', v_granted > 0,
           'adjusted', v_granted < v_qty,
           'line_total_cents', v_granted * (v_line ->> 'unit_price_cents')::integer
         );

    v_subtotal := v_subtotal + (v_line ->> 'line_total_cents')::integer;
    v_lines := v_lines || jsonb_build_array(v_line);
  end loop;

  -- Discount
  if p_discount_code is not null then
    v_discount := public.validate_discount_code(p_discount_code, v_subtotal);
    if (v_discount ->> 'valid')::boolean then
      v_discount_cents := coalesce((v_discount ->> 'amount_cents')::integer, 0);
      v_free_shipping := coalesce((v_discount ->> 'free_shipping')::boolean, false);
    end if;
  end if;

  -- Shipping: the cheapest active method serving this country, unless one was
  -- explicitly chosen. Free-shipping thresholds are per method, from the table.
  select to_jsonb(m) into v_shipping
  from public.shipping_methods m
  where m.is_active
    and (
      p_shipping_method_code is not null and m.code = p_shipping_method_code
      or p_shipping_method_code is null and (
        p_country_code = any (m.country_codes) or cardinality(m.country_codes) = 0
      )
    )
  order by
    (p_country_code = any (m.country_codes)) desc,
    m.position,
    m.price_cents
  limit 1;

  if v_shipping is not null then
    v_shipping_cents := (v_shipping ->> 'price_cents')::integer;
    if (v_shipping ->> 'free_above_cents') is not null
       and (v_subtotal - v_discount_cents) >= (v_shipping ->> 'free_above_cents')::integer then
      v_shipping_cents := 0;
    end if;
  end if;

  if v_free_shipping then
    v_shipping_cents := 0;
  end if;

  return jsonb_build_object(
    'lines', v_lines,
    'item_count', (select coalesce(sum((l ->> 'quantity')::integer), 0) from jsonb_array_elements(v_lines) l),
    'subtotal_cents', v_subtotal,
    'discount_cents', v_discount_cents,
    'discount', v_discount,
    'shipping_cents', v_shipping_cents,
    'shipping_method', v_shipping,
    'total_cents', greatest(v_subtotal - v_discount_cents, 0) + v_shipping_cents,
    'currency', 'EUR'
  );
end;
$$;

comment on function public.price_cart is
  'Single source of truth for cart money. The client never sends a price.';
