-- Eliott SNKRS — commandes et paiements (Stripe + PayPal)
-- À exécuter APRÈS schema.sql : SQL Editor → New query → coller → Run.
--
-- Principe : au moment de payer, la commande est créée côté serveur avec les
-- prix lus dans la base (jamais ceux envoyés par le navigateur) et les paires
-- sont réservées 30 minutes. Si le paiement aboutit, la commande passe en
-- « payée » ; sinon la réservation expire et les paires reviennent en stock.

-- 1. Commandes -------------------------------------------------------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  number          text not null unique,
  status          text not null default 'pending'
                  check (status in ('pending', 'paid', 'shipped', 'cancelled')),
  provider        text not null check (provider in ('stripe', 'paypal')),
  provider_ref    text,                 -- session Stripe ou commande PayPal
  items           jsonb not null,       -- [{ slug, name, colorway, size, condition, qty, price }]
  subtotal        numeric(10, 2) not null,
  shipping_method text not null,
  shipping_price  numeric(10, 2) not null,
  total           numeric(10, 2) not null,
  customer        jsonb not null,       -- { email, phone, firstName, lastName, address, zip, city }
  reserved_until  timestamptz not null default now() + interval '30 minutes',
  created_at      timestamptz not null default now(),
  paid_at         timestamptz,
  shipped_at      timestamptz
);

create index if not exists orders_status_idx on public.orders (status, reserved_until);

alter table public.orders enable row level security;

-- Seul l'admin lit et met à jour les commandes depuis le site ; les fonctions
-- de paiement passent par la clé serveur (service_role), qui ignore ces règles.
drop policy if exists "L'admin lit les commandes" on public.orders;
create policy "L'admin lit les commandes" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "L'admin met à jour les commandes" on public.orders;
create policy "L'admin met à jour les commandes" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 2. Stock -----------------------------------------------------------------
-- État d'une ligne de stock en un mot : « neuf », « occasion-9 »… (comme
-- conditionCode dans lib/products.ts). Une même pointure peut exister dans
-- plusieurs états : pointure + état identifient la ligne.
create or replace function public.condition_code(p_line jsonb)
returns text
language sql
immutable
as $$
  select case when p_line ->> 'condition' = 'Neuf' then 'neuf'
              else 'occasion-' || coalesce(p_line ->> 'grade', '0') end;
$$;

