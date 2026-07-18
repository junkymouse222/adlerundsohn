import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>, userId: string) {
  // Cast to any to sidestep generated-types lag on new tables.
  const client = supabase as any;
  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Nicht berechtigt.");
}

export type OfferListRow = {
  id: string;
  created_at: string;
  scheduled_send_at: string;
  sent_at: string | null;
  status: string;
  angebot_nr: string;
  customer_company: string | null;
  customer_name: string;
  customer_email: string;
  subtotal: number;
  total: number;
  error_message: string | null;
  accepted_at: string | null;
  rechnung_status: string | null;
};

export type OfferDetail = {
  offer: {
    id: string;
    created_at: string;
    scheduled_send_at: string;
    sent_at: string | null;
    status: string;
    angebot_nr: string;
    customer_company: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    customer_address: string;
    customer_ust_id: string | null;
    message: string | null;
    ref_source: string | null;
    subtotal: number;
    mwst_rate: number;
    mwst: number;
    total: number;
    lieferkosten: number;
    offer_html: string | null;
    resend_message_id: string | null;
    error_message: string | null;
    rechnung_nr: string | null;
    rechnung_status: string | null;
    rechnung_sent_at: string | null;
    rechnung_message_id: string | null;
    rechnung_faellig_am: string | null;
    rechnung_error: string | null;
    accept_token: string | null;
    accepted_at: string | null;
    accepted_ip: string | null;
    pay_token: string | null;
    paid_at: string | null;
    paid_ip: string | null;
    bank_inhaber: string | null;
    bank_name: string | null;
    bank_iban: string | null;
    bank_bic: string | null;
  };
  items: Array<{
    id: string;
    pos: number;
    artikel: string;
    name: string;
    beschreibung: string | null;
    einheit: string;
    einzelpreis: number;
    menge: number;
    position_total: number;
  }>;
};


export const listOfferRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: OfferListRow[] }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const client = context.supabase as any;
    const { data, error } = await client
      .from("offer_requests")
      .select("id, created_at, scheduled_send_at, sent_at, status, angebot_nr, customer_company, customer_name, customer_email, subtotal, total, error_message, accepted_at, rechnung_status")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as OfferListRow[] };
  });

export const getOfferRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }): Promise<OfferDetail> => {
    await assertAdmin(context.supabase as never, context.userId);
    const client = context.supabase as any;
    const { data: offer, error } = await client
      .from("offer_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!offer) throw new Error("Anfrage nicht gefunden.");
    const { data: items, error: itemsErr } = await client
      .from("offer_request_items")
      .select("*")
      .eq("request_id", data.id)
      .order("pos", { ascending: true });
    if (itemsErr) throw new Error(itemsErr.message);
    return {
      offer: offer as OfferDetail["offer"],
      items: (items ?? []) as OfferDetail["items"],
    };
  });

export const resendOfferNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }): Promise<{ ok: true; messageId?: string }> => {
    await assertAdmin(context.supabase as never, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { renderOfferHtml, sendOfferEmail, offerAcceptUrl } = await import("@/lib/offer-email.server");
    const { renderOfferPdf, toBase64 } = await import("@/lib/pdf.server");

    const admin = supabaseAdmin as any;
    const { data: offer, error: offerErr } = await admin
      .from("offer_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (offerErr) throw new Error(offerErr.message);
    if (!offer) throw new Error("Anfrage nicht gefunden.");

    const { data: items, error: itemsErr } = await admin
      .from("offer_request_items")
      .select("*")
      .eq("request_id", data.id)
      .order("pos", { ascending: true });
    if (itemsErr) throw new Error(itemsErr.message);

    const acceptUrl = offerAcceptUrl(offer.accept_token as string | null);
    const html = renderOfferHtml(offer as never, (items ?? []) as never);
    const pdfBytes = await renderOfferPdf(offer as never, (items ?? []) as never, acceptUrl);

    const send = await sendOfferEmail({
      to: offer.customer_email as string,
      subject: `Ihr Angebot ${offer.angebot_nr as string} — Kanzlei Adler und Sohn`,
      html,
      attachments: [
        { filename: `Angebot-${offer.angebot_nr}.pdf`, content: toBase64(pdfBytes) },
      ],
    });

    if (!send.ok) {
      await admin
        .from("offer_requests")
        .update({ status: "failed", offer_html: html, error_message: send.error })
        .eq("id", data.id);
      throw new Error(send.error);
    }

    await admin
      .from("offer_requests")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        offer_html: html,
        resend_message_id: send.messageId,
        error_message: null,
      })
      .eq("id", data.id);

    return { ok: true, messageId: send.messageId };
  });

