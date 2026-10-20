-- CloudFlow: Sicherheits-Nachbesserungen
-- Im Supabase SQL Editor ausfuehren (mehrfaches Ausfuehren ist ok).
-- Voraussetzung: setup.sql, migration-abo.sql, migration-limits.sql, migration-zahlung.sql
-- ACHTUNG: setup.sql setzt die PDF-Speicherregeln zurueck. Wenn du setup.sql erneut ausfuehrst,
-- danach diese Datei noch einmal ausfuehren.

-- 1) Kunden duerfen ihre E-Mail im Profil nicht selbst aendern.
--    Terminanfragen gehen an profiles.email, sonst koennte man fremde Adressen eintragen.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.email      := old.email;
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

-- 2) PDF-Speicher: nur PDFs, max. 10 MB pro Datei
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['application/pdf']
 where id = 'pdfs';

-- 3) PDF-Speicher: Anzahl Dateien je Paket auch serverseitig begrenzen
--    (Basic 5, Standard 15, Premium 30; Admin unbegrenzt; gleichnamige Datei ersetzen ist immer erlaubt)
drop policy if exists "pdfs_insert_own" on storage.objects;
create policy "pdfs_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (
      public.is_admin()
      or exists (select 1 from storage.objects o where o.bucket_id = 'pdfs' and o.name = objects.name)
      or (select count(*) from storage.objects o
           where o.bucket_id = 'pdfs' and (storage.foldername(o.name))[1] = auth.uid()::text)
         < public.plan_doc_limit(auth.uid())
    )
  );

-- 4) Groessen-Grenzen fuer Texte (NOT VALID: bestehende Zeilen werden nicht geprueft)
alter table public.documents drop constraint if exists documents_content_len;
alter table public.documents add constraint documents_content_len
  check (char_length(content) <= 200000) not valid;
alter table public.documents drop constraint if exists documents_file_name_len;
alter table public.documents add constraint documents_file_name_len
  check (char_length(file_name) <= 200) not valid;
alter table public.profiles drop constraint if exists profiles_widget_config_size;
alter table public.profiles add constraint profiles_widget_config_size
  check (pg_column_size(widget_config) <= 8000) not valid;

-- Kontrolle
select id, file_size_limit, allowed_mime_types from storage.buckets where id = 'pdfs';
