-- =============================================================================
-- BOBO PARIS — 0009 Catalogue search
--
-- One function backs every listing page: /boutique, /femme, a collection, and
-- /search. It returns the page of products *and* the facet counts, so the
-- filter rail always reflects what is actually reachable.
--
-- Facet counts are computed over the filtered set minus the facet's own
-- dimension, which is what shoppers expect: narrowing by size must not empty
-- the size list.
-- =============================================================================

create or replace function public.catalog_search(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_q             text    := nullif(btrim(coalesce(p_filters ->> 'q', '')), '');
  v_category      text    := nullif(p_filters ->> 'category', '');
  v_collection    text    := nullif(p_filters ->> 'collection', '');
  v_audience      text    := nullif(p_filters ->> 'audience', '');
  v_sizes         text[]  := case when p_filters ? 'sizes'
                                  then array(select jsonb_array_elements_text(p_filters -> 'sizes'))
                                  else null end;
  v_colors        text[]  := case when p_filters ? 'colors'
                                  then array(select jsonb_array_elements_text(p_filters -> 'colors'))
                                  else null end;
  v_min_price     integer := nullif(p_filters ->> 'min_price_cents', '')::integer;
  v_max_price     integer := nullif(p_filters ->> 'max_price_cents', '')::integer;
  v_in_stock      boolean := coalesce((p_filters ->> 'in_stock')::boolean, false);
  v_on_sale       boolean := coalesce((p_filters ->> 'on_sale')::boolean, false);
  v_is_new        boolean := coalesce((p_filters ->> 'is_new')::boolean, false);
  v_unique        boolean := coalesce((p_filters ->> 'one_of_a_kind')::boolean, false);
  v_sort          text    := coalesce(nullif(p_filters ->> 'sort', ''), 'featured');
  v_page          integer := greatest(coalesce((p_filters ->> 'page')::integer, 1), 1);
  v_per_page      integer := least(greatest(coalesce((p_filters ->> 'per_page')::integer, 24), 1), 96);
begin
  return (
    with recursive category_tree as (
      select c.id from public.categories c
      where v_category is not null and c.slug = v_category and c.is_published and c.deleted_at is null
      union all
      select child.id from public.categories child
      join category_tree t on child.parent_id = t.id
      where child.is_published and child.deleted_at is null
    ),
    -- Products that pass every filter except size/colour/price, which are
    -- variant-level and handled next.
    base as (
      select p.*
      from public.products p
      where p.status = 'active'
        and p.deleted_at is null
        and (v_category is null or p.category_id in (select id from category_tree))
        and (v_collection is null or exists (
              select 1 from public.collection_products cp
              join public.collections col on col.id = cp.collection_id
              where cp.product_id = p.id and col.slug = v_collection
                and col.is_published and col.deleted_at is null
            ))
        and (v_audience is null or p.audience::text = v_audience or p.audience = 'unisexe')
        and (not v_is_new or p.is_new)
        and (not v_unique or p.is_one_of_a_kind)
        and (not v_on_sale or p.compare_at_price_cents is not null)
        and (
          v_q is null
          or public.normalize_text(
               coalesce(p.name, '') || ' ' || coalesce(p.model_name, '') || ' ' ||
               coalesce(p.subtitle, '') || ' ' || coalesce(p.description, '')
             ) like '%' || public.normalize_text(v_q) || '%'
        )
    ),
    -- Variant rows for the base set, with live availability.
    variants as (
      select
        b.id as product_id,
        v.id as variant_id,
        v.size,
        v.color_name,
        coalesce(v.price_cents, b.base_price_cents) as price_cents,
        case
          when not i.track_inventory or i.allow_backorder then 9999
          else greatest(i.quantity - i.reserved, 0)
        end as available
      from base b
      join public.product_variants v on v.product_id = b.id and v.is_active
      join public.inventory i on i.variant_id = v.id
    ),
    -- Products whose variants survive the variant-level filters.
    matched as (
      select distinct product_id
      from variants
      where (v_sizes  is null or size = any (v_sizes))
        and (v_colors is null or color_name = any (v_colors))
        and (v_min_price is null or price_cents >= v_min_price)
        and (v_max_price is null or price_cents <= v_max_price)
        and (not v_in_stock or available > 0)
    ),
    filtered as (
      select b.* from base b join matched m on m.product_id = b.id
    ),
    counted as (
      select count(*)::integer as total from filtered
    ),
    page as (
      select f.*
      from filtered f
      order by
        case when v_sort = 'price-asc'   then f.base_price_cents end asc nulls last,
        case when v_sort = 'price-desc'  then f.base_price_cents end desc nulls last,
        case when v_sort = 'newest'      then f.published_at end desc nulls last,
        case when v_sort = 'oldest'      then f.published_at end asc nulls last,
        case when v_sort = 'name-asc'    then f.name end asc nulls last,
        case when v_sort = 'featured'    then f.position end asc nulls last,
        f.published_at desc nulls last,
        f.id
      limit v_per_page offset (v_page - 1) * v_per_page
    ),
    items as (
      select jsonb_agg(item order by ord) as data
      from (
        select
          row_number() over () as ord,
          jsonb_build_object(
            'id', pg.id,
            'slug', pg.slug,
            'name', pg.name,
            'model_name', pg.model_name,
            'subtitle', pg.subtitle,
            'audience', pg.audience,
            'is_new', pg.is_new,
            'is_one_of_a_kind', pg.is_one_of_a_kind,
            'price_cents', pg.base_price_cents,
            'compare_at_price_cents', pg.compare_at_price_cents,
            'currency', pg.currency,
            'images', (
              select coalesce(jsonb_agg(jsonb_build_object('url', img.url, 'alt', img.alt) order by img.position), '[]'::jsonb)
              from public.product_images img where img.product_id = pg.id
            ),
            'colors', (
              select coalesce(jsonb_agg(distinct jsonb_build_object('name', v.color_name, 'hex', v.color_hex)) filter (where v.color_name is not null), '[]'::jsonb)
              from public.product_variants v where v.product_id = pg.id and v.is_active
            ),
            'sizes', (
              select coalesce(jsonb_agg(distinct v.size) filter (where v.size is not null), '[]'::jsonb)
              from public.product_variants v where v.product_id = pg.id and v.is_active
            ),
            'in_stock', exists (
              select 1 from variants vv where vv.product_id = pg.id and vv.available > 0
            )
          ) as item
        from page pg
      ) s
    ),
    -- Each facet ignores its own dimension so the list never collapses.
    facet_sizes as (
      select coalesce(jsonb_agg(jsonb_build_object('value', size, 'count', c) order by size), '[]'::jsonb) as data
      from (
        select v.size, count(distinct v.product_id)::integer as c
        from variants v
        where v.size is not null
          and (v_colors is null or v.color_name = any (v_colors))
          and (v_min_price is null or v.price_cents >= v_min_price)
          and (v_max_price is null or v.price_cents <= v_max_price)
          and (not v_in_stock or v.available > 0)
        group by v.size
      ) s
    ),
    facet_colors as (
      select coalesce(jsonb_agg(jsonb_build_object('value', color_name, 'hex', hex, 'count', c) order by color_name), '[]'::jsonb) as data
      from (
        select v.color_name, min(pv.color_hex) as hex, count(distinct v.product_id)::integer as c
        from variants v
        join public.product_variants pv on pv.id = v.variant_id
        where v.color_name is not null
          and (v_sizes is null or v.size = any (v_sizes))
          and (v_min_price is null or v.price_cents >= v_min_price)
          and (v_max_price is null or v.price_cents <= v_max_price)
          and (not v_in_stock or v.available > 0)
        group by v.color_name
      ) s
    ),
    price_bounds as (
      select
        coalesce(min(price_cents), 0)::integer as min_cents,
        coalesce(max(price_cents), 0)::integer as max_cents
      from variants
    )
    select jsonb_build_object(
      'items', coalesce((select data from items), '[]'::jsonb),
      'total', (select total from counted),
      'page', v_page,
      'per_page', v_per_page,
      'page_count', greatest(ceil((select total from counted)::numeric / v_per_page)::integer, 1),
      'facets', jsonb_build_object(
        'sizes',  (select data from facet_sizes),
        'colors', (select data from facet_colors),
        'price',  (select jsonb_build_object('min_cents', min_cents, 'max_cents', max_cents) from price_bounds)
      )
    )
  );
end;
$$;

comment on function public.catalog_search is
  'Backs every product listing: filtered page plus facet counts, in one round trip.';

-- -----------------------------------------------------------------------------
-- Lightweight autocomplete for the search overlay.
-- -----------------------------------------------------------------------------
create or replace function public.search_suggestions(p_query text, p_limit integer default 6)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with q as (select public.normalize_text(coalesce(nullif(btrim(p_query), ''), '~~none~~')) as term)
  select jsonb_build_object(
    'products', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'slug', p.slug, 'name', p.name, 'price_cents', p.base_price_cents,
        'image_url', (select url from public.product_images i where i.product_id = p.id order by i.position limit 1)
      )), '[]'::jsonb)
      from (
        select p.* from public.products p, q
        where p.status = 'active' and p.deleted_at is null
          and public.normalize_text(coalesce(p.name,'') || ' ' || coalesce(p.model_name,'')) like '%' || q.term || '%'
        order by p.position, p.name
        limit p_limit
      ) p
    ),
    'collections', (
      select coalesce(jsonb_agg(jsonb_build_object('slug', c.slug, 'title', c.title)), '[]'::jsonb)
      from (
        select c.* from public.collections c, q
        where c.is_published and c.deleted_at is null
          and public.normalize_text(c.title) like '%' || q.term || '%'
        order by c.position
        limit 4
      ) c
    ),
    'categories', (
      select coalesce(jsonb_agg(jsonb_build_object('slug', cat.slug, 'name', cat.name)), '[]'::jsonb)
      from (
        select cat.* from public.categories cat, q
        where cat.is_published and cat.deleted_at is null
          and public.normalize_text(cat.name) like '%' || q.term || '%'
        order by cat.position
        limit 4
      ) cat
    )
  );
