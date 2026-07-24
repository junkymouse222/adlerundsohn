import { createFileRoute } from "@tanstack/react-router";
import logoAsset from "@/assets/kanzlei-logo.png.asset.json";

// Öffentlicher Endpunkt: Kunde klickt in Rechnungs-Mail/PDF auf "Zahlung bestätigen".
// Erwartet ?token=<pay_token>. Markiert die Rechnung als bezahlt (idempotent).

function page(status: "ok" | "already" | "invalid", rechnungNr?: string): Response {
  const title =
    status === "invalid"
      ? "Rechnung nicht gefunden"
      : status === "already"
      ? "Zahlung bereits bestätigt"
      : "Zahlung bestätigt";
  const message =
    status === "invalid"
      ? "Der Link ist ungültig oder abgelaufen. Bitte kontaktieren Sie uns unter info@adlerundsohn.com."
      : status === "already"
      ? "Vielen Dank – Ihre Zahlungsbestätigung liegt uns bereits vor."
      : `Vielen Dank für Ihre Zahlung${rechnungNr ? ` zu Rechnung ${rechnungNr}` : ""}. Wir haben Ihre Bestätigung erhalten und prüfen den Zahlungseingang.`;

  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  body{margin:0;background:#efece4;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;}
  .wrap{max-width:560px;margin:0 auto;padding:48px 20px;}
  .card{background:#fff;border-top:4px solid #c9a55c;padding:40px;}
  .rule{height:2px;width:56px;background:#c9a55c;margin:14px 0 28px;}
  h1{font-family:Georgia,serif;color:#0f2740;font-size:26px;margin:0 0 16px;}
  p{font-size:15px;line-height:1.7;color:#3a352b;}
  a.btn{display:inline-block;margin-top:24px;padding:14px 28px;background:#0f2740;color:#f5f3ee;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:Georgia,serif;}
  .foot{margin-top:24px;font-size:11px;color:#8a8578;}
</style></head><body><div class="wrap"><div class="card">
  <img src="${logoAsset.url}" alt="Kanzlei Adler und Sohn" style="height:72px;width:auto;display:block;margin-bottom:16px;" />
  <div class="rule"></div>
  <h1>${title}</h1>
  <p>${message}</p>
  <a class="btn" href="https://adlerundsohn.de">Zur Kanzlei</a>
  <div class="foot">Kanzlei Adler und Sohn · Strandstraße 14 · 25980 Westerland/Sylt · info@adlerundsohn.com</div>
</div></div></body></html>`;

  return new Response(html, {
    status: status === "invalid" ? 404 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return page("invalid");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;

  const { data: offer, error } = await admin
    .from("offer_requests")
    .select("id, rechnung_nr, paid_at, rechnung_status")
    .eq("pay_token", token)
    .maybeSingle();

  if (error || !offer) return page("invalid");
  if (offer.paid_at) return page("already", offer.rechnung_nr as string);

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;

  await admin
    .from("offer_requests")
    .update({
      paid_at: new Date().toISOString(),
      paid_ip: ip,
      rechnung_status: "paid",
    })
    .eq("id", offer.id);

  return page("ok", offer.rechnung_nr as string);
}

export const Route = createFileRoute("/api/public/hooks/mark-paid")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
