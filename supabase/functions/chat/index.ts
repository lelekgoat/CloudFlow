// Supabase Edge Function: chat   (komplett neu)
// Nimmt Kundenfragen entgegen, holt die PDF-Texte der Firma, fragt Claude
// und leitet Terminwünsche optional per E-Mail (Resend) weiter.
//
// Secrets (Supabase -> Edge Functions -> Secrets):
//   ANTHROPIC_API_KEY   (Pflicht)
//   RESEND_API_KEY      (optional, für Terminmails; ohne Schlüssel gibt es keine Terminfunktion)
//   RESEND_FROM         (optional, Absender, z. B. "CloudFlow <termine@cloudflow.at>")
//   CLAUDE_MODEL        (optional, Standard: claude-sonnet-5)
// SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY gibt es automatisch.
//
// WICHTIG: Bei dieser Funktion "Verify JWT" / "Enforce JWT verification" AUSSCHALTEN.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_DOC_CHARS = 40000;
const MAX_HISTORY = 12;
const LIMIT_IP_PER_MIN = 8;      // Nachrichten pro Besucher (IP) und Minute
const LIMIT_COMPANY_PER_DAY = 500; // Nachrichten pro Firma und Tag
const MONTH_LIMITS: Record<string, number> = { Basic: 500, Standard: 2000, Premium: 5000 }; // faire Nutzung pro Monat

