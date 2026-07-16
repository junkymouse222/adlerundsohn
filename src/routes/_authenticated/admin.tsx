import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listOfferRequests, type OfferListRow } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Angebotsanfragen" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminListPage,
});

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(n));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });

function AdminListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<OfferListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "sent" | "failed">("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listOfferRequests();
      setRows(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <section className="container-prose py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 text-4xl">Angebotsanfragen</h1>
          <span className="rule-gold mt-4" />
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          Abmelden
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["all", "pending", "sent", "failed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`border px-4 py-2 text-xs uppercase tracking-widest ${
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {f === "all" ? "Alle" : f === "pending" ? "Offen" : f === "sent" ? "Gesendet" : "Fehlgeschlagen"}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          Aktualisieren
        </button>
      </div>

      {loading && <p className="mt-8 text-sm text-muted-foreground">Lade …</p>}
      {error && <p className="mt-8 text-sm text-red-700">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-parchment text-xs uppercase tracking-widest text-muted-foreground">
                <th className="p-3 text-left">Datum</th>
                <th className="p-3 text-left">Nr.</th>
                <th className="p-3 text-left">Kunde</th>
                <th className="p-3 text-left">E-Mail</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Versand</th>
                <th className="p-3 text-right">Summe</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-parchment">
                  <td className="p-3 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="p-3 font-mono text-xs">
                    <Link to="/admin/$id" params={{ id: r.id }} className="text-primary underline">
                      {r.angebot_nr}
                    </Link>
                  </td>
                  <td className="p-3">
                    <div>{r.customer_company || r.customer_name}</div>
                    {r.customer_company && <div className="text-xs text-muted-foreground">{r.customer_name}</div>}
                  </td>
                  <td className="p-3 text-xs">{r.customer_email}</td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                    {r.error_message && (
                      <div className="mt-1 text-[0.7rem] text-red-700">{r.error_message}</div>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                    {r.sent_at ? `gesendet ${fmtDate(r.sent_at)}` : `geplant ${fmtDate(r.scheduled_send_at)}`}
                  </td>
                  <td className="p-3 text-right font-medium">{fmtEUR(r.total)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">
                    Keine Einträge.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "sent" ? "Gesendet" : status === "failed" ? "Fehler" : "Offen";
  const cls =
    status === "sent"
      ? "border-green-700 text-green-800"
      : status === "failed"
      ? "border-red-700 text-red-700"
      : "border-gold text-primary";
  return (
    <span className={`inline-block border px-2 py-0.5 text-[0.65rem] uppercase tracking-widest ${cls}`}>
      {label}
    </span>
  );
}
