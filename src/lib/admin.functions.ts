import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_MWST_RATE, DEFAULT_NEUKUNDEN_RABATT, computeOfferTotals } from "@/lib/offer-totals";

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
    rabatt_rate: number;
    rabatt: number;
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

const OFFER_STATUS = ["pending", "sent", "failed", "accepted"] as const;
const RECHNUNG_STATUS = ["none", "sent", "failed", "paid"] as const;

const UpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(OFFER_STATUS).optional(),
  rechnung_status: z.enum(RECHNUNG_STATUS).optional(),
  paid: z.boolean().optional(),
  accepted: z.boolean().optional(),
});

export const updateOfferStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateStatusSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const client = context.supabase as any;
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.rechnung_status) {
      patch.rechnung_status = data.rechnung_status;
      if (data.rechnung_status === "paid") {
        patch.paid_at = new Date().toISOString();
      }
    }
    if (data.paid === true) {
      patch.paid_at = new Date().toISOString();
      patch.rechnung_status = "paid";
    } else if (data.paid === false) {
      patch.paid_at = null;
      if (!data.rechnung_status) patch.rechnung_status = "sent";
    }
    if (data.accepted === true && !patch.status) {
      patch.status = "accepted";
      patch.accepted_at = new Date().toISOString();
    } else if (data.accepted === false) {
      patch.accepted_at = null;
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await client.from("offer_requests").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
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
    const { sendOfferEmail, renderInvoiceHtml, invoicePayUrl } = await import("@/lib/offer-email.server");
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
      pay_url: invoicePayUrl(offer.pay_token as string | null),
      paid: !!offer.paid_at,
    };

    const pdfBytes = await renderInvoicePdf(offer as never, (items ?? []) as never, invoice);

    const html = renderInvoiceHtml({
      ...(offer as any),
      rechnung_nr,
      rechnung_faellig_am: faellig.toISOString().slice(0, 10),
      pay_token: offer.pay_token as string | null,
      paid_at: offer.paid_at as string | null,
      bank_inhaber: invoice.bank_inhaber,
      bank_name: invoice.bank_name,
      bank_iban: invoice.bank_iban,
      bank_bic: invoice.bank_bic,
    });

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
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        rabatt_rate: z.number().min(0).max(100).optional(),
        mwst_rate: z.number().min(0).max(99).optional(),
        lieferkosten: z.number().min(0).max(1000000).optional(),
      })
      .parse(input),
  )
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
    const subtotal = Number(offer.subtotal);
    const rabattRate = data.rabatt_rate ?? Number(offer.rabatt_rate ?? DEFAULT_NEUKUNDEN_RABATT);
    const mwstRate = data.mwst_rate ?? Number(offer.mwst_rate ?? DEFAULT_MWST_RATE);
    const liefer = data.lieferkosten ?? Number(offer.lieferkosten ?? 0);
    const totals = computeOfferTotals({ subtotal, rabattRate, lieferkosten: liefer, mwstRate });
    const offerForRender = {
      ...offer,
      rabatt_rate: rabattRate,
      rabatt: totals.rabatt,
      mwst_rate: mwstRate,
      mwst: totals.mwst,
      lieferkosten: liefer,
      total: totals.total,
    };
    const bytes = await renderOfferPdf(offerForRender as never, (items ?? []) as never, acceptUrl);
    return { base64: toBase64(bytes), filename: `Angebot-${offer.angebot_nr}.pdf` };
  });

export const previewInvoicePdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InvoiceInputSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ base64: string; filename: string; rechnung_nr: string }> => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { renderInvoicePdf, toBase64 } = await import("@/lib/pdf.server");
    const { invoicePayUrl } = await import("@/lib/offer-email.server");
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
      pay_url: invoicePayUrl(offer.pay_token as string | null),
      paid: !!offer.paid_at,
    };
    const bytes = await renderInvoicePdf(offer as never, (items ?? []) as never, invoice);
    return { base64: toBase64(bytes), filename: `Rechnung-${rechnung_nr}.pdf`, rechnung_nr };
  });



export type ManualConfirmationRow = {
  id: string;
  created_at: string;
  beleg_art: string;
  beleg_nr: string;
  kunde_name: string | null;
  kunde_anschrift: string | null;
  total: number | null;
  ip: string | null;
  user_agent: string | null;
};

export const listManualConfirmations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { data, error } = await admin
      .from("manual_confirmations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as ManualConfirmationRow[] };
  });
