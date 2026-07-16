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
      .select("id, created_at, scheduled_send_at, sent_at, status, angebot_nr, customer_company, customer_name, customer_email, subtotal, total, error_message")
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
    const { renderOfferHtml, sendOfferEmail } = await import("@/lib/offer-email.server");
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

    const html = renderOfferHtml(offer as never, (items ?? []) as never);
    const pdfBytes = await renderOfferPdf(offer as never, (items ?? []) as never);

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

function nextRechnungNr(): string {
  const year = new Date().getFullYear();
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  return `R-${year}-${rnd}`;
}

export const sendInvoiceNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        faellig_tage: z.number().int().min(1).max(120).optional(),
      })
      .parse(input),
  )
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
      bank_inhaber: process.env.BANK_INHABER || "Kanzlei Adler und Sohn",
      bank_name: process.env.BANK_NAME || "Sparkasse Trier",
      bank_iban: process.env.BANK_IBAN || "DE00 0000 0000 0000 0000 00",
      bank_bic: process.env.BANK_BIC || "TRISDE55XXX",
    };

    const pdfBytes = await renderInvoicePdf(offer as never, (items ?? []) as never, invoice);

    const html = `<!doctype html><html lang="de"><body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111;background:#fff;padding:24px;max-width:640px;margin:0 auto;">
      <p>Sehr geehrte Damen und Herren,</p>
      <p>anbei erhalten Sie unsere Rechnung <strong>${rechnung_nr}</strong> zu Ihrem Angebot ${offer.angebot_nr}.</p>
      <p>Bitte überweisen Sie den Rechnungsbetrag von <strong>${new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(offer.total))}</strong> unter Angabe der Rechnungsnummer bis zum <strong>${faellig.toLocaleDateString("de-DE")}</strong>.</p>
      <p>Mit freundlichen Grüßen<br/>Kanzlei Adler und Sohn</p>
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
      })
      .eq("id", data.id);

    return { ok: true, messageId: send.messageId, rechnung_nr };
  });

