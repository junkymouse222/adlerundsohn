// Server-only: rendert Angebot als HTML (mit Annahme-Button) und sendet via Resend Connector Gateway.
import logoAsset from "@/assets/kanzlei-logo.png.asset.json";

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(n));

type OfferRow = {
  id: string;
  angebot_nr: string;
  created_at: string;
  customer_company: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string;
  customer_ust_id: string | null;
  message: string | null;
  subtotal: number | string;
  mwst_rate: number | string;
  mwst: number | string;
  total: number | string;
  lieferkosten: number | string;
  accept_token?: string | null;
  accepted_at?: string | null;
};

type ItemRow = {
  pos: number;
  artikel: string;
  name: string;
  beschreibung: string | null;
  einheit: string;
  einzelpreis: number | string;
  menge: number;
  position_total: number | string;
};

export function siteBaseUrl(): string {
  return (
    process.env.PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://adlerundsohn.lovable.app"
  ).replace(/\/$/, "");
}

export function offerAcceptUrl(token: string | null | undefined): string | null {
  if (!token) return null;
  return `${siteBaseUrl()}/api/public/hooks/accept-offer?token=${encodeURIComponent(token)}`;
}

export function invoicePayUrl(token: string | null | undefined): string | null {
  if (!token) return null;
  return `${siteBaseUrl()}/api/public/hooks/mark-paid?token=${encodeURIComponent(token)}`;
}

export function logoUrl(): string {
  return `${siteBaseUrl()}${logoAsset.url}`;
}

