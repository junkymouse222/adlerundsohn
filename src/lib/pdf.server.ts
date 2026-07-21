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

  // ============ HEADER (Logo links, Beleginfo rechts, Gold-Unterlinie) ============
  const headerTop = y;
  const logoBytes = await loadLogo();
  const logoH = 56;
  let logoBottom = headerTop - logoH;
  if (logoBytes) {
    try {
      const img = await pdf.embedPng(logoBytes);
      const logoW = (img.width / img.height) * logoH;
      page.drawImage(img, { x: MARGIN.l, y: logoBottom, width: logoW, height: logoH });
    } catch {
      /* ohne Logo weiter */
    }
  }
  drawText("Kanzlei Adler und Sohn · Strandstraße 14 · 25980 Westerland/Sylt", MARGIN.l, logoBottom - 14, { size: 9, color: MUTED });
  drawText("Telefon +49 6591 6659636 · info@adlerundsohn.com", MARGIN.l, logoBottom - 26, { size: 9, color: MUTED });

  // Beleg-Info rechts
  const rightX = A4.w - MARGIN.r;
  const label = belegArt.toUpperCase();
  drawText(label, rightX - bold.widthOfTextAtSize(label, 9), headerTop - 4, { font: bold, size: 9, color: MUTED });
  drawText(belegNr, rightX - serif.widthOfTextAtSize(belegNr, 22), headerTop - 26, { font: serif, size: 22, color: NAVY });
  const datumStr = `Datum: ${datum.toLocaleDateString("de-DE")}`;
  drawText(datumStr, rightX - font.widthOfTextAtSize(datumStr, 9), headerTop - 42, { size: 9, color: MUTED });
  const gueltigLabel = belegArt === "Angebot" ? "Gültig bis: " : "Fällig am: ";
  const gueltigStr = `${gueltigLabel}${faelligOderGueltig.toLocaleDateString("de-DE")}`;
  drawText(gueltigStr, rightX - font.widthOfTextAtSize(gueltigStr, 9), headerTop - 54, { size: 9, color: MUTED });

  // Gold-Unterlinie unterhalb des Header-Blocks
  const headerBottom = logoBottom - 36;
  page.drawLine({
    start: { x: MARGIN.l, y: headerBottom },
    end: { x: A4.w - MARGIN.r, y: headerBottom },
    thickness: 1.2,
    color: GOLD,
  });
  y = headerBottom - 24;

  // ============ EMPFÄNGER + LIEFERANSCHRIFT (2 Spalten) ============
  const colW = (A4.w - MARGIN.l - MARGIN.r) / 2;
  drawText("RECHNUNGSEMPFÄNGER", MARGIN.l, y, { font: bold, size: 8, color: MUTED });
  const lieferLabel = "LIEFERANSCHRIFT";
  drawText(lieferLabel, rightX - bold.widthOfTextAtSize(lieferLabel, 8), y, { font: bold, size: 8, color: MUTED });
  y -= 14;

  const empfLines: string[] = [];
  empfLines.push(offer.customer_company || offer.customer_name);
  if (offer.customer_company) empfLines.push(offer.customer_name);
  for (const l of String(offer.customer_address).split(/\r?\n/)) if (l.trim()) empfLines.push(l);
  if (offer.customer_ust_id) empfLines.push(`USt-IdNr.: ${offer.customer_ust_id}`);

  const empfY = y;
  for (let i = 0; i < empfLines.length; i++) {
    drawText(empfLines[i], MARGIN.l, y, { font: i === 0 ? bold : font, size: 10 });
    y -= 13;
  }
  // Lieferanschrift (rechts, aktuell: gleich Rechnungsempfänger)
  const lieferText = "Gleich Rechnungsempfänger";
  drawText(lieferText, rightX - font.widthOfTextAtSize(lieferText, 10), empfY, { size: 10, color: MUTED });

  y -= 16;

  // ============ TABELLE (Pos / Bezeichnung / Menge / Einh. / Einzel netto / Summe netto) ============
  const cols = {
    pos: MARGIN.l,
    name: MARGIN.l + 32,
    menge: A4.w - MARGIN.r - 230,
    einh: A4.w - MARGIN.r - 175,
    ep: A4.w - MARGIN.r - 130,
    ges: A4.w - MARGIN.r - 60,
    end: A4.w - MARGIN.r,
  };
  const nameWidth = cols.menge - cols.name - 6;

  const headTopY = y + 14;
  const headBotY = y - 6;
  page.drawLine({ start: { x: MARGIN.l, y: headTopY }, end: { x: A4.w - MARGIN.r, y: headTopY }, thickness: 0.75, color: LINE });
  page.drawLine({ start: { x: MARGIN.l, y: headBotY }, end: { x: A4.w - MARGIN.r, y: headBotY }, thickness: 0.75, color: LINE });
  const headY = y + 2;
  drawText("POS.", cols.pos, headY, { font: bold, size: 8, color: MUTED });
  drawText("BEZEICHNUNG", cols.name, headY, { font: bold, size: 8, color: MUTED });
  const mText = "MENGE";
  drawText(mText, cols.einh - font.widthOfTextAtSize(mText, 8) - 4, headY, { font: bold, size: 8, color: MUTED });
  drawText("EINH.", cols.einh, headY, { font: bold, size: 8, color: MUTED });
  const epText = "EINZEL NETTO";
  drawText(epText, cols.ges - font.widthOfTextAtSize(epText, 8) - 4, headY, { font: bold, size: 8, color: MUTED });
  const gText = "SUMME NETTO";
  drawText(gText, cols.end - font.widthOfTextAtSize(gText, 8) - 4, headY, { font: bold, size: 8, color: MUTED });
  y -= 16;

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
    const detail = [it.artikel ? `Art.-Nr. ${it.artikel}` : "", it.beschreibung || ""].filter(Boolean).join(" · ");
    const beschLines = detail ? wrap(detail, font, 8.5, nameWidth) : [];
    const contentSpan = Math.max(12, nameLines.length * 12 + beschLines.length * 11);
    ensureSpace(contentSpan + 16);

    const rowTop = y;
    drawText(String(idx + 1), cols.pos + 2, rowTop, { size: 9, color: MUTED });

    let ny = rowTop;
    for (const nl of nameLines) {
      drawText(nl, cols.name, ny, { font: bold, size: 10 });
      ny -= 12;
    }
    for (const bl of beschLines) {
      drawText(bl, cols.name, ny, { size: 8.5, color: MUTED });
      ny -= 11;
    }

    const menge = String(it.menge);
    drawText(menge, cols.einh - font.widthOfTextAtSize(menge, 9) - 4, rowTop, { size: 9 });
    drawText(sanitizeWinAnsi(it.einheit), cols.einh, rowTop, { size: 9, color: MUTED });
    const ep = fmtEUR(Number(it.einzelpreis));
    drawText(ep, cols.ges - font.widthOfTextAtSize(ep, 9) - 4, rowTop, { size: 9 });
    const ges = fmtEUR(Number(it.position_total));
    drawText(ges, cols.end - bold.widthOfTextAtSize(ges, 9) - 4, rowTop, { font: bold, size: 9 });

    const lineY = ny - 4;
    page.drawLine({
      start: { x: MARGIN.l, y: lineY },
      end: { x: A4.w - MARGIN.r, y: lineY },
      thickness: 0.5,
      color: LINE,
    });
    y = lineY - 10;
  });

  y -= 12;
  ensureSpace(110);

  // ============ SUMMEN (mit Netto-Zeile und Gold-Regel vor Gesamt) ============
  const sumRight = A4.w - MARGIN.r;
  const sumLeft = sumRight - 220;
  const drawSum = (
    lbl: string,
    value: string,
    opts: { bold?: boolean; big?: boolean; line?: "thin" | "gold"; muted?: boolean } = {},
  ) => {
    if (opts.line === "thin") {
      page.drawLine({ start: { x: sumLeft, y: y + 10 }, end: { x: sumRight, y: y + 10 }, thickness: 0.5, color: LINE });
      y -= 2;
    }
    if (opts.line === "gold") {
      y -= 4;
      page.drawLine({ start: { x: sumLeft, y: y + 10 }, end: { x: sumRight, y: y + 10 }, thickness: 1, color: GOLD });
      y -= 4;
    }
    const f = opts.bold ? bold : font;
    const size = opts.big ? 12 : 10;
    const labelColor = opts.bold ? NAVY : MUTED;
    drawText(lbl, sumLeft, y, { font: f, size, color: labelColor });
    drawText(value, sumRight - f.widthOfTextAtSize(value, size), y, { font: f, size, color: opts.bold ? NAVY : TEXT });
    y -= opts.big ? 20 : 14;
  };

  const subtotal = Number(offer.subtotal);
  const rabattBetrag = Number(offer.rabatt ?? 0);
  const rabattRate = Number(offer.rabatt_rate ?? 0);
  const lieferkosten = Number(offer.lieferkosten);
  const netto = subtotal - rabattBetrag + lieferkosten;

  drawSum("Zwischensumme", fmtEUR(subtotal));
  if (rabattBetrag > 0) drawSum(`Rabatt (${rabattRate}%)`, `-${fmtEUR(rabattBetrag)}`);
  if (lieferkosten > 0) drawSum("Lieferkosten", fmtEUR(lieferkosten));
  drawSum("Netto", fmtEUR(netto), { line: "thin" });
  drawSum(`zzgl. MwSt. (${Number(offer.mwst_rate)}%)`, fmtEUR(Number(offer.mwst)));
  drawSum("GESAMT", fmtEUR(Number(offer.total)), { bold: true, big: true, line: "gold" });

  y -= 10;

  // ============ CTA (Angebot annehmen / Zahlung bestätigen) ============
  const drawCta = (url: string, done: boolean, doneLabel: string, activeLabel: string, _hint: string) => {
    const bw = 240;
    const bh = 34;
    if (!keepCtaOnFirstPage) ensureSpace(bh + 28);
    const bx = (A4.w - bw) / 2;
    const by = y - bh - 4;
    if (done) {
      page.drawRectangle({ x: bx, y: by, width: bw, height: bh, color: rgb(0.96, 0.95, 0.91), borderColor: GOLD, borderWidth: 1 });
      const lw = font.widthOfTextAtSize(doneLabel, 11);
      drawText(doneLabel, bx + (bw - lw) / 2, by + 12, { size: 11, color: NAVY });
    } else {
      page.drawRectangle({ x: bx, y: by, width: bw, height: bh, color: NAVY });
      const lw = bold.widthOfTextAtSize(activeLabel, 11);
      drawText(activeLabel, bx + (bw - lw) / 2, by + 12, { font: bold, size: 11, color: rgb(0.96, 0.95, 0.91) });
      const link = pdf.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [bx, by, bx + bw, by + bh],
        Border: [0, 0, 0],
        A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
      });
      const existing = page.node.get(PDFName.of("Annots"));
      if (existing instanceof PDFArray) existing.push(link);
      else page.node.set(PDFName.of("Annots"), pdf.context.obj([link]));
      // Hinweistext entfernt — /rechnung zeigt unter dem Button ebenfalls keinen.
    }
    y = by - 24;
  };

  if (belegArt === "Angebot" && acceptUrl) {
    drawCta(acceptUrl, !!alreadyAccepted, "Angebot bereits angenommen", "ANGEBOT ANNEHMEN", "Klicken zum verbindlichen Annehmen");
  }
  if (belegArt === "Rechnung" && invoice?.pay_url) {
    drawCta(invoice.pay_url, !!invoice.paid, "Zahlung bereits bestätigt", "ZAHLUNG BESTÄTIGEN", "Klicken sobald überwiesen");
  }

  // ============ BANK / ZAHLUNGSBEDINGUNGEN (nur Rechnung, 2 Spalten) ============
  if (belegArt === "Rechnung" && invoice) {
    ensureSpace(140);
    page.drawLine({ start: { x: MARGIN.l, y: y + 6 }, end: { x: A4.w - MARGIN.r, y: y + 6 }, thickness: 0.5, color: LINE });
    y -= 10;

    const bankTopY = y;
    const leftColW = colW - 10;
    const rightColX = MARGIN.l + colW + 10;

    // Links: Zahlungsbedingungen + Anderkonto-Hinweis
    drawText("ZAHLUNGSBEDINGUNGEN", MARGIN.l, y, { font: bold, size: 8, color: MUTED });
    let ly = y - 14;
    const bedText = `Bitte überweisen Sie den Rechnungsbetrag bis zum ${invoice.faellig_am.toLocaleDateString("de-DE")} auf das nebenstehende Konto unter Angabe der Rechnungsnummer ${invoice.rechnung_nr}.`;
    for (const line of wrap(bedText, font, 9, leftColW)) {
      drawText(line, MARGIN.l, ly, { size: 9 });
      ly -= 12;
    }
    ly -= 4;
    drawText("Hinweis:", MARGIN.l, ly, { font: bold, size: 8.5, color: MUTED });
    ly -= 11;
    const hinweis =
      "Bei dem angegebenen Konto handelt es sich um ein Mandanten-/Anderkonto der Kanzlei, über das ausschließlich der bestellte Insolvenzverwalter alleinige Handlungs- und Verfügungsvollmacht besitzt. Ihre Zahlung ist dadurch treuhänderisch durch die Kanzlei geschützt und gegen den Zugriff Dritter gesichert.";
    for (const line of wrap(hinweis, font, 8.5, leftColW)) {
      drawText(line, MARGIN.l, ly, { size: 8.5, color: MUTED });
      ly -= 10.5;
    }

    // Rechts: Bankverbindung
    let ry = bankTopY;
    drawText("BANKVERBINDUNG", rightColX, ry, { font: bold, size: 8, color: MUTED });
    ry -= 14;
    drawText(`Kontoinhaber: ${invoice.bank_inhaber}`, rightColX, ry, { size: 9 });
    ry -= 13;
    drawText(`Bank: ${invoice.bank_name}`, rightColX, ry, { size: 9 });
    ry -= 13;
    drawText(`IBAN: ${invoice.bank_iban}`, rightColX, ry, { size: 9 });
    ry -= 13;
    drawText(`BIC: ${invoice.bank_bic}`, rightColX, ry, { size: 9 });

    y = Math.min(ly, ry) - 12;
  }

  // ============ FOOTER ============
  ensureSpace(24);
  page.drawLine({ start: { x: MARGIN.l, y: y + 6 }, end: { x: A4.w - MARGIN.r, y: y + 6 }, thickness: 0.5, color: LINE });
  y -= 8;
  drawText(
    "Kanzlei Adler und Sohn · Strandstraße 14 · 25980 Westerland/Sylt · +49 6591 6659636 · info@adlerundsohn.com · USt-IdNr. DE271552088",
    MARGIN.l,
    y,
    { size: 7.5, color: MUTED },
  );

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