// ============ RECHNUNG ============

const BankSchema = z.object({
  bank_inhaber: z.string().trim().min(1).max(200),
  bank_name: z.string().trim().min(1).max(200),
  bank_iban: z.string().trim().min(4).max(64),
  bank_bic: z.string().trim().min(4).max(32),
});

function nextRechnungNr(): string {
  const year = new Date().getFullYear();
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  return `R-${year}-${rnd}`;
}

const InvoiceInputSchema = z.object({
  id: z.string().uuid(),
  faellig_tage: z.number().int().min(1).max(120).optional(),
  bank_inhaber: z.string().trim().min(1).max(200).optional(),
  bank_name: z.string().trim().min(1).max(200).optional(),
  bank_iban: z.string().trim().min(4).max(64).optional(),
  bank_bic: z.string().trim().min(4).max(32).optional(),
});

export const sendInvoiceNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InvoiceInputSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ ok: true; messageId?: string; rechnung_nr: string }> => {
    await assertAdmin(context.supabase as never, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendOfferEmail } = await import("@/lib/offer-email.server");
    const { renderInvoicePdf, toBase64 } = await import("@/lib/pdf.server");

    const admin = supabaseAdmin as any;
    const { data: offer, error: offerErr } = await admin
      .from("offer_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (offerErr) throw new Error(offerErr.message);
    if (!offer) throw new Error("Anfrage nicht gefunden.");

    const { data: items, error: itemsErr } = await admin
      .from("offer_request_items")
      .select("*")
      .eq("request_id", data.id)
      .order("pos", { ascending: true });
    if (itemsErr) throw new Error(itemsErr.message);

    const rechnung_nr: string = (offer.rechnung_nr as string | null) ?? nextRechnungNr();
    const datum = new Date();
    const tage = data.faellig_tage ?? 14;
    const faellig = new Date(datum.getTime() + tage * 24 * 3600 * 1000);

    const invoice = {
      rechnung_nr,
      datum,
      faellig_am: faellig,
      bank_inhaber: data.bank_inhaber || (offer.bank_inhaber as string | null) || process.env.BANK_INHABER || "Kanzlei Adler und Sohn",
      bank_name: data.bank_name || (offer.bank_name as string | null) || process.env.BANK_NAME || "Sparkasse Trier",
      bank_iban: data.bank_iban || (offer.bank_iban as string | null) || process.env.BANK_IBAN || "DE00 0000 0000 0000 0000 00",
      bank_bic: data.bank_bic || (offer.bank_bic as string | null) || process.env.BANK_BIC || "TRISDE55XXX",
    };

    const pdfBytes = await renderInvoicePdf(offer as never, (items ?? []) as never, invoice);

    const html = `<!doctype html><html lang="de"><body style="margin:0;padding:0;background:#efece4;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;"><tr><td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border-top:4px solid #c9a55c;">
          <tr><td style="padding:36px 40px 8px 40px;">
            <div style="font-family:Georgia,serif;font-size:22px;color:#0f2740;">Rechtsanwaltskanzlei</div>
            <div style="font-family:Georgia,serif;font-size:28px;color:#0f2740;font-weight:600;">Adler und Sohn</div>
            <div style="height:2px;width:56px;background:#c9a55c;margin-top:12px;"></div>
          </td></tr>
          <tr><td style="padding:24px 40px;">
            <p style="font-family:Georgia,serif;font-size:16px;color:#0f2740;margin:0 0 12px 0;">Sehr geehrte Damen und Herren,</p>
            <p style="margin:0 0 12px 0;font-size:14px;line-height:1.7;">anbei erhalten Sie unsere Rechnung <strong>${rechnung_nr}</strong> zu Ihrem Angebot ${offer.angebot_nr}.</p>
            <p style="margin:0 0 24px 0;font-size:14px;line-height:1.7;">Bitte überweisen Sie den Rechnungsbetrag von <strong style="color:#0f2740;">${new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(offer.total))}</strong> unter Angabe der Rechnungsnummer bis zum <strong>${faellig.toLocaleDateString("de-DE")}</strong>.</p>
            <div style="background:#f5f3ee;border-left:3px solid #c9a55c;padding:14px 18px;font-size:13px;">
              <div style="font-family:Georgia,serif;color:#0f2740;margin-bottom:6px;">Bankverbindung</div>
              <div>${invoice.bank_inhaber}</div>
              <div>${invoice.bank_name}</div>
              <div>IBAN: ${invoice.bank_iban}</div>
              <div>BIC: ${invoice.bank_bic}</div>
            </div>
            <p style="margin-top:24px;font-family:Georgia,serif;color:#0f2740;">Mit besten Grüßen<br/>Kanzlei Adler und Sohn</p>
          </td></tr>
        </table>
      </td></tr></table>
    </body></html>`;

    const send = await sendOfferEmail({
      to: offer.customer_email as string,
      subject: `Ihre Rechnung ${rechnung_nr} — Kanzlei Adler und Sohn`,
      html,
      attachments: [{ filename: `Rechnung-${rechnung_nr}.pdf`, content: toBase64(pdfBytes) }],
    });

    if (!send.ok) {
      await admin
        .from("offer_requests")
        .update({
          rechnung_nr,
          rechnung_status: "failed",
          rechnung_error: send.error,
          rechnung_faellig_am: faellig.toISOString().slice(0, 10),
          bank_inhaber: invoice.bank_inhaber,
          bank_name: invoice.bank_name,
          bank_iban: invoice.bank_iban,
          bank_bic: invoice.bank_bic,
        })
        .eq("id", data.id);
      throw new Error(send.error);
    }

    await admin
      .from("offer_requests")
      .update({
        rechnung_nr,
        rechnung_status: "sent",
        rechnung_sent_at: new Date().toISOString(),
        rechnung_message_id: send.messageId,
        rechnung_faellig_am: faellig.toISOString().slice(0, 10),
        rechnung_error: null,
        bank_inhaber: invoice.bank_inhaber,
        bank_name: invoice.bank_name,
        bank_iban: invoice.bank_iban,
        bank_bic: invoice.bank_bic,
      })
      .eq("id", data.id);

    return { ok: true, messageId: send.messageId, rechnung_nr };
  });