export function renderInvoiceHtml(
  offer: OfferRow & {
    rechnung_nr: string;
    rechnung_faellig_am?: string | null;
    pay_token?: string | null;
    paid_at?: string | null;
    bank_inhaber: string;
    bank_name: string;
    bank_iban: string;
    bank_bic: string;
  },
): string {
  const faellig = offer.rechnung_faellig_am
    ? new Date(offer.rechnung_faellig_am).toLocaleDateString("de-DE")
    : "";
  const payUrl = invoicePayUrl(offer.pay_token);
  const paid = !!offer.paid_at;
  const payBlock = payUrl
    ? paid
      ? `<div style="background:#f5f3ee;border:1px solid #c9a55c;padding:20px;text-align:center;margin:28px 0;">
           <div style="font-family:Georgia,serif;font-size:16px;color:#0f2740;">Zahlung bereits bestätigt</div>
           <div style="font-size:12px;color:#6b6656;margin-top:6px;">Vielen Dank für Ihre Zahlung.</div>
         </div>`
      : `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
           <tr><td style="background:#0f2740;padding:0;">
             <a href="${payUrl}" style="display:inline-block;padding:16px 42px;font-family:Georgia,serif;font-size:15px;letter-spacing:2px;text-transform:uppercase;color:#f5f3ee;text-decoration:none;border:1px solid #0f2740;">
               Zahlung bestätigen
             </a>
           </td></tr>
           <tr><td style="text-align:center;padding-top:10px;font-size:11px;color:#8a8578;letter-spacing:1px;text-transform:uppercase;">
             Klicken sobald überwiesen
           </td></tr>
         </table>`
    : "";

  return `<!doctype html><html lang="de"><body style="margin:0;padding:0;background:#efece4;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;"><tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border-top:4px solid #c9a55c;">
        <tr><td style="padding:36px 40px 8px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:18px;"><img src="${logoUrl()}" alt="Kanzlei Adler und Sohn" width="96" height="96" style="display:block;height:96px;width:auto;" /></td>
            <td style="vertical-align:middle;">
              <div style="height:2px;width:48px;background:#c9a55c;margin:0 0 8px 0;"></div>
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6455;line-height:1.5;">Strandstraße 14 · 25980 Westerland/Sylt<br/>Tel. +49 6591 6659636 · info@adlerundsohn.com</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:24px 40px;">
          <p style="font-family:Georgia,serif;font-size:16px;color:#0f2740;margin:0 0 12px 0;">Sehr geehrte Damen und Herren,</p>
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.7;">anbei erhalten Sie unsere Rechnung <strong>${escapeHtml(offer.rechnung_nr)}</strong> zu Ihrem Angebot ${escapeHtml(offer.angebot_nr)}.</p>
          <p style="margin:0 0 8px 0;font-size:14px;line-height:1.7;">Bitte überweisen Sie den Rechnungsbetrag von <strong style="color:#0f2740;">${fmtEUR(Number(offer.total))}</strong> unter Angabe der Rechnungsnummer${faellig ? ` bis zum <strong>${faellig}</strong>` : ""}.</p>
          ${payBlock}
          <div style="background:#f5f3ee;border-left:3px solid #c9a55c;padding:14px 18px;font-size:13px;">
            <div style="font-family:Georgia,serif;color:#0f2740;margin-bottom:6px;">Bankverbindung</div>
            <div>${escapeHtml(offer.bank_inhaber)}</div>
            <div>${escapeHtml(offer.bank_name)}</div>
            <div>IBAN: ${escapeHtml(offer.bank_iban)}</div>
            <div>BIC: ${escapeHtml(offer.bank_bic)}</div>
          </div>
          <p style="margin-top:24px;font-family:Georgia,serif;color:#0f2740;">Mit besten Grüßen<br/>Kanzlei Adler und Sohn</p>
          <div style="height:1px;background:#ece8de;margin:20px 0;"></div>
          <p style="margin:0;font-size:11px;color:#8a8578;">Rechtsanwaltskanzlei Adler und Sohn · Strandstraße 14 · 25980 Westerland/Sylt · <a href="mailto:info@adlerundsohn.com" style="color:#0f2740;text-decoration:none;">info@adlerundsohn.com</a></p>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

export function renderOfferHtml(offer: OfferRow, items: ItemRow[]): string {
  const gueltigBis = new Date(new Date(offer.created_at).getTime() + 21 * 24 * 3600 * 1000)
    .toLocaleDateString("de-DE");
  const datum = new Date(offer.created_at).toLocaleDateString("de-DE");
  const acceptUrl = offerAcceptUrl(offer.accept_token);
  const alreadyAccepted = !!offer.accepted_at;

  const rows = items
    .sort((a, b) => a.pos - b.pos)
    .map(
      (it, idx) => `
        <tr>
          <td style="padding:10px 6px;border-bottom:1px solid #ece8de;color:#8a8578;font-size:12px;">${idx + 1}</td>
          <td style="padding:10px 6px;border-bottom:1px solid #ece8de;">
            <div style="font-weight:600;color:#0f2740;font-family:Georgia,serif;">${escapeHtml(it.name)}</div>
            ${it.beschreibung ? `<div style="color:#6b6656;font-size:12px;margin-top:2px;">${escapeHtml(it.beschreibung)}</div>` : ""}
          </td>
          <td style="padding:10px 6px;border-bottom:1px solid #ece8de;text-align:right;color:#4a4638;">${it.menge} ${escapeHtml(it.einheit)}</td>
          <td style="padding:10px 6px;border-bottom:1px solid #ece8de;text-align:right;color:#4a4638;">${fmtEUR(Number(it.einzelpreis))}</td>
          <td style="padding:10px 6px;border-bottom:1px solid #ece8de;text-align:right;font-weight:600;color:#0f2740;">${fmtEUR(Number(it.position_total))}</td>
        </tr>`,
    )
    .join("");

  const acceptBlock = acceptUrl
    ? alreadyAccepted
      ? `<div style="background:#f5f3ee;border:1px solid #c9a55c;padding:20px;text-align:center;margin:32px 0;">
           <div style="font-family:Georgia,serif;font-size:16px;color:#0f2740;">Angebot bereits angenommen</div>
           <div style="font-size:12px;color:#6b6656;margin-top:6px;">Vielen Dank. Wir kümmern uns um die Abwicklung.</div>
         </div>`
      : `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto;">
           <tr>
             <td style="background:#0f2740;padding:0;">
               <a href="${acceptUrl}"
                  style="display:inline-block;padding:16px 42px;font-family:Georgia,serif;font-size:15px;letter-spacing:2px;text-transform:uppercase;color:#f5f3ee;text-decoration:none;border:1px solid #0f2740;">
                 Angebot annehmen
               </a>
             </td>
           </tr>
           <tr>
             <td style="text-align:center;padding-top:10px;font-size:11px;color:#8a8578;letter-spacing:1px;text-transform:uppercase;">
               Ein Klick genügt · rechtsverbindlich
             </td>
           </tr>
         </table>`
    : "";

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>Angebot ${offer.angebot_nr}</title></head>
<body style="margin:0;padding:0;background:#efece4;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efece4;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-top:4px solid #c9a55c;">

        <tr><td style="padding:36px 40px 8px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:18px;"><img src="${logoUrl()}" alt="Kanzlei Adler und Sohn" width="96" height="96" style="display:block;height:96px;width:auto;" /></td>
            <td style="vertical-align:middle;">
              <div style="height:2px;width:48px;background:#c9a55c;margin:0 0 8px 0;"></div>
              <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6b6455;line-height:1.5;">Strandstraße 14 · 25980 Westerland/Sylt<br/>Tel. +49 6591 6659636 · info@adlerundsohn.com</div>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:24px 40px 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;">
                <div style="font-size:11px;letter-spacing:2px;color:#8a8578;text-transform:uppercase;">Für</div>
                <div style="font-family:Georgia,serif;font-size:15px;color:#0f2740;margin-top:6px;">${escapeHtml(offer.customer_company || offer.customer_name)}</div>
                ${offer.customer_company ? `<div style="font-size:13px;color:#4a4638;">${escapeHtml(offer.customer_name)}</div>` : ""}
              </td>
              <td style="vertical-align:top;text-align:right;">
                <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;color:#8a8578;text-transform:uppercase;">Angebot</div>
                <div style="font-family:'Courier New',monospace;font-size:20px;color:#0f2740;margin-top:2px;">${offer.angebot_nr}</div>
                <div style="font-size:11px;color:#8a8578;margin-top:6px;">Datum: ${datum}</div>
                <div style="font-size:11px;color:#8a8578;">Gültig bis: ${gueltigBis}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:28px 40px 8px 40px;">
          <p style="margin:0 0 12px 0;font-family:Georgia,serif;font-size:16px;color:#0f2740;">Sehr geehrte Damen und Herren,</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#3a352b;">
            vielen Dank für Ihre Anfrage. Anbei finden Sie unser unverbindliches Angebot ${offer.angebot_nr}
            zusammen mit dem PDF-Dokument im Anhang. Sie können das Angebot mit einem Klick direkt annehmen.
          </p>
        </td></tr>

        <tr><td style="padding:0 40px;">${acceptBlock}</td></tr>

        <tr><td style="padding:8px 40px 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
            <thead>
              <tr>
                <th style="padding:10px 6px;text-align:left;font-family:Georgia,serif;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8578;border-bottom:2px solid #0f2740;">Pos.</th>
                <th style="padding:10px 6px;text-align:left;font-family:Georgia,serif;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8578;border-bottom:2px solid #0f2740;">Bezeichnung</th>
                <th style="padding:10px 6px;text-align:right;font-family:Georgia,serif;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8578;border-bottom:2px solid #0f2740;">Menge</th>
                <th style="padding:10px 6px;text-align:right;font-family:Georgia,serif;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8578;border-bottom:2px solid #0f2740;">Preis</th>
                <th style="padding:10px 6px;text-align:right;font-family:Georgia,serif;font-weight:normal;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8578;border-bottom:2px solid #0f2740;">Summe</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </td></tr>

        <tr><td style="padding:16px 40px 0 40px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
            <tr><td style="text-align:right;color:#6b6656;padding:4px 6px;">Zwischensumme</td><td style="text-align:right;padding:4px 6px;width:140px;color:#3a352b;">${fmtEUR(Number(offer.subtotal))}</td></tr>
            ${Number(offer.lieferkosten) > 0 ? `<tr><td style="text-align:right;color:#6b6656;padding:4px 6px;">Lieferkosten</td><td style="text-align:right;padding:4px 6px;color:#3a352b;">${fmtEUR(Number(offer.lieferkosten))}</td></tr>` : ""}
            <tr><td style="text-align:right;color:#6b6656;padding:4px 6px;">zzgl. ${Number(offer.mwst_rate)}% MwSt.</td><td style="text-align:right;padding:4px 6px;color:#3a352b;">${fmtEUR(Number(offer.mwst))}</td></tr>
            <tr><td colspan="2" style="padding:0;"><div style="height:2px;background:#0f2740;margin:6px 0;"></div></td></tr>
            <tr><td style="text-align:right;font-family:Georgia,serif;font-weight:600;padding:6px;color:#0f2740;font-size:15px;">Gesamtbetrag</td><td style="text-align:right;font-weight:600;padding:6px;font-size:17px;color:#0f2740;font-family:Georgia,serif;">${fmtEUR(Number(offer.total))}</td></tr>
          </table>
        </td></tr>

        

        <tr><td style="padding:32px 40px 40px 40px;border-top:1px solid #ece8de;margin-top:24px;">
          <p style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:14px;color:#0f2740;">Mit besten Grüßen</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#0f2740;">Kanzlei Adler und Sohn</p>
          <div style="height:1px;background:#ece8de;margin:20px 0;"></div>
          <p style="margin:0;font-size:11px;color:#8a8578;line-height:1.6;">
            Dieses Angebot ist 21 Tage gültig. Alle Positionen aus laufender Verwertung.
            Lieferung ab Bestellwert 3.000 € netto kostenfrei innerhalb des Liefergebiets. Zwischenverkauf vorbehalten.
          </p>
          <p style="margin:12px 0 0 0;font-size:11px;color:#8a8578;">
            Rechtsanwaltskanzlei Adler und Sohn · Strandstraße 14 · 25980 Westerland/Sylt · <a href="mailto:info@adlerundsohn.com" style="color:#0f2740;text-decoration:none;">info@adlerundsohn.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type EmailAttachment = { filename: string; content: string /* base64 */ };

type ResendPostResult = { status: number; body: string };

async function postResendWithHttps(payload: string, apiKey: string, timeoutMs: number): Promise<ResendPostResult> {
  const https = await import("node:https");
  const payloadBytes = Buffer.byteLength(payload);

  return await new Promise<ResendPostResult>((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.resend.com",
        path: "/emails",
        method: "POST",
        family: Number(process.env.RESEND_IP_FAMILY || 4),
        timeout: timeoutMs,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(payloadBytes),
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on("end", () => {
          resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") });
        });
      },
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timeout nach ${Math.round(timeoutMs / 1000)} Sekunden beim Resend-Upload`));
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function postResendWithFetch(payload: string, apiKey: string, timeoutMs: number): Promise<ResendPostResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: payload,
      signal: ctrl.signal,
    });
    return { status: res.status, body: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendOfferEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.OFFER_FROM_EMAIL || "Kanzlei Adler und Sohn <info@adlerundsohn-mail.de>";
  const configuredTimeoutMs = Number(process.env.RESEND_TIMEOUT_MS || 0);
  const timeoutMs = Math.max(Number.isFinite(configuredTimeoutMs) ? configuredTimeoutMs : 0, 120000);

  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY fehlt" };
  }

  const body: Record<string, unknown> = {
    from: FROM,
    to: [params.to],
    subject: params.subject,
    html: params.html,
  };
  if (params.attachments?.length) {
    body.attachments = params.attachments.map((a) => ({ filename: a.filename, content: a.content }));
  }

  const attachmentBytes = params.attachments?.reduce((sum, attachment) => {
    const padding = attachment.content.endsWith("==") ? 2 : attachment.content.endsWith("=") ? 1 : 0;
    return sum + Math.max(0, Math.floor((attachment.content.length * 3) / 4) - padding);
  }, 0) ?? 0;
  const payload = JSON.stringify(body);
  const payloadBytes = typeof Buffer !== "undefined" ? Buffer.byteLength(payload) : new TextEncoder().encode(payload).byteLength;

  if (payloadBytes > 38 * 1024 * 1024) {
    const sizeMb = (payloadBytes / 1024 / 1024).toFixed(1);
    return {
      ok: false,
      error: `E-Mail ist mit ${sizeMb} MB zu groß für Resend. Bitte weniger Positionen auswählen oder PDF verkleinern.`,
    };
  }

  let res: ResendPostResult;
  const startedAt = Date.now();
  try {
    console.info(
      `[resend] sending email to ${params.to} with ${params.attachments?.length ?? 0} attachment(s), attachment=${(attachmentBytes / 1024 / 1024).toFixed(2)}MB, payload=${(payloadBytes / 1024 / 1024).toFixed(2)}MB, timeout=${Math.round(timeoutMs / 1000)}s`,
    );
    try {
      res = await postResendWithHttps(payload, RESEND_API_KEY, timeoutMs);
    } catch (httpsError) {
      if (process.env.RESEND_HTTP_CLIENT === "https") throw httpsError;
      console.warn(
        `[resend] node:https failed, falling back to fetch: ${httpsError instanceof Error ? httpsError.message : String(httpsError)}`,
      );
      res = await postResendWithFetch(payload, RESEND_API_KEY, timeoutMs);
    }
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    const msg = isTimeout
      ? `Resend hat den Upload nicht innerhalb von ${Math.round(timeoutMs / 1000)} Sekunden abgeschlossen. PDF/Anhang ist vermutlich zu groß oder die Verbindung zum Resend-Upload ist zu langsam.`
      : `Resend-Verbindung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[resend] send request failed: ${msg}`);
    return { ok: false, error: msg };
  }

  console.info(`[resend] response ${res.status} after ${Date.now() - startedAt}ms`);

  if (res.status < 200 || res.status >= 300) {
    console.error(`[resend] send failed [${res.status}]: ${res.body}`);
    return { ok: false, error: `Resend ${res.status}: ${res.body}` };
  }
  const data = JSON.parse(res.body) as { id?: string };
  return { ok: true, messageId: data.id ?? "" };
}
