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
    const send = await sendOfferEmail({
      to: offer.customer_email as string,
      subject: `Ihr Angebot ${offer.angebot_nr as string} — Kanzlei Adler und Sohn`,
      html,
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
