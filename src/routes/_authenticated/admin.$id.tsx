import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getOfferRequest, resendOfferNow, sendInvoiceNow, type OfferDetail } from "@/lib/admin.functions";


export const Route = createFileRoute("/_authenticated/admin/$id")({
  head: () => ({
    meta: [
      { title: "Angebot Detail — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDetailPage,
});

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(n));
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }) : "—";

function AdminDetailPage() {
  const { id } = Route.useParams();
  const [detail, setDetail] = useState<OfferDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [invoicing, setInvoicing] = useState(false);
  const [invoiceConfirmOpen, setInvoiceConfirmOpen] = useState(false);
  const [faelligTage, setFaelligTage] = useState(14);
  const [invoiceResult, setInvoiceResult] = useState<{ ok: boolean; msg: string } | null>(null);


  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getOfferRequest({ data: { id } });
      setDetail(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleResendConfirmed() {
    setConfirmOpen(false);
    setResending(true);
    setSendResult(null);
    try {
      const res = await resendOfferNow({ data: { id } });
      await load();
      setSendResult({ ok: true, msg: `Angebot versendet${res.messageId ? ` (ID: ${res.messageId})` : ""}.` });
    } catch (e) {
      setSendResult({ ok: false, msg: e instanceof Error ? e.message : "Fehler beim Senden." });
    } finally {
      setResending(false);
  }

  async function handleInvoiceConfirmed() {
    setInvoiceConfirmOpen(false);
    setInvoicing(true);
    setInvoiceResult(null);
    try {
      const res = await sendInvoiceNow({ data: { id, faellig_tage: faelligTage } });
      await load();
      setInvoiceResult({ ok: true, msg: `Rechnung ${res.rechnung_nr} versendet${res.messageId ? ` (ID: ${res.messageId})` : ""}.` });
    } catch (e) {
      setInvoiceResult({ ok: false, msg: e instanceof Error ? e.message : "Fehler beim Rechnungsversand." });
    } finally {
      setInvoicing(false);
    }
  }

  }

  if (loading) return <section className="container-prose py-16 text-sm text-muted-foreground">Lade …</section>;
  if (error) return <section className="container-prose py-16 text-sm text-red-700">{error}</section>;
  if (!detail) return null;

  const { offer, items } = detail;

  return (
    <section className="container-prose py-16">
      <Link to="/admin" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
        ← Zurück zur Liste
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Angebot</p>
          <h1 className="mt-2 font-mono text-3xl">{offer.angebot_nr}</h1>
          <span className="rule-gold mt-4" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={resending}
            className="bg-primary px-6 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {resending ? "Wird gesendet …" : "Angebot senden (PDF)"}
          </button>
          <button
            onClick={() => setInvoiceConfirmOpen(true)}
            disabled={invoicing}
            className="border border-gold bg-parchment px-6 py-3 text-xs uppercase tracking-[0.2em] text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
          >
            {invoicing ? "Wird gesendet …" : offer.rechnung_status === "sent" ? "Rechnung erneut senden" : "Rechnung senden"}
          </button>
        </div>
      </div>


      {sendResult && (
        <div
          className={`mt-6 border p-4 text-sm ${
            sendResult.ok ? "border-green-700 bg-green-50 text-green-900" : "border-red-700 bg-red-50 text-red-800"
          }`}
        >
          {sendResult.msg}
        </div>
      )}

      {confirmOpen && (
        <div className="mt-6 border border-gold bg-parchment p-4 text-sm">
          <p className="mb-3">Angebot jetzt per E-Mail an <strong>{offer.customer_email}</strong> senden?</p>
          <div className="flex gap-2">
            <button
              onClick={handleResendConfirmed}
              className="bg-primary px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
            >
              Ja, senden
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              className="border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {invoiceResult && (
        <div
          className={`mt-6 border p-4 text-sm ${
            invoiceResult.ok ? "border-green-700 bg-green-50 text-green-900" : "border-red-700 bg-red-50 text-red-800"
          }`}
        >
          {invoiceResult.msg}
        </div>
      )}

      {invoiceConfirmOpen && (
        <div className="mt-6 border border-gold bg-parchment p-4 text-sm">
          <p className="mb-3">
            Rechnung über <strong>{fmtEUR(offer.total)}</strong> automatisch generieren und als PDF an{" "}
            <strong>{offer.customer_email}</strong> senden?
          </p>
          <label className="mb-3 flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Zahlungsziel (Tage)</span>
            <input
              type="number"
              min={1}
              max={120}
              value={faelligTage}
              onChange={(e) => setFaelligTage(Number(e.target.value) || 14)}
              className="w-20 border border-border bg-background px-2 py-1 text-sm"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleInvoiceConfirmed}
              className="bg-primary px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
            >
              Ja, Rechnung senden
            </button>
            <button
              onClick={() => setInvoiceConfirmOpen(false)}
              className="border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}


      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="border border-border p-6">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Kunde</h2>
          <div className="mt-4 space-y-1 text-sm">
            {offer.customer_company && <div className="font-semibold">{offer.customer_company}</div>}
            <div>{offer.customer_name}</div>
            <div className="whitespace-pre-line text-muted-foreground">{offer.customer_address}</div>
            <div><a href={`mailto:${offer.customer_email}`} className="underline">{offer.customer_email}</a></div>
            {offer.customer_phone && <div>{offer.customer_phone}</div>}
            {offer.customer_ust_id && <div className="text-xs text-muted-foreground">USt-IdNr.: {offer.customer_ust_id}</div>}
          </div>
        </div>

        <div className="border border-border p-6">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Status</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd>{offer.status}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Erstellt</dt><dd>{fmtDate(offer.created_at)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Geplant</dt><dd>{fmtDate(offer.scheduled_send_at)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Gesendet</dt><dd>{fmtDate(offer.sent_at)}</dd></div>
            {offer.ref_source && <div className="flex justify-between"><dt className="text-muted-foreground">Quelle</dt><dd className="font-mono text-xs">{offer.ref_source}</dd></div>}
            {offer.resend_message_id && <div className="flex justify-between"><dt className="text-muted-foreground">Resend-ID</dt><dd className="font-mono text-xs">{offer.resend_message_id}</dd></div>}
            {offer.error_message && <div className="mt-2 border-t border-border pt-2 text-red-700">{offer.error_message}</div>}
          </dl>
        </div>
      </div>

      {offer.message && (
        <div className="mt-6 border-l-4 border-gold bg-parchment p-4 text-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Nachricht des Kunden</div>
          <p className="mt-2 whitespace-pre-line">{offer.message}</p>
        </div>
      )}

      <h2 className="mt-10 text-2xl">Positionen</h2>
      <span className="rule-gold mt-4" />
      <div className="mt-6 overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-parchment text-xs uppercase tracking-widest text-muted-foreground">
              <th className="p-3 text-left">Pos.</th>
              <th className="p-3 text-left">Artikel</th>
              <th className="p-3 text-left">Bezeichnung</th>
              <th className="p-3 text-right">Menge</th>
              <th className="p-3 text-right">Einzelpreis</th>
              <th className="p-3 text-right">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-border">
                <td className="p-3">{it.pos}</td>
                <td className="p-3 font-mono text-xs">{it.artikel}</td>
                <td className="p-3">
                  <div>{it.name}</div>
                  {it.beschreibung && <div className="text-xs text-muted-foreground">{it.beschreibung}</div>}
                </td>
                <td className="p-3 text-right">{it.menge} {it.einheit}</td>
                <td className="p-3 text-right">{fmtEUR(it.einzelpreis)}</td>
                <td className="p-3 text-right font-medium">{fmtEUR(it.position_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-2 md:ml-auto md:w-80 text-sm">
        <Row label="Zwischensumme" value={fmtEUR(offer.subtotal)} />
        <Row label="Lieferkosten" value={fmtEUR(offer.lieferkosten)} />
        <Row label={`zzgl. ${Number(offer.mwst_rate)}% MwSt.`} value={fmtEUR(offer.mwst)} />
        <div className="border-t border-border pt-2 font-semibold">
          <Row label="Gesamtbetrag" value={fmtEUR(offer.total)} />
        </div>
      </div>

      {offer.offer_html && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm uppercase tracking-widest text-muted-foreground">
            Gesendetes HTML-Angebot anzeigen
          </summary>
          <div className="mt-4 border border-border">
            <iframe
              title="Angebots-HTML"
              srcDoc={offer.offer_html}
              className="h-[800px] w-full bg-white"
            />
          </div>
        </details>
      )}
    </section>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
