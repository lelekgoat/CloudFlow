-- CloudFlow: chat_log automatisch aufraeumen (Eintraege aelter als 90 Tage)
-- Im Supabase SQL Editor einmal ausfuehren (mehrfaches Ausfuehren ist ok).
-- Die Statistik braucht nur die letzten 2 Monate, 90 Tage lassen genug Puffer.

create extension if not exists pg_cron;

-- alten Job entfernen, falls vorhanden, dann neu anlegen (taeglich 03:15 UTC)
select cron.unschedule(jobid) from cron.job where jobname = 'chat_log_cleanup';
select cron.schedule(
  'chat_log_cleanup',
  '15 3 * * *',
  $$ delete from public.chat_log where created_at < now() - interval '90 days' $$
);

select jobname, schedule from cron.job where jobname = 'chat_log_cleanup';
