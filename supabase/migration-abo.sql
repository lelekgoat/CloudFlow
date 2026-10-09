-- CloudFlow: Abo-Verwaltung fuer das Admin-Dashboard (idempotent, beliebig oft ausfuehrbar)
-- Supabase -> SQL Editor -> New query -> alles einfuegen -> Run

-- 1) Neue Spalten pro Kunde
alter table public.profiles add column if not exists billing    text default 'monatlich';   -- monatlich | jaehrlich
alter table public.profiles add column if not exists sub_status text default 'Interessent';  -- Interessent | Aktiv | Pausiert | Gekuendigt
alter table public.profiles add column if not exists notes      text;
alter table public.profiles add column if not exists plan_since date;

-- 2) Admin darf alle Profile bearbeiten
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- 3) Kunden duerfen Paket/Status/Admin-Flag NICHT selbst aendern
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- SQL-Editor / Service-Role (kein eingeloggter Nutzer) darf alles
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.plan       := old.plan;
  new.billing    := old.billing;
  new.sub_status := old.sub_status;
  new.notes      := old.notes;
  new.plan_since := old.plan_since;
  new.is_admin   := old.is_admin;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- 4) Dich als Admin eintragen
update public.profiles set is_admin = true where email = 'darmin@chello.at';

-- Kontrolle
select email, is_admin, plan, billing, sub_status from public.profiles order by created_at;
