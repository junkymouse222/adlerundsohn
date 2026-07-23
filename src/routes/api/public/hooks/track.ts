import { createFileRoute } from "@tanstack/react-router";

// Öffentlicher Endpunkt für den Traffic-Counter. Wird vom Client bei jedem
// Seitenaufruf per fetch() aufgerufen. Speichert IP, Land, Referrer, Pfad.

async function lookupCountry(ip: string | null): Promise<{ country: string | null; code: string | null }> {
  if (!ip) return { country: null, code: null };
  // Private/lokale IPs → keine Abfrage
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) {
    return { country: "Lokal", code: "LO" };
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=country,countryCode,status`, {
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return { country: null, code: null };
    const j = (await res.json()) as { status?: string; country?: string; countryCode?: string };
    if (j.status !== "success") return { country: null, code: null };
    return { country: j.country ?? null, code: j.countryCode ?? null };
  } catch {
    return { country: null, code: null };
  }
}

async function handle(request: Request): Promise<Response> {
  let path = "";
  let referrer: string | null = null;
  try {
    if (request.method === "POST") {
      const j = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (j) {
        path = typeof j.path === "string" ? j.path : "";
        referrer = typeof j.referrer === "string" && j.referrer ? j.referrer : null;
      }
    }
    if (!path) {
      const url = new URL(request.url);
      path = url.searchParams.get("path") || "/";
    }
  } catch {
    path = "/";
  }

  // Interne / uninteressante Pfade nicht erfassen
  if (
    path.startsWith("/admin") ||
    path.startsWith("/auth") ||
    path.startsWith("/api/") ||
    path.startsWith("/beleg-print") ||
    path.startsWith("/_")
  ) {
    return new Response(null, { status: 204 });
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  const ua = request.headers.get("user-agent") || null;

  // Bots grob rausfiltern
  if (ua && /bot|crawler|spider|preview|slurp|facebookexternalhit|whatsapp/i.test(ua)) {
    return new Response(null, { status: 204 });
  }

  const { country, code } = await lookupCountry(ip);

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    await admin.from("page_views").insert({
      path: path.slice(0, 500),
      ip,
      country,
      country_code: code,
      referrer: referrer ? referrer.slice(0, 1000) : null,
      user_agent: ua ? ua.slice(0, 500) : null,
    });
  } catch (err) {
    console.error("[track] insert failed", err);
  }

  return new Response(null, { status: 204 });
}

export const Route = createFileRoute("/api/public/hooks/track")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