-- Ajoute (delta > 0) ou retire (delta < 0) des paires d'une pointure dans un
-- état (p_condition) ; sans état (anciennes commandes) : la première ligne de
-- la pointure. Renvoie l'état de la ligne modifiée.
drop function if exists public.adjust_stock(text, text, int);
create or replace function public.adjust_stock(p_slug text, p_size text, p_delta int, p_condition text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sizes jsonb;
  v_idx   int;
  v_stock int;
  v_cond  text;
begin
  select sizes into v_sizes from products where slug = p_slug for update;
  if v_sizes is null then
    raise exception 'unknown_product:%', p_slug;
  end if;

  select (t.ord - 1)::int, coalesce((t.elem ->> 'stock')::int, 0), condition_code(t.elem)
    into v_idx, v_stock, v_cond
    from jsonb_array_elements(v_sizes) with ordinality as t(elem, ord)
   where t.elem ->> 'size' = p_size
     and (nullif(p_condition, '') is null or condition_code(t.elem) = p_condition)
   order by t.ord
   limit 1;

  if v_idx is null then
    raise exception 'unknown_size:%:%', p_slug, p_size;
  end if;
  if v_stock + p_delta < 0 then
    raise exception 'out_of_stock:%:%', p_slug, p_size;
  end if;

  update products
     set sizes = jsonb_set(sizes, array[v_idx::text, 'stock'], to_jsonb(v_stock + p_delta))
   where slug = p_slug;
  return v_cond;
end;
$$;

-- Remet en stock les paires d'une commande non payée et l'annule.
create or replace function public.cancel_order(p_order uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders;
  v_item  jsonb;
begin
  select * into v_order from orders where id = p_order for update;
  if not found or v_order.status <> 'pending' then
    return;
  end if;
  for v_item in select * from jsonb_array_elements(v_order.items) loop
    begin
      perform adjust_stock(v_item ->> 'slug', v_item ->> 'size', (v_item ->> 'qty')::int, v_item ->> 'condition');
    exception when others then
      null; -- paire supprimée entre-temps : rien à remettre
    end;
  end loop;
  update orders set status = 'cancelled' where id = p_order;
end;
$$;

-- Libère les réservations expirées (appelée avant chaque nouvelle commande).
create or replace function public.release_expired_orders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_n  int := 0;
begin
  for v_id in
    select id from orders where status = 'pending' and reserved_until < now()
  loop
    perform cancel_order(v_id);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

-- 3. Création de commande ---------------------------------------------------
-- p_items : [{ "slug": "...", "size": "42,5", "condition": "occasion-9", "qty": 1 }]
-- p_customer : { email, phone, firstName, lastName, address, zip, city }
-- Tarifs de livraison : à garder identiques à SHIPPING dans data/site.ts.
create or replace function public.create_order(
  p_items    jsonb,
  p_customer jsonb,
  p_shipping text,
  p_provider text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item       jsonb;
  v_product    products;
  v_qty        int;
  v_cond       text;
  v_lines      jsonb := '[]'::jsonb;
  v_subtotal   numeric(10, 2) := 0;
  v_shipping   numeric(10, 2);
  v_free_from  constant numeric := 300;
  v_order      orders;
begin
  perform release_expired_orders();

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 20 then
    raise exception 'invalid_cart';
  end if;
  if p_provider not in ('stripe', 'paypal') then
    raise exception 'invalid_provider';
  end if;
  if coalesce(p_customer ->> 'email', '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'qty')::int, 0);
    if v_qty < 1 or v_qty > 5 then
      raise exception 'invalid_quantity';
    end if;

    select * into v_product from products where slug = v_item ->> 'slug';
    if not found then
      raise exception 'unknown_product:%', v_item ->> 'slug';
    end if;

    v_cond := adjust_stock(v_product.slug, v_item ->> 'size', -v_qty, v_item ->> 'condition');

    v_lines := v_lines || jsonb_build_object(
      'slug', v_product.slug,
      'name', v_product.name,
      'brand', v_product.brand,
      'colorway', v_product.colorway,
      'size', v_item ->> 'size',
      'condition', v_cond,
      'qty', v_qty,
      'price', v_product.price
    );
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  v_shipping := case p_shipping
    when 'relais' then 4.90
    when 'colissimo' then 6.90
    when 'express' then 12.90
  end;
  if v_shipping is null then
    raise exception 'invalid_shipping';
  end if;
  if v_subtotal >= v_free_from and p_shipping <> 'express' then
    v_shipping := 0;
  end if;

  insert into orders (number, provider, items, subtotal, shipping_method, shipping_price, total, customer)
  values (
    'ES-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    p_provider,
    v_lines,
    v_subtotal,
    p_shipping,
    v_shipping,
    v_subtotal + v_shipping,
    p_customer
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- Passe une commande en « payée » (idempotent : sans effet si déjà payée).
create or replace function public.mark_order_paid(p_order uuid, p_ref text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders;
begin
  select * into v_order from orders where id = p_order for update;
  if not found then
    raise exception 'unknown_order';
  end if;

  if v_order.status = 'cancelled' then
    -- payé après l'expiration de la réservation : on reprend les paires si
    -- elles sont encore disponibles, sinon l'admin devra rembourser
    begin
      perform adjust_stock(i ->> 'slug', i ->> 'size', -((i ->> 'qty')::int), i ->> 'condition')
        from jsonb_array_elements(v_order.items) as i;
    exception when others then
      raise warning 'order % paid after expiry and stock is gone: refund needed', v_order.number;
    end;
  end if;

  if v_order.status in ('pending', 'cancelled') then
    update orders
       set status = 'paid', paid_at = now(), provider_ref = coalesce(p_ref, provider_ref)
     where id = p_order
    returning * into v_order;
  end if;
  return v_order;
end;
$$;

-- 4. Droits : seules les fonctions serveur (service_role) peuvent appeler ces
-- fonctions ; le site ne peut ni créer de commande ni toucher au stock seul.
revoke all on function public.adjust_stock(text, text, int, text) from public, anon, authenticated;
revoke all on function public.cancel_order(uuid) from public, anon, authenticated;
revoke all on function public.release_expired_orders() from public, anon, authenticated;
revoke all on function public.create_order(jsonb, jsonb, text, text) from public, anon, authenticated;
revoke all on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.adjust_stock(text, text, int, text) to service_role;
grant execute on function public.cancel_order(uuid) to service_role;
grant execute on function public.release_expired_orders() to service_role;
grant execute on function public.create_order(jsonb, jsonb, text, text) to service_role;
grant execute on function public.mark_order_paid(uuid, text) to service_role;
