// Server-only: rendert Angebot/Rechnung als PDF im Stil des internen Beleg-Generators.
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFName, PDFString, PDFArray } from "pdf-lib";

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(n));

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
  mwst_rate: number | string;
  mwst: number | string;
  total: number | string;
  lieferkosten: number | string;
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
};

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = { l: 50, r: 50, t: 50, b: 60 };

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of String(text ?? "").split(/\r?\n/)) {
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
    page.drawText(text, {
      x,
      y: yy,
      size: opts.size ?? 10,
      font: opts.font ?? font,
      color: opts.color ?? TEXT,
    });

  // ============ HEADER ============
  drawText("Rechtsanwaltskanzlei Adler und Sohn", MARGIN.l, y - 18, { font: serif, size: 20, color: NAVY });
  // Gold-Linie
  page.drawRectangle({ x: MARGIN.l, y: y - 24, width: 60, height: 1.5, color: GOLD });
  drawText("Strandstraße 14 · 25980 Westerland/Sylt", MARGIN.l, y - 40, { size: 9, color: MUTED });
  drawText("info@adlerundsohn.com", MARGIN.l, y - 52, { size: 9, color: MUTED });

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

  y -= 90;

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

  // Kopfzeile
  page.drawRectangle({
    x: MARGIN.l,
    y: y - 4,
    width: A4.w - MARGIN.l - MARGIN.r,
    height: 20,
    color: NAVY,
  });
  const headY = y + 4;
  const white = rgb(1, 1, 1);
  drawText("Pos.", cols.pos + 4, headY, { font: bold, size: 9, color: white });
  drawText("Artikel", cols.artikel, headY, { font: bold, size: 9, color: white });
  drawText("Bezeichnung", cols.name, headY, { font: bold, size: 9, color: white });
  const mText = "Menge";
  drawText(mText, cols.ep - font.widthOfTextAtSize(mText, 9) - 4, headY, { font: bold, size: 9, color: white });
  const epText = "Einzelpreis";
  drawText(epText, cols.ges - font.widthOfTextAtSize(epText, 9) - 4, headY, { font: bold, size: 9, color: white });
  const gText = "Gesamt";
  drawText(gText, cols.end - font.widthOfTextAtSize(gText, 9) - 4, headY, { font: bold, size: 9, color: white });
  y -= 22;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN.b + 120) {
      page = pdf.addPage([A4.w, A4.h]);
      y = A4.h - MARGIN.t;
    }
  };

  items.sort((a, b) => a.pos - b.pos).forEach((it, idx) => {
    const nameLines = wrap(it.name, bold, 10, nameWidth);
    const beschLines = it.beschreibung ? wrap(it.beschreibung, font, 8.5, nameWidth) : [];
    const rowHeight = Math.max(18, nameLines.length * 12 + beschLines.length * 11 + 6);
    ensureSpace(rowHeight);

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

    const menge = `${it.menge} ${it.einheit}`;
    drawText(menge, cols.ep - font.widthOfTextAtSize(menge, 9) - 4, rowTop, { size: 9 });
    const ep = fmtEUR(Number(it.einzelpreis));
    drawText(ep, cols.ges - font.widthOfTextAtSize(ep, 9) - 4, rowTop, { size: 9 });
    const ges = fmtEUR(Number(it.position_total));
    drawText(ges, cols.end - bold.widthOfTextAtSize(ges, 9) - 4, rowTop, { font: bold, size: 9 });

    y -= rowHeight;
    page.drawLine({
      start: { x: MARGIN.l, y: y + 4 },
      end: { x: A4.w - MARGIN.r, y: y + 4 },
      thickness: 0.5,
      color: LINE,
    });
  });

  y -= 14;
  ensureSpace(120);

  // ============ SUMMEN ============
  const sumRight = A4.w - MARGIN.r;
  const drawSum = (label: string, value: string, opts: { bold?: boolean; big?: boolean; line?: boolean } = {}) => {
    if (opts.line) {
      page.drawLine({ start: { x: sumRight - 200, y: y + 8 }, end: { x: sumRight, y: y + 8 }, thickness: 1, color: NAVY });
    }
    const f = opts.bold ? bold : font;
    const size = opts.big ? 12 : 10;
    drawText(label, sumRight - 200, y, { font: f, size, color: opts.bold ? TEXT : MUTED });
    drawText(value, sumRight - f.widthOfTextAtSize(value, size), y, { font: f, size });
    y -= opts.big ? 18 : 14;
  };

  drawSum("Zwischensumme", fmtEUR(Number(offer.subtotal)));
  if (Number(offer.lieferkosten) > 0) drawSum("Lieferkosten", fmtEUR(Number(offer.lieferkosten)));
  drawSum(`zzgl. ${Number(offer.mwst_rate)}% MwSt.`, fmtEUR(Number(offer.mwst)));
  drawSum("Gesamtbetrag", fmtEUR(Number(offer.total)), { bold: true, big: true, line: true });

  y -= 10;

  // ============ NACHRICHT / BANK / FOOTER ============
  if (offer.message) {
    ensureSpace(60);
    drawText("Ihre Nachricht:", MARGIN.l, y, { font: bold, size: 9 });
    y -= 12;
    for (const l of wrap(offer.message, font, 9, A4.w - MARGIN.l - MARGIN.r)) {
      drawText(l, MARGIN.l, y, { size: 9, color: MUTED });
      y -= 11;
    }
    y -= 8;
  }

  if (belegArt === "Rechnung" && invoice) {
    ensureSpace(70);
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

  ensureSpace(40);
  const footerLines = wrap(
    belegArt === "Angebot"
      ? "Vielen Dank für Ihre Anfrage. Dieses Angebot ist 21 Tage gültig. Alle Positionen aus laufender Verwertung. Lieferung ab Bestellwert 3.000 € netto kostenfrei innerhalb des Liefergebiets. Zwischenverkauf vorbehalten."
      : "Vielen Dank für Ihren Auftrag. Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer bis zum Fälligkeitsdatum auf das oben genannte Konto.",
    font,
    8.5,
    A4.w - MARGIN.l - MARGIN.r,
  );
  for (const l of footerLines) {
    drawText(l, MARGIN.l, y, { size: 8.5, color: MUTED });
    y -= 10;
  }

  return pdf.save();
}

export function renderOfferPdf(offer: OfferForPdf, items: ItemForPdf[]): Promise<Uint8Array> {
  const created = new Date(offer.created_at);
  const gueltigBis = new Date(created.getTime() + 21 * 24 * 3600 * 1000);
  return renderBeleg("Angebot", offer.angebot_nr, created, gueltigBis, offer, items);
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
