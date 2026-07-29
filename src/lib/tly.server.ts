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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type ShortenAttempt = { shortUrl: string | null; retryable: boolean };

async function shortenOnce(longUrl: string, description: string | undefined, token: string): Promise<ShortenAttempt> {
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
      // 429 (Rate-Limit) und 5xx sind transient -> erneut versuchen.
      const retryable = res.status === 429 || res.status >= 500;
      console.error(`[t.ly] shorten failed [${res.status}]${retryable ? " (retry)" : ""}: ${text.slice(0, 300)}`);
      return { shortUrl: null, retryable };
    }
    const data = JSON.parse(text) as { short_url?: string };
    if (!data.short_url) {
      console.error(`[t.ly] response ohne short_url: ${text.slice(0, 200)}`);
      return { shortUrl: null, retryable: false };
    }
    return { shortUrl: data.short_url };
  } catch (error) {
    // Netzwerkfehler/Timeout -> transient.
    console.error(`[t.ly] shorten error (retry): ${error instanceof Error ? error.message : String(error)}`);
    return { shortUrl: null, retryable: true };
  } finally {
    clearTimeout(timer);
  }
}

// Erzeugt einen t.ly-Kurzlink für die übergebene URL. Wiederholt bei transienten
// Fehlern (Rate-Limit/Netzwerk) mit Backoff. Gibt null zurück, wenn kein Token
// gesetzt ist oder es endgültig fehlschlägt (Aufrufer nutzt dann Fallback).
export async function shortenUrl(longUrl: string, description?: string): Promise<string | null> {
  const token = process.env.TLY_API_TOKEN?.trim();
  if (!token) return null;

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await shortenOnce(longUrl, description, token);
    if (result.shortUrl) return result.shortUrl;
    if (!result.retryable || attempt === maxAttempts) return null;
    await sleep(500 * attempt);
  }
  return null;
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
  opts: { accept?: boolean; pay?: boolean } = { accept: true, pay: true },
): Promise<{ acceptUrl: string | null; payUrl: string | null }> {
  const wantAccept = opts.accept ?? false;
  const wantPay = opts.pay ?? false;
  const patch: Record<string, string> = {};

  let acceptUrl: string | null = offer.accept_short_url ?? null;
  if (wantAccept && !acceptUrl && offer.accept_token) {
    const long = offerAcceptUrl(offer.accept_token);
    const short = long ? await shortenUrl(long, offer.angebot_nr ? `Angebot ${offer.angebot_nr}` : undefined) : null;
    if (short) {
      patch.accept_short_url = short;
      offer.accept_short_url = short;
    }
    acceptUrl = short ?? long;
  }

  let payUrl: string | null = offer.pay_short_url ?? null;
  if (wantPay && !payUrl && offer.pay_token) {
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
