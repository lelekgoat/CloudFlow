-- CloudFlow: "Bezahlt bis" pro Kunde
-- Im Supabase SQL Editor ausfuehren (zuerst migration-abo.sql und migration-limits.sql).
alter table public.profiles add column if not exists paid_until date;

create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.plan       := old.plan;
  new.billing    := old.billing;
  new.sub_status := old.sub_status;
  new.notes      := old.notes;
  new.plan_since := old.plan_since;
  new.is_admin   := old.is_admin;
  new.paid_until := old.paid_until;
  return new;
end;
$$;

select email, plan, sub_status, paid_until from public.profiles order by created_at;
