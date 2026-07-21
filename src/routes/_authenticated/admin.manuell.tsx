import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listManualConfirmations, type ManualConfirmationRow } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/manuell")({
  head: () => ({
    meta: [
      { title: "Admin — Manuelle Bestätigungen" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ManualConfirmationsPage,
});

const fmtEUR = (n: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(n));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });

function ManualConfirmationsPage() {
  const [rows, setRows] = useState<ManualConfirmationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "Angebot" | "Rechnung">("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listManualConfirmations();
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

  const filtered = filter === "all" ? rows : rows.filter((r) => r.beleg_art === filter);

  return (
    <section className="container-prose py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 text-4xl">Manuelle Bestätigungen</h1>
          <span className="rule-gold mt-4" />
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Bestätigungen von Kunden auf manuell erstellten Belegen (<Link to="/rechnung" className="underline">/rechnung</Link>).
            Für automatisch versendete Angebote/Rechnungen siehe{" "}
            <Link to="/admin" className="underline">Angebotsanfragen</Link>.
          </p>
        </div>
        <Link
          to="/admin"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          ← Anfragen
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["all", "Angebot", "Rechnung"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`border px-4 py-2 text-xs uppercase tracking-widest ${
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {f === "all" ? "Alle" : f === "Angebot" ? "Angebote angenommen" : "Rechnungen bezahlt"}
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
                <th className="p-3 text-left">Art</th>
                <th className="p-3 text-left">Beleg-Nr.</th>
                <th className="p-3 text-left">Kunde</th>
                <th className="p-3 text-right">Summe</th>
                <th className="p-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-parchment">
                  <td className="p-3 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block border px-2 py-0.5 text-[0.65rem] uppercase tracking-widest ${
                        r.beleg_art === "Rechnung"
                          ? "border-green-700 text-green-800"
                          : "border-gold text-primary"
                      }`}
                    >
                      {r.beleg_art === "Rechnung" ? "Bezahlt" : "Angenommen"}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs">{r.beleg_nr}</td>
                  <td className="p-3">
                    <div>{r.kunde_name || "—"}</div>
                    {r.kunde_anschrift && (
                      <div className="text-xs text-muted-foreground">{r.kunde_anschrift}</div>
                    )}
                  </td>
                  <td className="p-3 text-right font-medium">{fmtEUR(r.total)}</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.ip || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                    Keine Bestätigungen.
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
