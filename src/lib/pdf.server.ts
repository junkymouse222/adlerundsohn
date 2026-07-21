// Server-only: rendert Angebot/Rechnung als PDF im Stil des internen Beleg-Generators.
// Wichtig: die gebündelte ESM-Datei von pdf-lib enthält die TS-Helper inline.
// Der normale Package-Entry importiert `tslib` und kann im Worker beim PDF-Rendern
// mit `__extends`/CJS-Interop brechen.
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFName, PDFString, PDFArray } from "pdf-lib/dist/pdf-lib.esm.js";
import logoAsset from "@/assets/kanzlei-logo.png.asset.json";

let cachedLogo: Uint8Array | null = null;
async function loadLogo(): Promise<Uint8Array | null> {
  if (cachedLogo) return cachedLogo;
  // 1) Try local filesystem first (self-hosted / production build with public/ assets)
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const relPath = logoAsset.url.replace(/^\//, "");
    const candidates = [
      join(process.cwd(), "public", relPath),
      join(process.cwd(), ".output", "public", relPath),
      join(process.cwd(), "dist", relPath),
    ];
    for (const p of candidates) {
      try {
        const buf = await readFile(p);
        cachedLogo = new Uint8Array(buf);
        return cachedLogo;
      } catch {
        // try next candidate
      }
    }
  } catch {
    // fs unavailable — fall through to network
  }
  // 2) Fallback: HTTP fetch with short timeout so the send-flow never hangs
  try {
    const base = (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || "https://adlerundsohn.lovable.app").replace(/\/$/, "");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${base}${logoAsset.url}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    cachedLogo = new Uint8Array(await res.arrayBuffer());
    return cachedLogo;
  } catch {
    return null;
  }
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(n));

// Die pdf-lib-Standardfonts (Helvetica/Times) können nur WinAnsi (CP1252) kodieren.
// Kundeneingaben (Name, Firma, Adresse) enthalten aber häufig Zeichen außerhalb dieses
// Bereichs (Emojis, osteuropäische/kyrillische Buchstaben, Sonderzeichen). Ohne
// Bereinigung wirft pdf-lib `WinAnsi cannot encode "…"` und der komplette Versand
// ("Angebot senden"/"Rechnung senden") schlägt fehl. Deshalb wandeln wir jeden Text
// vor dem Zeichnen/Messen in WinAnsi-sichere Zeichen um.
const WINANSI_EXTRA = new Set<number>([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]);

const TRANSLIT: Record<string, string> = {
  Ł: "L",
  ł: "l",
  Đ: "D",
  đ: "d",
  Ħ: "H",
  ħ: "h",
  Ŀ: "L",
  ŀ: "l",
  Ŋ: "N",
  ŋ: "n",
  Ŧ: "T",
  ŧ: "t",
  ı: "i",
  ﬀ: "ff",
  ﬁ: "fi",
  ﬂ: "fl",
  ﬃ: "ffi",
  ﬄ: "ffl",
  "‑": "-",
  "‒": "-",
  "―": "-",
  "−": "-",
  "‐": "-",
  "\u00a0": " ",
  "\u2009": " ",
  "\u202f": " ",
  "\u200b": "",
};

function canWinAnsi(codePoint: number): boolean {
  if (codePoint >= 0x20 && codePoint <= 0x7e) return true;
  if (codePoint >= 0xa0 && codePoint <= 0xff) return true;
  return WINANSI_EXTRA.has(codePoint);
}

function sanitizeWinAnsi(input: unknown): string {
  const text = String(input ?? "");
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (canWinAnsi(cp)) {
      out += ch;
      continue;
    }
    if (TRANSLIT[ch] !== undefined) {
      out += TRANSLIT[ch];
      continue;
    }
    // Diakritika entfernen (z. B. ā→a, ș→s, ő→o) und nur sichere Reste behalten.
    const decomposed = ch.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    let mapped = "";
    for (const dch of decomposed) {
      const dcp = dch.codePointAt(0) ?? 0;
      if (canWinAnsi(dcp)) mapped += dch;
      else if (TRANSLIT[dch] !== undefined) mapped += TRANSLIT[dch];
    }
    out += mapped; // nicht abbildbare Zeichen (Emoji, Kyrillisch …) werden verworfen
  }
  return out;
}

const NAVY = rgb(0.059, 0.153, 0.251); // #0f2740
const GOLD = rgb(0.788, 0.647, 0.361); // #c9a55c
const MUTED = rgb(0.4, 0.4, 0.4);
const TEXT = rgb(0.067, 0.067, 0.067);
const LINE = rgb(0.87, 0.87, 0.87);

