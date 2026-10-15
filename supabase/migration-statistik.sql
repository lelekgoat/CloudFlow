-- CloudFlow: Statistik fuer Kunden- und Admin-Dashboard
-- Im Supabase SQL Editor einmal komplett ausfuehren (mehrfaches Ausfuehren ist ok).
-- Zaehlt nur Metadaten aus chat_log (keine Nachrichteninhalte). Monate nach Wiener Zeit.

-- 1) Markierung, ob eine Nachricht eine weitergeleitete Terminanfrage war
alter table public.chat_log add column if not exists booking boolean not null default false;

-- 2) Kunde: eigene Zahlen (Monat, Vormonat, Terminanfragen, letzte 30 Tage)
create or replace function public.get_my_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  with m as (
    select (date_trunc('month', now() at time zone 'Europe/Vienna') at time zone 'Europe/Vienna') as m0
  )
  select jsonb_build_object(
    'this_month', (select count(*) from chat_log c, m where c.company_id = auth.uid() and c.created_at >= m.m0),
    'last_month', (select count(*) from chat_log c, m where c.company_id = auth.uid()
                     and c.created_at >= m.m0 - interval '1 month' and c.created_at < m.m0),
    'bookings',   (select count(*) from chat_log c, m where c.company_id = auth.uid() and c.booking and c.created_at >= m.m0),
    'days', (
      select coalesce(jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d), '[]'::jsonb)
      from (
        select (c.created_at at time zone 'Europe/Vienna')::date as d, count(*) as n
        from chat_log c
        where c.company_id = auth.uid() and c.created_at >= now() - interval '30 days'
        group by 1
      ) x
    )
  );
$$;
revoke all on function public.get_my_stats() from public, anon;
grant execute on function public.get_my_stats() to authenticated;

-- 3) Admin: Zahlen pro Kunde (nur fuer Admin-Konten, sonst leer)
create or replace function public.get_admin_stats()
returns table(company_id uuid, this_month bigint, last_month bigint, bookings bigint, last_at timestamptz)
language sql stable security definer set search_path = public as $$
  with m as (
    select (date_trunc('month', now() at time zone 'Europe/Vienna') at time zone 'Europe/Vienna') as m0
  )
  select c.company_id,
         count(*) filter (where c.created_at >= m.m0),
         count(*) filter (where c.created_at >= m.m0 - interval '1 month' and c.created_at < m.m0),
         count(*) filter (where c.booking and c.created_at >= m.m0),
         max(c.created_at)
  from chat_log c cross join m
  where public.is_admin()
  group by c.company_id;
$$;
revoke all on function public.get_admin_stats() from public, anon;
grant execute on function public.get_admin_stats() to authenticated;

-- Hinweis: chat_log fuer die Statistik mindestens 2 Monate aufbewahren.
-- Aufraeumen z. B. so: delete from public.chat_log where created_at < now() - interval '90 days';

select 'ok' as status;
