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

export const listOfferRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const client = context.supabase as any;
    const { data, error } = await client
      .from("offer_requests")
      .select("id, created_at, scheduled_send_at, sent_at, status, angebot_nr, customer_company, customer_name, customer_email, subtotal, total, error_message")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as Array<Record<string, unknown>> };
  });

export const getOfferRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
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
    return { offer: offer as Record<string, unknown>, items: (items ?? []) as Array<Record<string, unknown>> };
  });

export const resendOfferNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const client = context.supabase as any;
    // Schedule for immediate send by pg_cron next tick
    const { error } = await client
      .from("offer_requests")
      .update({ status: "pending", scheduled_send_at: new Date().toISOString(), error_message: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
