import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/kanzlei")({
  head: () => ({
    meta: [
      { title: "Die Kanzlei — Kanzlei Laumann" },
      { name: "description", content: "Erik Laumann, Rechtsanwalt und Insolvenzverwalter in Düsseldorf. Verwertung aus der Insolvenzmasse — Ablauf, Konditionen und Grundsätze." },
      { property: "og:title", content: "Die Kanzlei — Kanzlei Laumann" },
      { property: "og:description", content: "Verwertung aus der Insolvenzmasse — Ablauf, Konditionen und Grundsätze." },
      { property: "og:url", content: `${SITE.baseUrl}/kanzlei` },
    ],
    links: [{ rel: "canonical", href: `${SITE.baseUrl}/kanzlei` }],
  }),
  component: KanzleiPage,
});

function KanzleiPage() {
  return (
    <>
      <section className="border-b border-border bg-parchment">
        <div className="container-prose py-24 md:py-32">
          <p className="eyebrow">Die Kanzlei</p>
          <h1 className="mt-6 max-w-3xl text-5xl md:text-6xl">
            Verwertung aus der Insolvenzmasse — geordnet und transparent.
          </h1>
          <span className="rule-gold mt-8" />
        </div>
      </section>

      <section className="container-prose grid gap-16 py-24 md:grid-cols-[1fr_2fr] md:py-32">
        <p className="eyebrow">Zum Verkauf</p>
        <div className="space-y-6 text-lg leading-relaxed text-foreground/85">
          <p>
            Die aufgeführten Gegenstände stammen unmittelbar aus dem Bestand
            eines insolventen Unternehmens: Premium-Büromöbel namhafter Hersteller
            wie Herman Miller, Vitra, USM und Wilkhahn, moderne IT-Ausstattung
            von Apple sowie professionelle Kaffeevollautomaten von WMF und
            La Marzocco.
          </p>
          <p>
            Es handelt sich, sofern nicht anders vermerkt, ausnahmslos um
            originalverpackte Neuware in technisch einwandfreiem Zustand.
            Sämtliche Artikel werden mit ordnungsgemäßer Rechnung und
            ausgewiesener Mehrwertsteuer verkauft.
          </p>
          <p>
            Der Erwerb aus der Insolvenzmasse bietet die Gelegenheit, hochwertige
            Designmöbel und Geräte zu einem Bruchteil des regulären Marktpreises
            zu erwerben. Aufgrund der begrenzten Verfügbarkeit ist eine zeitnahe
            Rückmeldung empfehlenswert.
          </p>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container-prose py-24 md:py-32">
          <p className="text-[0.7rem] uppercase tracking-[0.24em] text-gold">Unsere Grundsätze</p>
          <h2 className="mt-4 max-w-2xl font-serif text-4xl text-primary-foreground md:text-5xl">
            Drei Prinzipien, die jede Verwertung tragen.
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                num: "01",
                title: "Vertraulichkeit",
                text: "Jede Anfrage wird vertraulich behandelt und in der Reihenfolge ihres Eingangs bearbeitet. Verbindlich wird ein Erwerb erst mit schriftlicher Bestätigung.",
              },
              {
                num: "02",
                title: "Gläubigerinteresse",
                text: "Als gerichtlich bestellter Insolvenzverwalter ist es meine Aufgabe, die Insolvenzmasse bestmöglich im Interesse aller Gläubiger zu verwerten.",
              },
              {
                num: "03",
                title: "Ordnungsmäßigkeit",
                text: "Verkauf mit ordnungsgemäßer, vorsteuerabzugsfähiger Rechnung und ausgewiesener Mehrwertsteuer. Alle Preise netto zzgl. gesetzlicher MwSt.",
              },
            ].map((v) => (
              <div key={v.num}>
                <p className="font-serif text-3xl text-gold">{v.num}</p>
                <h3 className="mt-4 text-2xl text-primary-foreground">{v.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-prose py-24 md:py-32">
        <div className="grid gap-16 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">So kommen Sie zum Artikel</p>
            <h2 className="mt-4 text-4xl md:text-5xl">Ablauf &amp; Konditionen</h2>
            <span className="rule-gold mt-6" />
          </div>
          <div className="space-y-10">
            {[
              ["01", "Kontaktanfrage über die Webseite", "Am einfachsten über die Schaltfläche „Angebot anfordern“ — direkt zu unserem Formular. Bitte Losnummer, Produktbezeichnung und Stückzahl angeben. Alternativ per E-Mail."],
              ["02", "Bestätigung & Reservierung", "Sie erhalten eine schriftliche Bestätigung der Verfügbarkeit. Erst damit ist der Artikel für Sie reserviert."],
              ["03", "Rechnung & Zahlung", "Verkauf mit ordnungsgemäßer Rechnung und ausgewiesener Mehrwertsteuer, zahlbar vor Übergabe."],
              ["04", "Abholung oder Versand", "Abholung am Lagerort nach Terminvereinbarung. Versand ab 1.000 € Warenwert frei Haus, darunter pauschal 29 €."],
            ].map(([num, title, text]) => (
              <div key={num} className="grid grid-cols-[3rem_1fr] gap-6 border-b border-border pb-8 last:border-b-0">
                <p className="font-serif text-2xl text-gold">{num}</p>
                <div>
                  <h3 className="text-xl">{title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-foreground/80">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-prose pb-24">
        <div className="border border-border p-10 text-center md:p-16">
          <h2 className="text-3xl md:text-4xl">Bereit, eine Anfrage zu stellen?</h2>
          <Link to="/angebot-anfordern" search={{ ref: undefined }} className="mt-8 inline-block bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90">
            Angebot anfordern
          </Link>
        </div>
      </section>
    </>
  );
}