$$;

-- -----------------------------------------------------------------------------
-- Admin dashboard aggregate. Guarded: non-staff get nothing.
-- -----------------------------------------------------------------------------
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'revenue_cents', (
      select coalesce(sum(total_cents), 0)::bigint from public.orders
      where status in ('paid', 'processing', 'shipped', 'delivered')
    ),
    'revenue_30d_cents', (
      select coalesce(sum(total_cents), 0)::bigint from public.orders
      where status in ('paid', 'processing', 'shipped', 'delivered')
        and created_at >= now() - interval '30 days'
    ),
    'orders_count', (select count(*)::integer from public.orders where status <> 'pending'),
    'orders_pending', (select count(*)::integer from public.orders where status = 'pending'),
    'customers_count', (select count(*)::integer from public.profiles),
    'products_active', (
      select count(*)::integer from public.products where status = 'active' and deleted_at is null
    ),
    'products_draft', (
      select count(*)::integer from public.products where status = 'draft' and deleted_at is null
    ),
    'low_stock', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'sku', v.sku, 'product', p.name, 'size', v.size, 'color', v.color_name,
        'available', greatest(i.quantity - i.reserved, 0)
      ) order by (i.quantity - i.reserved)), '[]'::jsonb)
      from public.inventory i
      join public.product_variants v on v.id = i.variant_id
      join public.products p on p.id = v.product_id
      where i.track_inventory
        and (i.quantity - i.reserved) <= i.low_stock_threshold
        and p.status = 'active' and p.deleted_at is null
    ),
    'recent_orders', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id, 'order_number', o.order_number, 'email', o.email,
        'status', o.status, 'total_cents', o.total_cents, 'created_at', o.created_at
      ) order by o.created_at desc), '[]'::jsonb)
      from (select * from public.orders order by created_at desc limit 8) o
    ),
    'newsletter_count', (
      select count(*)::integer from public.newsletter_subscribers where unsubscribed_at is null
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Execution grants. Functions are the only write path for anonymous shoppers.
-- -----------------------------------------------------------------------------
revoke all on function public.reserve_variant(uuid, integer) from public, anon, authenticated;

grant execute on function public.catalog_search(jsonb) to anon, authenticated;
grant execute on function public.search_suggestions(text, integer) to anon, authenticated;
grant execute on function public.price_cart(jsonb, char, text, text) to anon, authenticated;
grant execute on function public.validate_discount_code(text, integer) to anon, authenticated;
grant execute on function public.create_order(jsonb, text, jsonb, jsonb, text, text, text, text) to anon, authenticated;
grant execute on function public.lookup_order(text, text) to anon, authenticated;
grant execute on function public.merge_wishlist(jsonb) to authenticated;
grant execute on function public.merge_cart(jsonb) to authenticated;
grant execute on function public.admin_dashboard() to authenticated;

-- Payment state transitions belong to the webhook (service role) and staff only.
revoke all on function public.mark_order_paid(uuid, text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.release_order(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text, integer, jsonb) to service_role;
grant execute on function public.release_order(uuid, text) to service_role;
