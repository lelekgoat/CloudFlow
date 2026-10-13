-- CloudFlow: Name und Begruessung fuer alle Pakete, Logo und Themen-Buttons nur Premium
-- Im Supabase SQL Editor ausfuehren (mehrfaches Ausfuehren ist ok).
create or replace function public.get_widget_config(company uuid)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'launcher', c.cfg->'launcher',
    'chat',     c.cfg->'chat',
    'primary',  c.cfg->'primary',
    'accent',   c.cfg->'accent',
    'name',     coalesce(nullif(c.cfg->>'name', ''), p.company_name),
    'greeting', nullif(c.cfg->>'greeting', ''),
    'topics',   case when p.plan = 'Premium' then nullif(c.cfg->>'topics', '') end,
    'logo',     case when p.plan = 'Premium' then nullif(c.cfg->>'logo', '') end
  ))
  from public.profiles p
  cross join lateral (select coalesce(p.widget_config, '{}'::jsonb) as cfg) c
  where p.id = company;
$$;
grant execute on function public.get_widget_config(uuid) to anon, authenticated;
select 'ok' as status;
