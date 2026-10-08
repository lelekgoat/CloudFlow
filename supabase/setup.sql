-- CloudFlow: kompletter Datenbank-Neuaufbau (idempotent)
-- Kann beliebig oft ausgeführt werden, bestehende Daten bleiben erhalten.
-- Supabase -> SQL Editor -> New query -> alles einfügen -> Run

-- 1) Tabellen -------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  company_name text,
  plan         text default 'Standard',
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  file_name  text not null,
  content    text,
  created_at timestamptz not null default now()
);

-- falls Spalten durch Experimente fehlen
alter table public.profiles  add column if not exists email        text;
alter table public.profiles  add column if not exists company_name text;
alter table public.profiles  add column if not exists plan         text default 'Standard';
alter table public.profiles  add column if not exists is_admin     boolean not null default false;
alter table public.profiles  add column if not exists created_at   timestamptz not null default now();
alter table public.documents add column if not exists content      text;
alter table public.documents add column if not exists created_at   timestamptz not null default now();

create index if not exists documents_user_idx on public.documents(user_id);

-- 2) Profil automatisch bei Registrierung ----------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, company_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'company_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- fehlende Profile für bestehende Nutzer nachtragen
insert into public.profiles (id, email, company_name)
select u.id, u.email, split_part(u.email,'@',1)
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 3) Admin-Prüfung ohne Rekursion ------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- 4) Row Level Security -----------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.documents enable row level security;

do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('profiles','documents')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and is_admin = (select is_admin from public.profiles where id = auth.uid()));

create policy "documents_select_own_or_admin" on public.documents
  for select using (user_id = auth.uid() or public.is_admin());
create policy "documents_insert_own" on public.documents
  for insert with check (user_id = auth.uid());
create policy "documents_delete_own" on public.documents
  for delete using (user_id = auth.uid());

-- 5) Storage-Bucket für PDFs -------------------------------------------------
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;

do $$
declare r record;
begin
  for r in select policyname from pg_policies
           where schemaname = 'storage' and tablename = 'objects' and policyname like 'pdfs_%'
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

create policy "pdfs_select_own" on storage.objects
  for select using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdfs_insert_own" on storage.objects
  for insert with check (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdfs_update_own" on storage.objects
  for update using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdfs_delete_own" on storage.objects
  for delete using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

-- 6) Dich als Admin eintragen (E-Mail anpassen, falls anders) -------------------
-- update public.profiles set is_admin = true where email = 'DEINE@EMAIL.AT';

-- 7) Kontrolle: sollte 2 Tabellen und 1 Bucket zeigen
select
  (select count(*) from information_schema.tables where table_schema='public' and table_name in ('profiles','documents')) as tabellen,
  (select count(*) from storage.buckets where id='pdfs') as bucket,
  (select count(*) from public.profiles) as profile_anzahl,
  (select count(*) from public.documents) as dokumente_anzahl;
