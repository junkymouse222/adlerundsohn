import { createFileRoute } from "@tanstack/react-router";

// TEMP: Test-Endpoint zum Prüfen des Resend-Versands.
export const Route = createFileRoute("/api/public/hooks/test-send")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const to = url.searchParams.get("to") || "info@adlerundsohn.com";
        const { sendOfferEmail } = await import("@/lib/offer-email.server");
        const res = await sendOfferEmail({
          to,
          subject: "Test: Absender-Konfiguration adlerundsohn-mail.de",
          html: `<p>Testmail vom neuen Absender <strong>info@adlerundsohn-mail.de</strong>. Zeit: ${new Date().toISOString()}</p>`,
        });
        return Response.json(res);
      },
    },
  },
});
