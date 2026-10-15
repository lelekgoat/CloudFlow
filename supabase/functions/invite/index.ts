// Supabase Edge Function: invite
// Laedt einen neuen Kunden ein (nur fuer Admin-Konten).
// Der Kunde bekommt eine E-Mail mit Link und legt dort sein Passwort selbst fest.
//
// Aufruf aus dem Admin-Dashboard: sb.functions.invoke('invite', { body: { email, company_name, plan, billing } })
// Secrets: SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY gibt es automatisch.
//          DASHBOARD_URL (optional, Standard: https://cloudflow.at/dashboard.html)
//
// WICHTIG: Bei dieser Funktion "Verify JWT" AUSSCHALTEN. Die Funktion prueft selbst,
// ob der Aufrufer eingeloggt und Admin ist.
// E-Mails gehen nur an Kunden raus, wenn in Supabase ein eigener SMTP-Server (Resend) eingetragen ist.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PLANS = ["Basic", "Standard", "Premium"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt" }, 405);

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // 1) Ist der Aufrufer eingeloggt und Admin?
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: { user }, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !user) return json({ error: "Nicht angemeldet." }, 401);
    const { data: me } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (!me?.is_admin) return json({ error: "Nur fuer Admins." }, 403);

    // 2) Eingaben pruefen
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const company = String(body.company_name ?? "").trim().slice(0, 100);
    const plan = PLANS.includes(body.plan) ? body.plan : "Standard";
    const billing = body.billing === "jaehrlich" ? "jaehrlich" : "monatlich";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Bitte eine gültige E-Mail-Adresse eingeben." }, 400);
    if (!company) return json({ error: "Bitte den Firmennamen eingeben." }, 400);

    // 3) Einladung verschicken (legt das Konto an, Profil entsteht per Trigger)
    const redirectTo = Deno.env.get("DASHBOARD_URL") || "https://cloudflow.at/dashboard.html";
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { company_name: company },
      redirectTo,
    });
    if (error) {
      console.error("invite:", error.message);
      const msg = /already|registered|exists/i.test(error.message)
        ? "Für diese E-Mail gibt es schon ein Konto."
        : /not authorized|smtp|sending/i.test(error.message)
          ? "E-Mail konnte nicht gesendet werden. Ist Resend als SMTP in Supabase eingetragen?"
          : error.message;
      return json({ error: msg }, 400);
    }

    // 4) Paket, Abrechnung und Firma im Profil setzen
    const { error: pErr } = await admin.from("profiles").upsert(
      { id: data.user.id, email, company_name: company, plan, billing, sub_status: "Interessent" },
      { onConflict: "id" },
    );
    if (pErr) console.error("profiles:", pErr.message);

    return json({ ok: true, id: data.user.id });
  } catch (err) {
    console.error("Unerwarteter Fehler:", err);
    return json({ error: String(err) }, 500);
  }
});