export type OfferForPdf = {
  angebot_nr: string;
  created_at: string;
  customer_company: string | null;
  customer_name: string;
  customer_address: string;
  customer_ust_id: string | null;
  message: string | null;
  subtotal: number | string;
  rabatt_rate?: number | string | null;
  rabatt?: number | string | null;
  mwst_rate: number | string;
  mwst: number | string;
  total: number | string;
  lieferkosten: number | string;
  accept_token?: string | null;
  accepted_at?: string | null;
};

export type ItemForPdf = {
  pos: number;
  artikel: string;
  name: string;
  beschreibung: string | null;
  einheit: string;
  einzelpreis: number | string;
  menge: number;
  position_total: number | string;
};

export type InvoiceMeta = {
  rechnung_nr: string;
  datum: Date;
  faellig_am: Date;
  bank_inhaber: string;
  bank_name: string;
  bank_iban: string;
  bank_bic: string;
  pay_url?: string | null;
  paid?: boolean;
};

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = { l: 50, r: 50, t: 50, b: 60 };

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of sanitizeWinAnsi(text).split(/\r?\n/)) {
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

async function renderBeleg(
  belegArt: "Angebot" | "Rechnung",
  belegNr: string,
  datum: Date,
  faelligOderGueltig: Date,
  offer: OfferForPdf,
  items: ItemForPdf[],
  invoice?: InvoiceMeta,
  acceptUrl?: string | null,
  alreadyAccepted?: boolean,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);

  let page: PDFPage = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - MARGIN.t;

  const drawText = (
    text: string,
    x: number,
    yy: number,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {},
  ) =>
    page.drawText(sanitizeWinAnsi(text), {
      x,
      y: yy,
      size: opts.size ?? 10,
      font: opts.font ?? font,
      color: opts.color ?? TEXT,
    });

  // ============ HEADER ============
  const logoBytes = await loadLogo();
  let textX = MARGIN.l;
  if (logoBytes) {
    try {
      const img = await pdf.embedPng(logoBytes);
      const logoH = 64;
      const logoW = (img.width / img.height) * logoH;
      page.drawImage(img, { x: MARGIN.l, y: y - logoH, width: logoW, height: logoH });
      textX = MARGIN.l + logoW + 16;
    } catch {
      // Falls Embed scheitert, ohne Logo weiter
    }
  }
  drawText("Rechtsanwaltskanzlei Adler und Sohn", textX, y - 16, { font: serif, size: 18, color: NAVY });
  page.drawRectangle({ x: textX, y: y - 22, width: 48, height: 1.5, color: GOLD });
  drawText("Strandstraße 14 · 25980 Westerland/Sylt", textX, y - 36, { size: 9, color: MUTED });
  drawText("Tel. +49 6591 6659636 · info@adlerundsohn.com", textX, y - 48, { size: 9, color: MUTED });

  // Beleg-Info rechts
  const rightX = A4.w - MARGIN.r;
  const label = belegArt.toUpperCase();
  drawText(label, rightX - bold.widthOfTextAtSize(label, 9), y - 14, { font: bold, size: 9, color: MUTED });
  drawText(belegNr, rightX - bold.widthOfTextAtSize(belegNr, 16), y - 32, { font: bold, size: 16, color: TEXT });
  const datumStr = `Datum: ${datum.toLocaleDateString("de-DE")}`;
  drawText(datumStr, rightX - font.widthOfTextAtSize(datumStr, 9), y - 48, { size: 9, color: MUTED });
  const gueltigLabel = belegArt === "Angebot" ? "Gültig bis: " : "Fällig am: ";
  const gueltigStr = `${gueltigLabel}${faelligOderGueltig.toLocaleDateString("de-DE")}`;
  drawText(gueltigStr, rightX - font.widthOfTextAtSize(gueltigStr, 9), y - 60, { size: 9, color: MUTED });

  y -= 100;


  // ============ KUNDE ============
  drawText("KUNDE", MARGIN.l, y, { font: bold, size: 8, color: MUTED });
  y -= 14;
  const kundeLines: string[] = [];
  kundeLines.push(offer.customer_company || offer.customer_name);
  if (offer.customer_company) kundeLines.push(offer.customer_name);
  for (const l of String(offer.customer_address).split(/\r?\n/)) kundeLines.push(l);
  if (offer.customer_ust_id) kundeLines.push(`USt-IdNr.: ${offer.customer_ust_id}`);
  for (let i = 0; i < kundeLines.length; i++) {
    drawText(kundeLines[i], MARGIN.l, y, { font: i === 0 ? bold : font, size: 10 });
    y -= 13;
  }

  y -= 12;

  // ============ TABELLE ============
  const cols = {
    pos: MARGIN.l,
    artikel: MARGIN.l + 30,
    name: MARGIN.l + 110,
    menge: A4.w - MARGIN.r - 200,
    ep: A4.w - MARGIN.r - 130,
    ges: A4.w - MARGIN.r - 60,
    end: A4.w - MARGIN.r,
  };
  const nameWidth = cols.menge - cols.name - 6;

  // Kopfzeile — heller Stil wie in /rechnung: dünne Linien oben/unten, muted Uppercase-Labels
  const headTopY = y + 14;
  const headBotY = y - 6;
  page.drawLine({ start: { x: MARGIN.l, y: headTopY }, end: { x: A4.w - MARGIN.r, y: headTopY }, thickness: 0.75, color: LINE });
  page.drawLine({ start: { x: MARGIN.l, y: headBotY }, end: { x: A4.w - MARGIN.r, y: headBotY }, thickness: 0.75, color: LINE });
  const headY = y + 2;
  drawText("POS.", cols.pos, headY, { font: bold, size: 8, color: MUTED });
  drawText("ARTIKEL", cols.artikel, headY, { font: bold, size: 8, color: MUTED });
  drawText("BEZEICHNUNG", cols.name, headY, { font: bold, size: 8, color: MUTED });
  const mText = "MENGE";
  drawText(mText, cols.ep - font.widthOfTextAtSize(mText, 8) - 4, headY, { font: bold, size: 8, color: MUTED });
  const epText = "EINZEL NETTO";
  drawText(epText, cols.ges - font.widthOfTextAtSize(epText, 8) - 4, headY, { font: bold, size: 8, color: MUTED });
  const gText = "SUMME NETTO";
  drawText(gText, cols.end - font.widthOfTextAtSize(gText, 8) - 4, headY, { font: bold, size: 8, color: MUTED });
  y -= 16;

  // Bei kurzen Belegen (≤5 Positionen) CTA auf Seite 1 halten
  // (Angebot annehmen / Zahlung bestätigen) — ohne großen Reservestreifen unten.
  const keepCtaOnFirstPage =
    items.length <= 5 &&
    ((belegArt === "Angebot" && !!acceptUrl) || (belegArt === "Rechnung" && !!invoice?.pay_url));

  const ensureSpace = (needed: number, bottomPad = keepCtaOnFirstPage ? 24 : 48) => {
    if (y - needed < MARGIN.b + bottomPad) {
      page = pdf.addPage([A4.w, A4.h]);
      y = A4.h - MARGIN.t;
    }
  };

  items.sort((a, b) => a.pos - b.pos).forEach((it, idx) => {
    const nameLines = wrap(it.name, bold, 10, nameWidth);
    const beschLines = it.beschreibung ? wrap(it.beschreibung, font, 8.5, nameWidth) : [];
    // Inhalt + Abstand unter letzter Baseline + Trennlinie + Luft für Ascender der nächsten Zeile.
    // (pdf-lib zeichnet an der Baseline; Großbuchstaben ragen ~7–8pt darüber — ohne diesen
    // Puffer schneidet die Trennlinie der vorherigen Zeile durch den Text der nächsten.)
    const contentSpan = Math.max(12, nameLines.length * 12 + beschLines.length * 11);
    const gapBelowContent = 4;
    const gapAfterLine = 12;
    ensureSpace(contentSpan + gapBelowContent + gapAfterLine);

    const rowTop = y;
    drawText(String(idx + 1), cols.pos + 4, rowTop, { size: 9, color: MUTED });
    drawText(it.artikel, cols.artikel, rowTop, { size: 9, color: MUTED });

    let ny = rowTop;
    for (const nl of nameLines) {
      drawText(nl, cols.name, ny, { font: bold, size: 10 });
      ny -= 12;
    }
    for (const bl of beschLines) {
      drawText(bl, cols.name, ny, { size: 8.5, color: MUTED });
      ny -= 11;
    }

    const menge = sanitizeWinAnsi(`${it.menge} ${it.einheit}`);
    drawText(menge, cols.ep - font.widthOfTextAtSize(menge, 9) - 4, rowTop, { size: 9 });
    const ep = fmtEUR(Number(it.einzelpreis));
    drawText(ep, cols.ges - font.widthOfTextAtSize(ep, 9) - 4, rowTop, { size: 9 });
    const ges = fmtEUR(Number(it.position_total));
    drawText(ges, cols.end - bold.widthOfTextAtSize(ges, 9) - 4, rowTop, { font: bold, size: 9 });

    // ny liegt eine Zeilenhöhe unter der letzten Baseline → Trennlinie klar darunter.
    const lineY = ny - gapBelowContent;
    page.drawLine({
      start: { x: MARGIN.l, y: lineY },
      end: { x: A4.w - MARGIN.r, y: lineY },
      thickness: 0.5,
      color: LINE,
    });
    y = lineY - gapAfterLine;
  });

  y -= 14;
  // Summenblock: ~5 Zeilen + Linie; kein künstlicher 120pt-Seitenumbruch mehr.
  ensureSpace(100);

  // ============ SUMMEN ============
  const sumRight = A4.w - MARGIN.r;
  const drawSum = (label: string, value: string, opts: { bold?: boolean; big?: boolean; line?: boolean } = {}) => {
    if (opts.line) {
      // Linie klar zwischen vorheriger Summenzeile und dem Gesamtbetrag — nicht in den Text.
      y -= 6;
      page.drawLine({
        start: { x: sumRight - 200, y: y + 10 },
        end: { x: sumRight, y: y + 10 },
        thickness: 1.25,
        color: NAVY,
      });
      y -= 4;
    }
    const f = opts.bold ? bold : font;
    const size = opts.big ? 12 : 10;
    drawText(label, sumRight - 200, y, { font: f, size, color: opts.bold ? TEXT : MUTED });
    drawText(value, sumRight - f.widthOfTextAtSize(value, size), y, { font: f, size });
    y -= opts.big ? 20 : 14;
  };

  drawSum("Zwischensumme", fmtEUR(Number(offer.subtotal)));
  if (Number(offer.rabatt) > 0) {
    drawSum(`Neukundenrabatt (${Number(offer.rabatt_rate)}%)`, `-${fmtEUR(Number(offer.rabatt))}`);
  }
  if (Number(offer.lieferkosten) > 0) drawSum("Lieferkosten", fmtEUR(Number(offer.lieferkosten)));
  drawSum(`zzgl. ${Number(offer.mwst_rate)}% MwSt.`, fmtEUR(Number(offer.mwst)));
  drawSum("Gesamtbetrag", fmtEUR(Number(offer.total)), { bold: true, big: true, line: true });

  y -= 10;

  // ============ BANK / FOOTER ============


  if (belegArt === "Rechnung" && invoice) {
    const bankBlock = 70;
    if (!keepCtaOnFirstPage) ensureSpace(bankBlock);
    drawText("BANKVERBINDUNG", MARGIN.l, y, { font: bold, size: 8, color: MUTED });
    y -= 14;
    drawText(`Kontoinhaber: ${invoice.bank_inhaber}`, MARGIN.l, y, { size: 9 });
    y -= 12;
    drawText(`Bank: ${invoice.bank_name}`, MARGIN.l, y, { size: 9 });
    y -= 12;
    drawText(`IBAN: ${invoice.bank_iban}`, MARGIN.l, y, { size: 9 });
    y -= 12;
    drawText(`BIC: ${invoice.bank_bic}`, MARGIN.l, y, { size: 9 });
    y -= 12;
    drawText(
      `Zahlbar bis ${invoice.faellig_am.toLocaleDateString("de-DE")}, ohne Abzug.`,
      MARGIN.l,
      y,
      { size: 9, color: MUTED },
    );
    y -= 16;
  }

  // ============ ANNAHME-BUTTON (nur Angebot, mit URL) ============
  if (belegArt === "Angebot" && acceptUrl) {
    const bw = 240;
    const bh = 34;
    const buttonBlock = bh + 28; // Button + Hinweiszeile
    // Bei ≤5 Positionen keinen Seitenumbruch vor dem CTA erzwingen.
    if (!keepCtaOnFirstPage) ensureSpace(buttonBlock);
    const bx = (A4.w - bw) / 2;
    const by = y - bh - 4;
    if (alreadyAccepted) {
      page.drawRectangle({ x: bx, y: by, width: bw, height: bh, color: rgb(0.96, 0.95, 0.91), borderColor: GOLD, borderWidth: 1 });
      const label = "Angebot bereits angenommen";
      const lw = font.widthOfTextAtSize(label, 11);
      drawText(label, bx + (bw - lw) / 2, by + 12, { size: 11, color: NAVY });
    } else {
      page.drawRectangle({ x: bx, y: by, width: bw, height: bh, color: NAVY });
      const label = "ANGEBOT ANNEHMEN";
      const lw = bold.widthOfTextAtSize(label, 11);
      drawText(label, bx + (bw - lw) / 2, by + 12, { font: bold, size: 11, color: rgb(0.96, 0.95, 0.91) });
      const link = pdf.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [bx, by, bx + bw, by + bh],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(acceptUrl) },
      });
      const existing = page.node.get(PDFName.of("Annots"));
      if (existing instanceof PDFArray) existing.push(link);
      else page.node.set(PDFName.of("Annots"), pdf.context.obj([link]));
      const hint = "Klicken zum verbindlichen Annehmen";
      drawText(hint, bx + (bw - font.widthOfTextAtSize(hint, 8)) / 2, by - 12, { size: 8, color: MUTED });
    }
    y = by - 24;
  }

  // ============ ZAHLUNGS-BUTTON (nur Rechnung, mit URL) ============
  if (belegArt === "Rechnung" && invoice?.pay_url) {
    const bw = 240;
    const bh = 34;
    const buttonBlock = bh + 28;
    if (!keepCtaOnFirstPage) ensureSpace(buttonBlock);
    const bx = (A4.w - bw) / 2;
    const by = y - bh - 4;
    if (invoice.paid) {
      page.drawRectangle({ x: bx, y: by, width: bw, height: bh, color: rgb(0.96, 0.95, 0.91), borderColor: GOLD, borderWidth: 1 });
      const label = "Zahlung bereits bestätigt";
      const lw = font.widthOfTextAtSize(label, 11);
      drawText(label, bx + (bw - lw) / 2, by + 12, { size: 11, color: NAVY });
    } else {
      page.drawRectangle({ x: bx, y: by, width: bw, height: bh, color: NAVY });
      const label = "ZAHLUNG BESTÄTIGEN";
      const lw = bold.widthOfTextAtSize(label, 11);
      drawText(label, bx + (bw - lw) / 2, by + 12, { font: bold, size: 11, color: rgb(0.96, 0.95, 0.91) });
      const link = pdf.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [bx, by, bx + bw, by + bh],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(invoice.pay_url) },
      });
      const existing = page.node.get(PDFName.of("Annots"));
      if (existing instanceof PDFArray) existing.push(link);
      else page.node.set(PDFName.of("Annots"), pdf.context.obj([link]));
      const hint = "Klicken sobald überwiesen";
      drawText(hint, bx + (bw - font.widthOfTextAtSize(hint, 8)) / 2, by - 12, { size: 8, color: MUTED });
    }
    y = by - 24;
  }


  const footerLines = wrap(
    belegArt === "Angebot"
      ? "Vielen Dank für Ihre Anfrage. Dieses Angebot ist 7 Tage gültig. Alle Positionen aus laufender Verwertung. Lieferung ab Bestellwert 3.000 € netto kostenfrei innerhalb des Liefergebiets. Zwischenverkauf vorbehalten."
      : "Vielen Dank für Ihren Auftrag. Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer bis zum Fälligkeitsdatum auf das oben genannte Konto.",
    font,
    8.5,
    A4.w - MARGIN.l - MARGIN.r,
  );
  const footerHeight = footerLines.length * 10 + 4;
  // Kurze Belege: Footer nicht allein auf eine neue Seite schieben.
  if (!(keepCtaOnFirstPage && pdf.getPageCount() === 1)) {
    ensureSpace(footerHeight);
  }
  for (const l of footerLines) {
    drawText(l, MARGIN.l, y, { size: 8.5, color: MUTED });
    y -= 10;
  }

  return pdf.save();
}

export function renderOfferPdf(
  offer: OfferForPdf,
  items: ItemForPdf[],
  acceptUrl?: string | null,
): Promise<Uint8Array> {
  const created = new Date(offer.created_at);
  const gueltigBis = new Date(created.getTime() + 7 * 24 * 3600 * 1000);
  return renderBeleg("Angebot", offer.angebot_nr, created, gueltigBis, offer, items, undefined, acceptUrl, !!offer.accepted_at);
}

export function renderInvoicePdf(
  offer: OfferForPdf,
  items: ItemForPdf[],
  invoice: InvoiceMeta,
): Promise<Uint8Array> {
  return renderBeleg("Rechnung", invoice.rechnung_nr, invoice.datum, invoice.faellig_am, offer, items, invoice);
}

// Uint8Array -> base64 (worker-kompatibel)
export function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  // btoa existiert in Cloudflare Workers
  return btoa(bin);
}
