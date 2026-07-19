import { createFileRoute } from "@tanstack/react-router";
import { sendOfferEmail } from "@/lib/offer-email.server";

export const Route = createFileRoute("/api/public/test-resend")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const to = url.searchParams.get("to");
        if (!to) return new Response("missing ?to=", { status: 400 });
        const start = Date.now();
        const result = await sendOfferEmail({
          to,
          subject: "Resend Testmail Lovable",
          html: `<p>Test von Lovable um ${new Date().toISOString()}</p>`,
        });
        return Response.json({ ms: Date.now() - start, result });
      },
    },
  },
});
