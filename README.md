# CloudFlow
Website für CloudFlow

## Datenbank einrichten (Supabase → SQL Editor)

Die Dateien in `supabase/` in dieser Reihenfolge ausführen. Alle sind idempotent, mehrfaches Ausführen ist ok.

1. `setup.sql` – Tabellen, Profile, Admin-Prüfung, PDF-Speicher
2. `migration-abo.sql` – Abo-Felder, Schutz von Paket/Status
3. `migration-limits.sql` – Chat-Protokoll, Dokument-Limits, Widget-Design
4. `migration-zahlung.sql` – „Bezahlt bis“
5. `migration-name.sql` – Name/Begrüßung im Widget
6. `migration-statistik.sql` – Statistik im Dashboard
7. `migration-aufraeumen.sql` – löscht `chat_log`-Einträge nach 90 Tagen (pg_cron)
8. `migration-sicherheit.sql` – E-Mail-Schutz, PDF-Größe/-Anzahl serverseitig, Längen-Grenzen

Wichtig: `setup.sql` setzt die Speicherregeln für PDFs zurück. Danach immer auch `migration-sicherheit.sql` erneut ausführen.

## Edge Functions

- `supabase/functions/chat` – Chatbot (Secrets: `ANTHROPIC_API_KEY`, optional `RESEND_API_KEY`, `RESEND_FROM`, `CLAUDE_MODEL`)
- `supabase/functions/invite` – Kunden einladen (nur Admin; optional `DASHBOARD_URL`)

Bei beiden Funktionen „Verify JWT“ ausschalten, sie prüfen selbst.

## Sonstiges

- GitHub Actions → Secret `SUPABASE_ANON_KEY` (anon-Key aus Supabase) für den Keep-Alive-Workflow.
- `vendor/` enthält supabase-js 2.118.0 und pdf.js 3.11.174 (selbst gehostet, fest versioniert).
- Nach Änderungen an `widget.js` die Version `?v=…` in den HTML-Seiten erhöhen.
