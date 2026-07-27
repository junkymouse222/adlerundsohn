// Server-only: t.ly URL-Shortener-Integration.
//
// Zweck: In Angebots-/Rechnungs-E-Mails und -PDFs sollen die Aktions-Links
// (Angebot annehmen / Zahlung bestätigen) NICHT die eigene Kanzlei-Domain
// zeigen, sondern t.ly-Kurzlinks. Das schützt die Domain-Reputation und
// verringert das Risiko, dass die Mails in den Spam wandern.
//
// Robustheit: Fehlt der Token oder antwortet t.ly nicht/fehlerhaft, wird auf
// die Original-URL zurückgefallen. Der Versand darf dadurch NIE abbrechen.

import { offerAcceptUrl, invoicePayUrl } from "@/lib/offer-email.server";

const TLY_SHORTEN_ENDPOINT = "https://api.t.ly/api/v1/link/shorten";

// Erzeugt einen t.ly-Kurzlink für die übergebene URL. Gibt null zurück, wenn
// kein Token gesetzt ist oder die API fehlschlägt (Aufrufer nutzt dann Fallback).
export async function shortenUrl(longUrl: string, description?: string): Promise<string | null> {
  const token = process.env.TLY_API_TOKEN?.trim();
  if (!token) return null;

  const timeoutMs = Number(process.env.TLY_TIMEOUT_MS || 15000);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const body: Record<string, unknown> = { long_url: longUrl };
    const domain = process.env.TLY_DOMAIN?.trim();
    if (domain) body.domain = domain;
    if (description) body.description = description;

    const res = await fetch(TLY_SHORTEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`[t.ly] shorten failed [${res.status}]: ${text.slice(0, 300)}`);
      return null;
    }
    const data = JSON.parse(text) as { short_url?: string };
    if (!data.short_url) {
      console.error(`[t.ly] response ohne short_url: ${text.slice(0, 200)}`);
      return null;
    }
    return data.short_url;
  } catch (error) {
    console.error(`[t.ly] shorten error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type OfferLinkRow = {
  id?: string | null;
  angebot_nr?: string | null;
  rechnung_nr?: string | null;
  accept_token?: string | null;
  pay_token?: string | null;
  accept_short_url?: string | null;
  pay_short_url?: string | null;
};

// Stellt sicher, dass für den Accept-Link (Angebot) und/oder Pay-Link (Rechnung)
// t.ly-Kurzlinks existieren. Fehlende Kurzlinks werden erzeugt, am Datensatz in
// offer_requests persistiert und zusätzlich in das übergebene offer-Objekt
// geschrieben (Mutation), damit die anschließenden Render-Funktionen sie sofort
// verwenden. Bereits vorhandene Kurzlinks werden wiederverwendet (idempotent),
// sodass Resends/Vorschauen keine Duplikate bei t.ly erzeugen.
export async function ensureOfferShortLinks(
  offer: OfferLinkRow,
): Promise<{ acceptUrl: string | null; payUrl: string | null }> {
  const patch: Record<string, string> = {};

  let acceptUrl: string | null = offer.accept_short_url ?? null;
  if (!acceptUrl && offer.accept_token) {
    const long = offerAcceptUrl(offer.accept_token);
    const short = long ? await shortenUrl(long, offer.angebot_nr ? `Angebot ${offer.angebot_nr}` : undefined) : null;
    if (short) {
      patch.accept_short_url = short;
      offer.accept_short_url = short;
    }
    acceptUrl = short ?? long;
  }

  let payUrl: string | null = offer.pay_short_url ?? null;
  if (!payUrl && offer.pay_token) {
    const long = invoicePayUrl(offer.pay_token);
    const label = offer.rechnung_nr
      ? `Rechnung ${offer.rechnung_nr}`
      : offer.angebot_nr
        ? `Rechnung ${offer.angebot_nr}`
        : undefined;
    const short = long ? await shortenUrl(long, label) : null;
    if (short) {
      patch.pay_short_url = short;
      offer.pay_short_url = short;
    }
    payUrl = short ?? long;
  }

  if (Object.keys(patch).length > 0 && offer.id) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await (supabaseAdmin as unknown as {
        from: (t: string) => {
          update: (v: Record<string, string>) => { eq: (c: string, v: string) => Promise<unknown> };
        };
      })
        .from("offer_requests")
        .update(patch)
        .eq("id", offer.id);
    } catch (error) {
      // Persistieren fehlgeschlagen ist unkritisch: die Kurzlinks sind bereits
      // im offer-Objekt gesetzt und werden für diesen Versand verwendet.
      console.error(`[t.ly] konnte Kurzlinks nicht speichern: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { acceptUrl, payUrl };
}
