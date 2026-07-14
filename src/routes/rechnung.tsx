import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PRODUKTE, KATEGORIEN, type Produkt } from "@/lib/katalog";

const printStyles = `
  @page { margin: 0; size: auto; }
  @media print {
    body * { visibility: hidden; }
    .beleg, .beleg * { visibility: visible; }
    .beleg {
      position: absolute;
      inset: 0;
      margin: 0;
      padding: 16mm 18mm 20mm 18mm;
      width: 100%;
      min-height: 100%;
      box-sizing: border-box;
    }
    .no-print { display: none !important; }
    .print-only { display: inline; }
    .site-footer { display: none !important; }
  }
`;

export const Route = createFileRoute("/rechnung")({
  head: () => ({
    meta: [
      { title: "Angebots- & Rechnungsgenerator — Kanzlei Goldmann" },
      { name: "description", content: "Internes Tool zur Erstellung von Angeboten und Rechnungen aus dem Verwertungskatalog." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RechnungPage,
});

type Position = { produkt: Produkt; menge: number };

type BelegArt = "Angebot" | "Rechnung";

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

const heute = () => new Date().toISOString().slice(0, 10);

function RechnungPage() {
  const [belegArt, setBelegArt] = useState<BelegArt>("Angebot");
  const [belegNr, setBelegNr] = useState(
    () => `${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  );
  const [datum, setDatum] = useState(heute());
  const [bankName, setBankName] = useState("Sparkasse Trier");
  const [bankIban, setBankIban] = useState("DE00 0000 0000 0000 0000 00");
  const [bankBic, setBankBic] = useState("TRISDE55XXX");
  const [bankInhaber, setBankInhaber] = useState("Kanzlei Goldmann");
  const [gueltigBis, setGueltigBis] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [kundeName, setKundeName] = useState("");
  const [kundeAnschrift, setKundeAnschrift] = useState("");
  const [kundeUstId, setKundeUstId] = useState("");
  const [lieferName, setLieferName] = useState("");
  const [lieferAnschrift, setLieferAnschrift] = useState("");
  const [mwstSatz, setMwstSatz] = useState(19);
  const [rabatt, setRabatt] = useState(0);
  const [notizen, setNotizen] = useState(
    "Alle Positionen aus laufender Verwertung. Lieferung ab Bestellwert 3.000 € netto kostenfrei innerhalb des Liefergebiets. Zwischenverkauf vorbehalten.",
  );

  const [positionen, setPositionen] = useState<Position[]>([]);
  const [suche, setSuche] = useState("");
  const [kategorie, setKategorie] = useState<string>("");

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return PRODUKTE.filter((p) => {
      if (kategorie && p.kategorie !== kategorie) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.beschreibung.toLowerCase().includes(q) ||
        p.artikel.toLowerCase().includes(q) ||
        String(p.pos).includes(q)
      );
    });
  }, [suche, kategorie]);

  const addProdukt = (p: Produkt) => {
    setPositionen((prev) => {
      const idx = prev.findIndex((x) => x.produkt.pos === p.pos);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], menge: next[idx].menge + 1 };
        return next;
      }
      return [...prev, { produkt: p, menge: 1 }];
    });
  };

  const setMenge = (pos: number, menge: number) =>
    setPositionen((prev) =>
      prev.map((x) => (x.produkt.pos === pos ? { ...x, menge: Math.max(0, menge) } : x)),
    );

  const remove = (pos: number) =>
    setPositionen((prev) => prev.filter((x) => x.produkt.pos !== pos));

  const zwischensumme = positionen.reduce((s, x) => s + x.produkt.einzelpreis * x.menge, 0);
  const rabattBetrag = zwischensumme * (rabatt / 100);
  const netto = zwischensumme - rabattBetrag;
  const mwst = netto * (mwstSatz / 100);
  const brutto = netto + mwst;

  const drucken = () => window.print();

  return (
    <section className="container-prose py-12 md:py-16 print:py-0">
      <div className="no-print">
        <p className="eyebrow">Intern</p>
        <h1 className="mt-6 text-4xl md:text-5xl">Angebots- & Rechnungsgenerator</h1>
        <span className="rule-gold mt-6" />
        <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
          Wählen Sie Produkte aus dem Verwertungskatalog (124 Positionen) und erstellen Sie
          direkt ein Angebot oder eine Rechnung. Über „Drucken / PDF speichern" erhalten Sie
          ein druckfertiges Dokument.
        </p>
      </div>

      {/* ============ EDITOR ============ */}
      <div className="no-print mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Kopf */}
        <div className="space-y-6 bg-parchment p-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Belegart</span>
              <select
                value={belegArt}
                onChange={(e) => setBelegArt(e.target.value as BelegArt)}
                className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm"
              >
                <option>Angebot</option>
                <option>Rechnung</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Belegnummer</span>
              <input
                value={belegNr}
                onChange={(e) => setBelegNr(e.target.value)}
                className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Datum</span>
              <input
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                {belegArt === "Angebot" ? "Gültig bis" : "Fällig am"}
              </span>
              <input
                type="date"
                value={gueltigBis}
                onChange={(e) => setGueltigBis(e.target.value)}
                className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Kunde</span>
              <input
                value={kundeName}
                onChange={(e) => setKundeName(e.target.value)}
                placeholder="Firma / Name"
                className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <textarea
              value={kundeAnschrift}
              onChange={(e) => setKundeAnschrift(e.target.value)}
              placeholder="Straße, PLZ Ort, Land"
              rows={3}
              className="w-full border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={kundeUstId}
              onChange={(e) => setKundeUstId(e.target.value)}
              placeholder="USt-IdNr. (optional)"
              className="w-full border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Rabatt (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={rabatt}
                onChange={(e) => setRabatt(Number(e.target.value) || 0)}
                className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">MwSt (%)</span>
              <input
                type="number"
                min={0}
                max={99}
                step={0.5}
                value={mwstSatz}
                onChange={(e) => setMwstSatz(Number(e.target.value) || 0)}
                className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">Notizen</span>
            <textarea
              value={notizen}
              onChange={(e) => setNotizen(e.target.value)}
              rows={4}
              className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          {belegArt === "Rechnung" && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                Bankverbindung (nur Rechnung)
              </div>
              <input
                value={bankInhaber}
                onChange={(e) => setBankInhaber(e.target.value)}
                placeholder="Kontoinhaber"
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank"
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                placeholder="IBAN"
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={bankBic}
                onChange={(e) => setBankBic(e.target.value)}
                placeholder="BIC"
                className="w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        {/* Katalog */}
        <div className="bg-parchment p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="Katalog durchsuchen (Marke, Modell, Art.-Nr.) …"
              className="w-full border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              value={kategorie}
              onChange={(e) => setKategorie(e.target.value)}
              className="border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Alle Kategorien</option>
              {KATEGORIEN.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {gefiltert.length} von {PRODUKTE.length} Positionen
          </p>
          <div className="mt-4 max-h-[520px] overflow-y-auto border border-border">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border">
                  <th className="px-2 py-2 text-left">Pos.</th>
                  <th className="px-2 py-2 text-left">Bezeichnung</th>
                  <th className="px-2 py-2 text-right">Preis netto</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {gefiltert.map((p) => (
                  <tr key={p.pos} className="border-b border-border/60 hover:bg-background">
                    <td className="px-2 py-2 align-top text-muted-foreground">{p.pos}</td>
                    <td className="px-2 py-2 align-top">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-muted-foreground">
                        {p.artikel} · {p.beschreibung}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right align-top tabular-nums">
                      {fmtEUR(p.einzelpreis)}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => addProdukt(p)}
                        className="border border-gold px-2 py-1 text-[0.65rem] uppercase tracking-[0.15em] hover:bg-primary hover:text-primary-foreground"
                      >
                        + Hinzufügen
                      </button>
                    </td>
                  </tr>
                ))}
                {gefiltert.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-6 text-center text-muted-foreground">
                      Keine Treffer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Aktionen */}
      <div className="no-print mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={drucken}
          disabled={positionen.length === 0}
          className="bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Drucken / als PDF speichern
        </button>
        <button
          type="button"
          onClick={() => setPositionen([])}
          className="border border-border px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-parchment"
        >
          Positionen leeren
        </button>
      </div>

      {/* ============ BELEG (auch Bildschirm-Vorschau) ============ */}
      <article className="beleg mt-12 border border-border bg-background p-8 md:p-12 print:mt-0 print:border-0 print:p-0">
        <div className="beleg-header flex flex-wrap items-start justify-between gap-6 border-b border-gold pb-6">
          <div>
            <div className="text-2xl font-serif tracking-widest">G O L D M A N N</div>
            <div className="mt-1 text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
              Rechtsanwaltskanzlei · Berlin
            </div>
            <div className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Kanzlei Goldmann · Friedrichstraße 112 · 10117 Berlin
              <br />
              Telefon +49 6591 6659636 · info@kanzlei-goldmann.de
            </div>
          </div>
          <div className="text-right">
            <div className="text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">
              {belegArt}
            </div>
            <div className="mt-1 text-3xl font-serif">{belegNr}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Datum: {new Date(datum).toLocaleDateString("de-DE")}
              <br />
              {belegArt === "Angebot" ? "Gültig bis: " : "Fällig am: "}
              {new Date(gueltigBis).toLocaleDateString("de-DE")}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              Rechnungsempfänger
            </div>
            <div className="mt-2 whitespace-pre-line text-sm">
              {kundeName || "—"}
              {kundeAnschrift && "\n" + kundeAnschrift}
              {kundeUstId && "\nUSt-IdNr.: " + kundeUstId}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              Verwertungsverfahren
            </div>
            <div className="mt-2 text-sm">
              Bestandsliste vom 13. Juli 2026
              <br />
              Direktverkauf aus Insolvenzverfahren
            </div>
          </div>
        </div>

        <table className="mt-8 w-full border-collapse text-xs">
          <thead>
            <tr className="border-y border-border text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
              <th className="w-10 py-2 text-left">Pos.</th>
              <th className="py-2 text-left">Bezeichnung</th>
              <th className="w-20 py-2 text-right">Menge</th>
              <th className="w-16 py-2 text-left">Einh.</th>
              <th className="w-28 py-2 text-right">Einzel netto</th>
              <th className="w-28 py-2 text-right">Summe netto</th>
            </tr>
          </thead>
          <tbody>
            {positionen.map((x, i) => (
              <tr key={x.produkt.pos} className="border-b border-border/60 align-top">
                <td className="py-3 text-muted-foreground">{i + 1}</td>
                <td className="py-3 pr-3">
                  <div className="font-medium">{x.produkt.name}</div>
                  <div className="text-muted-foreground">
                    Art.-Nr. {x.produkt.artikel} · {x.produkt.beschreibung}
                  </div>
                </td>
                <td className="py-3 text-right tabular-nums">
                  <input
                    type="number"
                    min={0}
                    value={x.menge}
                    onChange={(e) => setMenge(x.produkt.pos, Number(e.target.value))}
                    className="no-print w-20 border border-border bg-background px-2 py-1 text-right"
                  />
                  <span className="print-only">{x.menge}</span>
                </td>
                <td className="py-3">{x.produkt.einheit}</td>
                <td className="py-3 text-right tabular-nums">{fmtEUR(x.produkt.einzelpreis)}</td>
                <td className="py-3 text-right tabular-nums">
                  {fmtEUR(x.produkt.einzelpreis * x.menge)}
                  <button
                    type="button"
                    onClick={() => remove(x.produkt.pos)}
                    className="no-print ml-3 text-[0.6rem] uppercase tracking-[0.15em] text-destructive"
                  >
                    entfernen
                  </button>
                </td>
              </tr>
            ))}
            {positionen.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">
                  Noch keine Positionen ausgewählt.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <table className="w-full max-w-sm text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-muted-foreground">Zwischensumme</td>
                <td className="py-1 text-right tabular-nums">{fmtEUR(zwischensumme)}</td>
              </tr>
              {rabatt > 0 && (
                <tr>
                  <td className="py-1 text-muted-foreground">Rabatt ({rabatt}%)</td>
                  <td className="py-1 text-right tabular-nums">−{fmtEUR(rabattBetrag)}</td>
                </tr>
              )}
              <tr className="border-t border-border">
                <td className="py-1 text-muted-foreground">Netto</td>
                <td className="py-1 text-right tabular-nums">{fmtEUR(netto)}</td>
              </tr>
              <tr>
                <td className="py-1 text-muted-foreground">zzgl. MwSt. ({mwstSatz}%)</td>
                <td className="py-1 text-right tabular-nums">{fmtEUR(mwst)}</td>
              </tr>
              <tr className="border-t border-gold">
                <td className="py-2 text-sm font-semibold uppercase tracking-[0.15em]">Gesamt</td>
                <td className="py-2 text-right tabular-nums font-semibold">{fmtEUR(brutto)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {notizen && (
          <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
            <div className="text-[0.65rem] uppercase tracking-[0.2em]">Hinweise</div>
            <p className="mt-2 whitespace-pre-line leading-relaxed">{notizen}</p>
          </div>
        )}

        {belegArt === "Rechnung" && (
          <div className="mt-8 grid gap-6 border-t border-border pt-6 text-xs sm:grid-cols-2">
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">Zahlungsbedingungen</div>
              <p className="mt-2 leading-relaxed">
                Bitte überweisen Sie den Rechnungsbetrag bis zum{" "}
                <strong>{new Date(gueltigBis).toLocaleDateString("de-DE")}</strong> auf das
                unten genannte Konto unter Angabe der Rechnungsnummer <strong>{belegNr}</strong>.
              </p>
            </div>
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">Bankverbindung</div>
              <div className="mt-2 space-y-0.5 leading-relaxed">
                <div>Kontoinhaber: <strong>{bankInhaber}</strong></div>
                <div>Bank: {bankName}</div>
                <div>IBAN: <span className="tabular-nums">{bankIban}</span></div>
                <div>BIC: <span className="tabular-nums">{bankBic}</span></div>
              </div>
            </div>
          </div>
        )}

        <div className="beleg-footer mt-10 border-t border-border pt-4 text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
          Kanzlei Goldmann · Friedrichstraße 112 · 10117 Berlin · +49 6591 6659636 · info@kanzlei-goldmann.de · USt-IdNr. DE271552088
        </div>
      </article>

      <style>{printStyles}</style>
    </section>
  );
}
