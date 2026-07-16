// Server-only: rendert Angebot als HTML und sendet via Resend Connector Gateway.

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

export function renderOfferHtml(offer: OfferRow, items: ItemRow[]): string {
  const gueltigBis = new Date(new Date(offer.created_at).getTime() + 21 * 24 * 3600 * 1000)
    .toLocaleDateString("de-DE");
  const datum = new Date(offer.created_at).toLocaleDateString("de-DE");

  const rows = items
    .sort((a, b) => a.pos - b.pos)
    .map(
      (it, idx) => `
        <tr>
          <td style="padding:8px 6px;border-bottom:1px solid #eee;color:#666;">${idx + 1}</td>
          <td style="padding:8px 6px;border-bottom:1px solid #eee;color:#666;">${it.artikel}</td>
          <td style="padding:8px 6px;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#111;">${escapeHtml(it.name)}</div>
            ${it.beschreibung ? `<div style="color:#666;font-size:12px;">${escapeHtml(it.beschreibung)}</div>` : ""}
          </td>
          <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;">${it.menge} ${escapeHtml(it.einheit)}</td>
          <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;">${fmtEUR(Number(it.einzelpreis))}</td>
          <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${fmtEUR(Number(it.position_total))}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>Angebot ${offer.angebot_nr}</title></head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:'Helvetica Neue',Arial,sans-serif;color:#111;">
  <div style="max-width:720px;margin:0 auto;padding:24px;background:#fff;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td>
          <div style="font-family:Georgia,serif;font-size:28px;color:#0f2740;">Rechtsanwaltskanzlei Goldmann</div>
          <div style="height:2px;width:60px;background:#c9a55c;margin-top:8px;"></div>
          <div style="font-size:12px;color:#666;margin-top:8px;">Friedrichstraße 112 · 10117 Berlin</div>
          <div style="font-size:12px;color:#666;">info@goldmann-ra.de</div>
        </td>
        <td style="text-align:right;vertical-align:top;font-family:'Courier New',monospace;">
          <div style="font-size:12px;color:#666;letter-spacing:1px;">ANGEBOT</div>
          <div style="font-size:20px;font-weight:600;">${offer.angebot_nr}</div>
          <div style="font-size:12px;color:#666;margin-top:8px;">Datum: ${datum}</div>
          <div style="font-size:12px;color:#666;">Gültig bis: ${gueltigBis}</div>
        </td>
      </tr>
    </table>

    <div style="margin-bottom:16px;">
      <div style="font-size:11px;letter-spacing:2px;color:#666;text-transform:uppercase;">Kunde</div>
      <div style="font-weight:600;margin-top:4px;">${escapeHtml(offer.customer_company || offer.customer_name)}</div>
      ${offer.customer_company ? `<div>${escapeHtml(offer.customer_name)}</div>` : ""}
      <div style="white-space:pre-line;color:#333;">${escapeHtml(offer.customer_address)}</div>
      ${offer.customer_ust_id ? `<div style="color:#666;font-size:12px;">USt-IdNr.: ${escapeHtml(offer.customer_ust_id)}</div>` : ""}
    </div>

    <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;">
      <thead>
        <tr style="background:#0f2740;color:#fff;">
          <th style="padding:10px 6px;text-align:left;">Pos.</th>
          <th style="padding:10px 6px;text-align:left;">Artikel</th>
          <th style="padding:10px 6px;text-align:left;">Bezeichnung</th>
          <th style="padding:10px 6px;text-align:right;">Menge</th>
          <th style="padding:10px 6px;text-align:right;">Einzelpreis</th>
          <th style="padding:10px 6px;text-align:right;">Gesamt</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table style="width:100%;margin-top:24px;font-size:13px;">
      <tr><td style="text-align:right;color:#666;padding:4px 6px;">Zwischensumme</td><td style="text-align:right;padding:4px 6px;width:140px;">${fmtEUR(Number(offer.subtotal))}</td></tr>
      ${Number(offer.lieferkosten) > 0 ? `<tr><td style="text-align:right;color:#666;padding:4px 6px;">Lieferkosten</td><td style="text-align:right;padding:4px 6px;">${fmtEUR(Number(offer.lieferkosten))}</td></tr>` : ""}
      <tr><td style="text-align:right;color:#666;padding:4px 6px;">zzgl. ${Number(offer.mwst_rate)}% MwSt.</td><td style="text-align:right;padding:4px 6px;">${fmtEUR(Number(offer.mwst))}</td></tr>
      <tr style="border-top:2px solid #0f2740;"><td style="text-align:right;font-weight:600;padding:8px 6px;">Gesamtbetrag</td><td style="text-align:right;font-weight:600;padding:8px 6px;font-size:16px;">${fmtEUR(Number(offer.total))}</td></tr>
    </table>

    ${offer.message ? `<div style="margin-top:24px;padding:12px;background:#f5f3ee;border-left:3px solid #c9a55c;font-size:13px;"><strong>Ihre Nachricht:</strong><br>${escapeHtml(offer.message)}</div>` : ""}

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#666;line-height:1.6;">
      <p>Vielen Dank für Ihre Anfrage. Dieses Angebot ist 21 Tage gültig. Alle Positionen aus laufender Verwertung. Lieferung ab Bestellwert 3.000 € netto kostenfrei innerhalb des Liefergebiets. Zwischenverkauf vorbehalten.</p>
      <p>Bei Fragen erreichen Sie uns unter <a href="mailto:info@goldmann-ra.de" style="color:#0f2740;">info@goldmann-ra.de</a>.</p>
    </div>
  </div>
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

export async function sendOfferEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.OFFER_FROM_EMAIL || "Kanzlei Goldmann <angebote@goldmann-ra.de>";

  if (!LOVABLE_API_KEY) return { ok: false, error: "LOVABLE_API_KEY missing" };
  if (!RESEND_API_KEY) {
    return { ok: false, error: "Resend-Connector nicht verbunden (RESEND_API_KEY fehlt)" };
  }

  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[resend] send failed [${res.status}]: ${body}`);
    return { ok: false, error: `Resend ${res.status}: ${body}` };
  }
  const data = (await res.json()) as { id?: string };
  return { ok: true, messageId: data.id ?? "" };
}
