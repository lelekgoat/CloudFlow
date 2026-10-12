-- CloudFlow: Missbrauchsschutz, Dokument-Limits, Design-Speicher
-- Im Supabase SQL Editor einmal komplett ausfuehren (mehrfaches Ausfuehren ist ok).

-- 1) Chat-Protokoll (nur Metadaten, keine Nachrichteninhalte)
create table if not exists public.chat_log (
  id bigserial primary key,
  company_id uuid not null,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists chat_log_company_idx on public.chat_log(company_id, created_at);
create index if not exists chat_log_ip_idx on public.chat_log(ip_hash, created_at);
alter table public.chat_log enable row level security;
drop policy if exists "chat_log_admin_select" on public.chat_log;
create policy "chat_log_admin_select" on public.chat_log for select using (public.is_admin());
-- (Insert macht nur die Edge Function mit dem service_role Key.)

-- Alte Eintraege aufraeumen (manuell oder per Cron): 
-- delete from public.chat_log where created_at < now() - interval '30 days';

-- 2) Design-Einstellungen pro Kunde
alter table public.profiles add column if not exists widget_config jsonb not null default '{}'::jsonb;

-- 3) Oeffentliche Design-Abfrage fuer widget.js (Premium-Felder nur bei Premium)
create or replace function public.get_widget_config(company uuid)
returns jsonb language sql security definer set search_path = public as $$
  select case
    when p.plan = 'Premium' then coalesce(p.widget_config, '{}'::jsonb)
    else coalesce(p.widget_config, '{}'::jsonb) - 'name' - 'greeting' - 'topics' - 'logo'
  end
  from public.profiles p where p.id = company;
$$;
grant execute on function public.get_widget_config(uuid) to anon, authenticated;

-- 4) Dokument-Limit pro Paket (Basic 5, Standard 15, Premium 30; Admin unbegrenzt)
create or replace function public.plan_doc_limit(uid uuid)
returns int language sql stable security definer set search_path = public as $$
  select case coalesce((select plan from public.profiles where id = uid), 'Standard')
    when 'Basic' then 5 when 'Premium' then 30 else 15 end;
$$;

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
  for insert with check (
    user_id = auth.uid()
    and (public.is_admin() or (select count(*) from public.documents d where d.user_id = auth.uid()) < public.plan_doc_limit(auth.uid()))
  );

select 'ok' as status;
