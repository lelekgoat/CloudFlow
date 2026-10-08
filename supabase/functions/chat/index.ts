// Supabase Edge Function: chat   (komplett neu)
// Nimmt Kundenfragen entgegen, holt die PDF-Texte der Firma, fragt Claude
// und leitet Terminwünsche optional per E-Mail (Resend) weiter.
//
// Secrets (Supabase -> Edge Functions -> Secrets):
//   ANTHROPIC_API_KEY   (Pflicht)
//   RESEND_API_KEY      (optional, für Terminmails)
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

    const [{ data: profile, error: pErr }, { data: docs, error: dErr }] = await Promise.all([
      supabase.from("profiles").select("company_name, email").eq("id", company_id).maybeSingle(),
      supabase.from("documents").select("file_name, content").eq("user_id", company_id).order("created_at"),
    ]);
    if (pErr) console.error("profiles:", pErr.message);
    if (dErr) console.error("documents:", dErr.message);

    const companyName = profile?.company_name || "dieses Unternehmen";

    let knowledge = "Es wurden noch keine Dokumente hochgeladen.";
    if (docs && docs.length > 0) {
      knowledge = docs
        .map((d: any) => `--- ${d.file_name} ---\n${d.content ?? ""}`)
        .join("\n\n")
        .slice(0, MAX_DOC_CHARS);
    }

    const system = `Du bist der freundliche KI-Assistent von ${companyName} auf deren Website.
Beantworte Fragen der Besucher NUR auf Basis der Dokumente unten. Steht die Antwort dort nicht, sag ehrlich, dass du es nicht weißt, und schlage vor, direkt Kontakt aufzunehmen. Erfinde nie Preise, Zeiten oder Fakten.
Antworte kurz (meist 1-3 Sätze), freundlich und in der Sprache des Besuchers (Standard: Deutsch).
Wenn jemand einen Termin möchte, frage nach Name und Wunschtermin und nutze dann das Tool "book_appointment".

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
      body: JSON.stringify({ model, max_tokens: 600, system, tools, messages: clean }),
    });

    const ai = await aiRes.json().catch(() => ({}));

    if (!aiRes.ok || ai.error) {
      console.error("Anthropic Fehler", aiRes.status, JSON.stringify(ai.error ?? ai));
      return json({ error: ai?.error?.message || `Anthropic API Fehler (${aiRes.status})` }, 502);
    }

    const toolUse = ai.content?.find((c: any) => c.type === "tool_use" && c.name === "book_appointment");
    let reply = "";

    if (toolUse) {
      const { customer_name, desired_date, service, contact } = toolUse.input ?? {};
      const resendKey = Deno.env.get("RESEND_API_KEY");

      if (resendKey && profile?.email) {
        const mail = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "CloudFlow <onboarding@resend.dev>",
            to: profile.email,
            subject: "Neuer Terminwunsch über deinen CloudFlow-Chatbot",
            text: `Neuer Terminwunsch:\n\nName: ${customer_name}\nWunschtermin: ${desired_date}\nLeistung: ${service || "nicht angegeben"}\nKontakt: ${contact || "nicht angegeben"}\n\nBitte direkt mit dem Kunden bestätigen.`,
          }),
        }).catch((e) => { console.error("Resend:", String(e)); return null; });
        if (mail && !mail.ok) console.error("Resend Status", mail.status, await mail.text());
      } else {
        console.log("Terminwunsch (keine Mail versendet):", JSON.stringify(toolUse.input));
      }

      reply = `Danke, ${customer_name}! Dein Terminwunsch (${desired_date}${service ? ", " + service : ""}) wurde an ${companyName} weitergeleitet. Du bekommst bald eine Bestätigung.`;
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
