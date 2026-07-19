import { createFileRoute } from "@tanstack/react-router";

// TEMP: Test-Endpoint zum Prüfen des Resend-Versands.
export const Route = createFileRoute("/api/public/hooks/test-send")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const to = url.searchParams.get("to") || "info@adlerundsohn.com";
        const mode = url.searchParams.get("mode") || "gateway";
        const RESEND_API_KEY = process.env.RESEND_API_KEY!;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY!;
        const from = "Kanzlei Adler und Sohn <info@adlerundsohn-mail.de>";
        const payload = {
          from,
          to: [to],
          subject: "Test: Absender adlerundsohn-mail.de",
          html: `<p>Testmail ${new Date().toISOString()}</p>`,
        };
        let endpoint: string;
        let headers: Record<string, string>;
        if (mode === "direct") {
          endpoint = "https://api.resend.com/emails";
          headers = { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` };
        } else {
          endpoint = "https://connector-gateway.lovable.dev/resend/emails";
          headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          };
        }
        const res = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(payload) });
        const text = await res.text();
        return Response.json({ mode, status: res.status, body: text });
      },
    },
  },
});
