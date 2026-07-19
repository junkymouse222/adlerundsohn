import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/admin/send-offer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { AdminSendError, sendOfferFromAdmin } = await import("@/lib/admin-send.server");
        try {
          const body = await request.json();
          return Response.json(await sendOfferFromAdmin(request, body));
        } catch (error) {
          const status = error instanceof AdminSendError ? error.status : 500;
          const message = error instanceof Error ? error.message : "Senden fehlgeschlagen.";
          console.error("[admin-send-offer]", message);
          return Response.json({ ok: false, error: message }, { status });
        }
      },
    },
  },
});