async function sha256(t: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const company_id: string = body.company_id;
    const message: string = String(body.message ?? "").trim().slice(0, 2000);

    if (!company_id || !UUID.test(company_id) || !message) {
      return json({ error: "company_id (UUID) und message erforderlich" }, 400);
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY fehlt in den Secrets");
      return json({ error: "Server nicht konfiguriert (ANTHROPIC_API_KEY)" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // --- Missbrauchsschutz (Metadaten only, kein Nachrichteninhalt) ---
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    const ipHash = await sha256(ip + ":" + company_id);
    const since1 = new Date(Date.now() - 60_000).toISOString();
    const since24 = new Date(Date.now() - 86_400_000).toISOString();
    const [{ count: ipCount }, { count: dayCount }] = await Promise.all([
      supabase.from("chat_log").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since1),
      supabase.from("chat_log").select("id", { count: "exact", head: true }).eq("company_id", company_id).gte("created_at", since24),
    ]);
    if ((ipCount ?? 0) >= LIMIT_IP_PER_MIN) {
      return json({ reply: "Bitte warte einen Moment, du schreibst sehr schnell. Versuch es in einer Minute noch einmal." });
    }
    if ((dayCount ?? 0) >= LIMIT_COMPANY_PER_DAY) {
      return json({ reply: "Der Assistent ist heute leider ausgelastet. Bitte nimm direkt Kontakt mit uns auf." });
    }
    const { data: logRow } = await supabase.from("chat_log").insert({ company_id, ip_hash: ipHash }).select("id").single();

    const [{ data: profile, error: pErr }, { data: docs, error: dErr }] = await Promise.all([
      supabase.from("profiles").select("company_name, email, is_admin, paid_until, plan, sub_status").eq("id", company_id).maybeSingle(),
      supabase.from("documents").select("file_name, content").eq("user_id", company_id).order("created_at"),
    ]);
    if (pErr) console.error("profiles:", pErr.message);
    if (dErr) console.error("documents:", dErr.message);

    // Nur aktive Kunden (und das Admin-Konto) bekommen Antworten
    if (!profile || (!profile.is_admin && profile.sub_status !== "Aktiv")) {
      return json({ reply: "Der Assistent ist gerade nicht verfügbar. Bitte nimm direkt Kontakt mit dem Unternehmen auf." });
    }

    // Abo abgelaufen? (7 Tage Kulanz). Ohne "paid_until" und Admin-Konten wird nie gesperrt.
    if (profile && !profile.is_admin && profile.paid_until) {
      const limit = new Date(profile.paid_until).getTime() + 8 * 86_400_000;
      if (Date.now() > limit) {
        return json({ reply: "Der Assistent ist gerade nicht verfügbar. Bitte nimm direkt Kontakt mit dem Unternehmen auf." });
      }
    }

    // Monatslimit je Paket (faire Nutzung); Admin-Konto ausgenommen
    if (profile && !profile.is_admin) {
      const monthLimit = MONTH_LIMITS[profile.plan ?? "Standard"] ?? MONTH_LIMITS.Standard;
      const m0 = new Date(); m0.setUTCDate(1); m0.setUTCHours(0, 0, 0, 0);
      const { count: monthCount } = await supabase.from("chat_log").select("id", { count: "exact", head: true })
        .eq("company_id", company_id).gte("created_at", m0.toISOString());
      if ((monthCount ?? 0) > monthLimit) {
        return json({ reply: "Der Assistent hat sein Nachrichtenlimit für diesen Monat erreicht. Bitte nimm direkt Kontakt mit dem Unternehmen auf." });
      }
    }

    const companyName = profile?.company_name || "dieses Unternehmen";

    // Funktionen je Paket (wie auf der Preise-Seite)
    const plan = profile?.plan ?? "Basic";
    const isAdmin = !!profile?.is_admin;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    // Terminanfragen: nur Standard/Premium und nur, wenn der E-Mail-Versand wirklich eingerichtet ist
    const canBook = (isAdmin || plan === "Standard" || plan === "Premium") && !!resendKey && !!profile?.email;
    // Mehrsprachig: nur Premium (und Admin)
    const multilingual = isAdmin || plan === "Premium";

    let knowledge = "Es wurden noch keine Dokumente hochgeladen.";
    if (docs && docs.length > 0) {
      knowledge = docs
        .map((d: any) => `--- ${d.file_name} ---\n${d.content ?? ""}`)
        .join("\n\n")
        .slice(0, MAX_DOC_CHARS);
    }

    const system = `Du bist der freundliche KI-Assistent von ${companyName} auf deren Website.
Beantworte Fragen der Besucher NUR auf Basis der Dokumente unten. Steht die Antwort dort nicht, sag ehrlich, dass du es nicht weißt, und schlage vor, direkt Kontakt aufzunehmen. Erfinde nie Preise, Zeiten oder Fakten.
Antworte kurz (meist 1-3 Sätze) und freundlich.
${multilingual
  ? "Antworte in der Sprache des Besuchers (Standard: Deutsch)."
  : "Antworte immer auf Deutsch, auch wenn der Besucher in einer anderen Sprache schreibt."}
${canBook
  ? 'Wenn jemand einen Termin möchte, frage nach Name und Wunschtermin und nutze dann das Tool "book_appointment". Sag dabei, dass es eine Anfrage ist und das Unternehmen den Termin noch bestätigt.'
  : "Du kannst keine Termine oder Reservierungen entgegennehmen oder weiterleiten. Wenn jemand einen Termin möchte, sag das ehrlich und nenne die Kontaktmöglichkeiten aus den Dokumenten (Telefon, E-Mail, Online-Buchung). Behaupte nie, etwas weitergeleitet oder gebucht zu haben."}

Dokumente von ${companyName}:
${knowledge}`;

    // Verlauf bereinigen: nur user/assistant mit Text, beginnt mit "user", wechselt sauber
    const rawHistory: any[] = Array.isArray(body.history) ? body.history : [];
    const clean: { role: string; content: string }[] = [];
    for (const m of rawHistory.slice(-MAX_HISTORY)) {
      if ((m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim()) {
        if (clean.length && clean[clean.length - 1].role === m.role) {
          clean[clean.length - 1].content += "\n" + m.content;
        } else {
          clean.push({ role: m.role, content: m.content.slice(0, 2000) });
        }
      }
    }
    while (clean.length && clean[0].role !== "user") clean.shift();
    if (clean.length && clean[clean.length - 1].role === "user") {
      clean[clean.length - 1].content += "\n" + message;
    } else {
      clean.push({ role: "user", content: message });
    }

    const tools = [{
      name: "book_appointment",
      description: "Erfasst einen Terminwunsch eines Kunden und benachrichtigt das Unternehmen per E-Mail.",
      input_schema: {
        type: "object",
        properties: {
          customer_name: { type: "string", description: "Name des Kunden" },
          desired_date: { type: "string", description: "Gewünschtes Datum/Uhrzeit, wie vom Kunden genannt" },
          service: { type: "string", description: "Gewünschte Leistung bzw. Grund des Termins" },
          contact: { type: "string", description: "Telefonnummer oder E-Mail des Kunden, falls genannt" },
        },
        required: ["customer_name", "desired_date"],
      },
    }];

    const model = Deno.env.get("CLAUDE_MODEL") || "claude-sonnet-5";

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(canBook
        ? { model, max_tokens: 600, system, tools, messages: clean }
        : { model, max_tokens: 600, system, messages: clean }),
    });

    const ai = await aiRes.json().catch(() => ({}));

    if (!aiRes.ok || ai.error) {
      console.error("Anthropic Fehler", aiRes.status, JSON.stringify(ai.error ?? ai));
      return json({ error: ai?.error?.message || `Anthropic API Fehler (${aiRes.status})` }, 502);
    }

    const toolUse = ai.content?.find((c: any) => c.type === "tool_use" && c.name === "book_appointment");
    let reply = "";

    if (toolUse && canBook) {
      const { customer_name, desired_date, service, contact } = toolUse.input ?? {};
      const from = Deno.env.get("RESEND_FROM") || "CloudFlow <onboarding@resend.dev>";
      let sent = false;
      try {
        const mail = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from,
            to: profile!.email,
            subject: "Neuer Terminwunsch über deinen CloudFlow-Chatbot",
            text: `Neuer Terminwunsch:\n\nName: ${customer_name}\nWunschtermin: ${desired_date}\nLeistung: ${service || "nicht angegeben"}\nKontakt: ${contact || "nicht angegeben"}\n\nBitte direkt mit dem Kunden bestätigen.`,
          }),
        });
        sent = mail.ok;
        // Fuer die Statistik im Dashboard als Terminanfrage markieren
        if (sent && logRow?.id) {
          const { error: bErr } = await supabase.from("chat_log").update({ booking: true }).eq("id", logRow.id);
          if (bErr) console.error("chat_log booking:", bErr.message);
        }
        if (!mail.ok) console.error("Resend Status", mail.status, await mail.text());
      } catch (e) {
        console.error("Resend:", String(e));
      }

      // Nur dann "weitergeleitet" sagen, wenn die E-Mail wirklich rausging
      reply = sent
        ? `Danke, ${customer_name}! Deine Terminanfrage (${desired_date}${service ? ", " + service : ""}) wurde an ${companyName} weitergeleitet. Der Termin ist erst fix, wenn ${companyName} ihn dir bestätigt.`
        : `Entschuldigung, ich konnte deine Terminanfrage gerade nicht weiterleiten. Bitte nimm direkt Kontakt mit ${companyName} auf.`;
    } else {
      reply = ai.content?.find((c: any) => c.type === "text")?.text?.trim()
        || "Entschuldigung, dazu habe ich gerade keine Antwort.";
    }

    return json({ reply });
  } catch (err) {
    console.error("Unerwarteter Fehler:", err);
    return json({ error: String(err) }, 500);
  }
});
