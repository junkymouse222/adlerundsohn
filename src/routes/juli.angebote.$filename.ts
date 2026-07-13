import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/juli/angebote/$filename")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const rawName = params.filename;
        if (!rawName || rawName.includes("/") || rawName.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        if (!rawName.toLowerCase().endsWith(".pdf")) {
          return new Response("Not found", { status: 404 });
        }

        const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const supabaseKey =
          process.env.SUPABASE_PUBLISHABLE_KEY ??
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
          return new Response("Server misconfigured", { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data, error } = await supabase.storage
          .from("angebote")
          .download(rawName);

        if (error || !data) {
          return new Response("Datei nicht gefunden", { status: 404 });
        }

        const url = new URL(request.url);
        const forceDownload =
          url.searchParams.has("download") || url.searchParams.has("dl");
        const disposition = forceDownload
          ? `attachment; filename="${rawName}"`
          : `inline; filename="${rawName}"`;

        const buffer = await data.arrayBuffer();
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": disposition,
            "Content-Length": String(buffer.byteLength),
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
