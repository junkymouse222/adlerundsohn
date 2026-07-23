import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listPageViews, type TrafficStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/traffic")({
  head: () => ({
    meta: [
      { title: "Admin — Traffic" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TrafficPage,
});

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border bg-parchment p-6">
      <p className="text-[0.7rem] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-3xl text-primary">{value}</p>
    </div>
  );
}

function TopList({
  title,
  items,
  keyName,
}: {
  title: string;
  items: Array<Record<string, string | number> & { count: number }>;
  keyName: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="border border-border">
      <div className="border-b border-border bg-parchment px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <ul className="divide-y divide-border">
        {items.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">Keine Daten.</li>
        )}
        {items.map((row, i) => (
          <li key={i} className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate pr-3">{String(row[keyName]) || "—"}</span>
              <span className="font-mono text-xs">{row.count}</span>
            </div>
            <div className="mt-1 h-1 w-full bg-border">
              <div
                className="h-1 bg-gold"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrafficPage() {
  const [stats, setStats] = useState<TrafficStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listPageViews();
      setStats(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="container-prose py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 text-4xl">Traffic</h1>
          <span className="rule-gold mt-4" />
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Besucher der Website — Herkunft (IP/Land), Referrer und aufgerufene Seiten.
            Ausgewertete Zeitspanne: letzte 7 Tage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            Aktualisieren
          </button>
          <Link
            to="/admin"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            ← Anfragen
          </Link>
        </div>
      </div>

      {loading && <p className="mt-8 text-sm text-muted-foreground">Lade …</p>}
      {error && <p className="mt-8 text-sm text-red-700">{error}</p>}

      {!loading && !error && stats && (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard label="Gesamt" value={stats.total.toLocaleString("de-DE")} />
            <StatCard label="Letzte 24h" value={stats.last24h.toLocaleString("de-DE")} />
            <StatCard label="Letzte 7 Tage" value={stats.last7d.toLocaleString("de-DE")} />
            <StatCard label="Unique IPs (7T)" value={stats.uniqueIps.toLocaleString("de-DE")} />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <TopList title="Top Länder" items={stats.topCountries} keyName="country" />
            <TopList title="Top Seiten" items={stats.topPaths} keyName="path" />
            <TopList title="Top Referrer" items={stats.topReferrers} keyName="referrer" />
          </div>

          <h2 className="mt-12 font-serif text-2xl">Letzte Besuche</h2>
          <span className="rule-gold mt-3" />
          <div className="mt-6 overflow-x-auto border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-parchment text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="p-3 text-left">Zeit</th>
                  <th className="p-3 text-left">Land</th>
                  <th className="p-3 text-left">IP</th>
                  <th className="p-3 text-left">Seite</th>
                  <th className="p-3 text-left">Referrer</th>
                  <th className="p-3 text-left">User-Agent</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-parchment">
                    <td className="p-3 whitespace-nowrap text-xs">{fmtDate(r.created_at)}</td>
                    <td className="p-3 text-xs">
                      {r.country_code && (
                        <span className="mr-1 font-mono text-[0.65rem] text-muted-foreground">
                          {r.country_code}
                        </span>
                      )}
                      {r.country || "—"}
                    </td>
                    <td className="p-3 font-mono text-xs">{r.ip || "—"}</td>
                    <td className="p-3 font-mono text-xs">{r.path}</td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate" title={r.referrer || ""}>
                      {r.referrer || "Direkt"}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[240px] truncate" title={r.user_agent || ""}>
                      {r.user_agent || "—"}
                    </td>
                  </tr>
                ))}
                {stats.recent.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                      Noch keine Besuche erfasst.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
