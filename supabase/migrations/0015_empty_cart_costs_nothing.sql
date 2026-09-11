-- =============================================================================
-- BOBO PARIS — 0015 An empty basket costs nothing
--
-- THE BUG
--
-- `price_cart` computed shipping before checking whether anything was actually
-- being bought. A basket holding only unavailable lines — or a tampered payload
-- naming a variant that does not exist — came back with:
--
--   subtotal 0, shipping 690, total 690
--
-- A €6,90 total for nothing. The cart screen hides its summary when there are
-- no lines, so this never surfaced in the interface, but the API said it and
-- any future consumer would have believed it.
--
-- THE FIX
--
-- Shipping is only charged once at least one purchasable unit is in the basket.
-- The chosen method is still reported, so the cart can keep showing "free above
-- 200 €" while the basket is being filled.
-- =============================================================================

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
  v_units integer := 0;
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
          -- Images are anchored to a colourway's first variant, so fall back by
          -- colour then to any product image: a line always has a thumbnail.
          select img.url
          from public.product_images img
          left join public.product_variants iv on iv.id = img.variant_id
          where img.product_id = p.id
          order by
            case
              when iv.id = v.id then 0
              when iv.color_name is not distinct from v.color_name then 1
              when img.variant_id is null then 2
              else 3
            end,
            img.position
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

    v_units := v_units + v_granted;
    v_subtotal := v_subtotal + (v_line ->> 'line_total_cents')::integer;
    v_lines := v_lines || jsonb_build_array(v_line);
  end loop;

  if p_discount_code is not null then
    v_discount := public.validate_discount_code(p_discount_code, v_subtotal);
    if (v_discount ->> 'valid')::boolean then
      v_discount_cents := coalesce((v_discount ->> 'amount_cents')::integer, 0);
      v_free_shipping := coalesce((v_discount ->> 'free_shipping')::boolean, false);
    end if;
  end if;

  -- The method is still resolved for an empty basket, so the cart can show
  -- "offered above 200 €" while it is being filled.
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

  -- Nothing purchasable in the basket: nothing to deliver, nothing to pay.
  if v_units = 0 then
    v_shipping_cents := 0;
    v_discount_cents := 0;
  end if;

  return jsonb_build_object(
    'lines', v_lines,
    'item_count', v_units,
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

grant execute on function public.price_cart(jsonb, char, text, text) to anon, authenticated;
