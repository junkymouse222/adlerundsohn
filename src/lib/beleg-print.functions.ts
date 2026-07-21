import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Lädt einen Angebot- oder Rechnungs-Beleg anhand des jeweiligen Tokens
// (accept_token für Angebote, pay_token für Rechnungen). Öffentlich, aber
// durch das unbekannte Token effektiv nur vom Empfänger nutzbar.
export const loadBelegByToken = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        art: z.enum(["angebot", "rechnung"]),
        token: z.string().min(8),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
            order: (col: string, o: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
          };
        };
      };
    };

    const col = data.art === "angebot" ? "accept_token" : "pay_token";
    const { data: offer, error } = await admin
      .from("offer_requests")
      .select("*")
      .eq(col, data.token)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!offer) throw new Error("Beleg nicht gefunden");

    const { data: items, error: itemsErr } = await admin
      .from("offer_request_items")
      .select("*")
      .eq("request_id", offer.id as string)
      .order("pos", { ascending: true });

    if (itemsErr) throw new Error(itemsErr.message);

    return { offer, items: items ?? [] };
  });