// ============ PREVIEW / DOWNLOAD PDFs (ohne Versand) ============

export const previewOfferPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }): Promise<{ base64: string; filename: string }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { renderOfferPdf, toBase64 } = await import("@/lib/pdf.server");
    const { offerAcceptUrl } = await import("@/lib/offer-email.server");
    const admin = supabaseAdmin as any;
    const { data: offer } = await admin.from("offer_requests").select("*").eq("id", data.id).maybeSingle();
    if (!offer) throw new Error("Anfrage nicht gefunden.");
    const { data: items } = await admin
      .from("offer_request_items")
      .select("*")
      .eq("request_id", data.id)
      .order("pos", { ascending: true });
    const acceptUrl = offerAcceptUrl(offer.accept_token as string | null);
    const bytes = await renderOfferPdf(offer as never, (items ?? []) as never, acceptUrl);
    return { base64: toBase64(bytes), filename: `Angebot-${offer.angebot_nr}.pdf` };
  });

export const previewInvoicePdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InvoiceInputSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ base64: string; filename: string; rechnung_nr: string }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { renderInvoicePdf, toBase64 } = await import("@/lib/pdf.server");
    const admin = supabaseAdmin as any;
    const { data: offer } = await admin.from("offer_requests").select("*").eq("id", data.id).maybeSingle();
    if (!offer) throw new Error("Anfrage nicht gefunden.");
    const { data: items } = await admin
      .from("offer_request_items")
      .select("*")
      .eq("request_id", data.id)
      .order("pos", { ascending: true });

    const rechnung_nr: string = (offer.rechnung_nr as string | null) ?? nextRechnungNr();
    const datum = new Date();
    const tage = data.faellig_tage ?? 14;
    const faellig = new Date(datum.getTime() + tage * 24 * 3600 * 1000);
    const invoice = {
      rechnung_nr,
      datum,
      faellig_am: faellig,
      bank_inhaber: data.bank_inhaber || (offer.bank_inhaber as string | null) || process.env.BANK_INHABER || "Kanzlei Adler und Sohn",
      bank_name: data.bank_name || (offer.bank_name as string | null) || process.env.BANK_NAME || "Sparkasse Trier",
      bank_iban: data.bank_iban || (offer.bank_iban as string | null) || process.env.BANK_IBAN || "DE00 0000 0000 0000 0000 00",
      bank_bic: data.bank_bic || (offer.bank_bic as string | null) || process.env.BANK_BIC || "TRISDE55XXX",
    };
    const bytes = await renderInvoicePdf(offer as never, (items ?? []) as never, invoice);
    return { base64: toBase64(bytes), filename: `Rechnung-${rechnung_nr}.pdf`, rechnung_nr };
  });


