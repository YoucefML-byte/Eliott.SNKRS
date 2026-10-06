-- Eliott SNKRS — base de données du stock (Supabase / PostgreSQL)
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller → Run.

-- 1. Les paires ----------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  brand        text not null,
  colorway     text not null default '',
  collab       text,
  price        numeric(10, 2) not null check (price >= 0),
  retail       numeric(10, 2),
  -- [{ "size": "42,5", "condition": "Neuf" | "Occasion", "grade": 9, "stock": 1 }]
  sizes        jsonb not null default '[]'::jsonb,
  description  text not null default '',
  -- [{ "view": "side", "src": "https://…", "label": "Profil" }]
  images       jsonb not null default '[]'::jsonb,
  release_year int,
  featured     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- 2. Qui est admin -------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 3. Règles d'accès : tout le monde lit, seul l'admin écrit ----------------
alter table public.products enable row level security;
alter table public.admins enable row level security;

drop policy if exists "Lecture publique des paires" on public.products;
create policy "Lecture publique des paires" on public.products
  for select using (true);

drop policy if exists "Ajout par l'admin" on public.products;
create policy "Ajout par l'admin" on public.products
  for insert to authenticated with check (public.is_admin());

drop policy if exists "Modification par l'admin" on public.products;
create policy "Modification par l'admin" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Suppression par l'admin" on public.products;
create policy "Suppression par l'admin" on public.products
  for delete to authenticated using (public.is_admin());

drop policy if exists "Un admin voit sa propre ligne" on public.admins;
create policy "Un admin voit sa propre ligne" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- 4. Photos (Supabase Storage) -------------------------------------------
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "Lecture publique des photos" on storage.objects;
create policy "Lecture publique des photos" on storage.objects
  for select using (bucket_id = 'products');

drop policy if exists "Envoi de photos par l'admin" on storage.objects;
create policy "Envoi de photos par l'admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'products' and public.is_admin());

drop policy if exists "Suppression de photos par l'admin" on storage.objects;
create policy "Suppression de photos par l'admin" on storage.objects
  for delete to authenticated using (bucket_id = 'products' and public.is_admin());

-- 5. Déclarer le compte d'Eliott comme admin -------------------------------
-- Après avoir créé son compte (Authentication → Users → Add user),
-- remplacer l'e-mail puis exécuter :
--
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'eliott@exemple.fr';
