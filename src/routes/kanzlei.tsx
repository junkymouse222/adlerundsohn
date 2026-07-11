import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/kanzlei")({
  head: () => ({
    meta: [
      { title: "Die Kanzlei — Rechtsanwaltskanzlei Goldmann" },
      { name: "description", content: "Seit 1998 spezialisiert auf Insolvenzrecht und Insolvenzverwaltung. Erfahren Sie mehr über die Geschichte und Werte der Kanzlei Goldmann." },
      { property: "og:title", content: "Die Kanzlei — Rechtsanwaltskanzlei Goldmann" },
      { property: "og:description", content: "Erfahren Sie mehr über Geschichte und Werte der Kanzlei Goldmann." },
      { property: "og:url", content: "https://kanzlei-goldmann.de/kanzlei" },
    ],
    links: [{ rel: "canonical", href: "https://kanzlei-goldmann.de/kanzlei" }],
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
            Eine Kanzlei, geführt von einer klaren Überzeugung.
          </h1>
          <span className="rule-gold mt-8" />
        </div>
      </section>

      <section className="container-prose grid gap-16 py-24 md:grid-cols-[1fr_2fr] md:py-32">
        <p className="eyebrow">Über uns</p>
        <div className="space-y-6 text-lg leading-relaxed text-foreground/85">
          <p>
            Die Rechtsanwaltskanzlei Goldmann wurde 1998 in Berlin von Dr.
            Friedrich Goldmann gegründet. Aus einer Einzelkanzlei mit Fokus auf
            klassisches Wirtschafts- und Insolvenzrecht ist über die
            Jahrzehnte eine spezialisierte Sozietät gewachsen, die heute
            Mandanten aus ganz Deutschland betreut.
          </p>
          <p>
            Wir haben uns bewusst gegen die Breite entschieden — und für die
            Tiefe. Insolvenzrecht ist kein Randgebiet unserer Arbeit; es ist
            unser Handwerk. Diese Konzentration erlaubt uns, komplexe
            Verfahren mit einer Präzision zu führen, die Mandantinnen und
            Mandanten in wirtschaftlich herausfordernden Situationen die
            nötige Sicherheit gibt.
          </p>
          <p>
            Unsere Anwältinnen und Anwälte werden regelmäßig als
            Insolvenzverwalter, Sachwalter und Treuhänder von den
            Amtsgerichten Berlin-Charlottenburg, Potsdam und Frankfurt (Oder)
            bestellt.
          </p>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="container-prose py-24 md:py-32">
          <p className="text-[0.7rem] uppercase tracking-[0.24em] text-gold">Unsere Werte</p>
          <h2 className="mt-4 max-w-2xl font-serif text-4xl text-primary-foreground md:text-5xl">
            Drei Prinzipien, die jede Mandatsbeziehung tragen.
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                num: "01",
                title: "Diskretion",
                text: "Eine Insolvenz berührt existenzielle Fragen — persönliche wie unternehmerische. Wir arbeiten mit größter Verschwiegenheit und stellen sicher, dass sensible Informationen ausschließlich in dafür berechtigten Händen liegen.",
              },
              {
                num: "02",
                title: "Struktur",
                text: "Verfahren scheitern selten am Recht — meist an fehlender Ordnung. Wir bringen von Beginn an klare Prozesse, dokumentierte Entscheidungswege und eine belastbare Kommunikation mit allen Beteiligten.",
              },
              {
                num: "03",
                title: "Weitblick",
                text: "Jede Insolvenz ist ein Übergang. Unser Rat richtet sich nicht nur auf den Abschluss des Verfahrens, sondern auf die Zeit danach — für Unternehmensfortführungen ebenso wie für Neuanfänge.",
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
            <p className="eyebrow">Chronik</p>
            <h2 className="mt-4 text-4xl md:text-5xl">Meilensteine</h2>
            <span className="rule-gold mt-6" />
          </div>
          <div className="space-y-10">
            {[
              ["1998", "Gründung der Einzelkanzlei durch Dr. Friedrich Goldmann in Berlin-Mitte."],
              ["2003", "Erste Bestellung als Insolvenzverwalter am Amtsgericht Berlin-Charlottenburg."],
              ["2011", "Erweiterung um Anwältin Dr. Katharina Weber, Schwerpunkt Sanierungs- und Restrukturierungsrecht."],
              ["2017", "Aufnahme in den VID Verband Insolvenzverwalter Deutschlands e.V."],
              ["2020", "Eintritt von Marcus Hartmann, Fachanwalt für Handels- und Gesellschaftsrecht."],
              ["2024", "Bezug der heutigen Kanzleiräume in der Friedrichstraße."],
            ].map(([year, text]) => (
              <div key={year} className="grid grid-cols-[6rem_1fr] gap-6 border-b border-border pb-8 last:border-b-0">
                <p className="font-serif text-2xl text-gold">{year}</p>
                <p className="text-base leading-relaxed text-foreground/80">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-prose pb-24">
        <div className="border border-border p-10 text-center md:p-16">
          <h2 className="text-3xl md:text-4xl">Möchten Sie unser Team persönlich kennenlernen?</h2>
          <Link to="/anwaelte" className="mt-8 inline-block bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90">
            Zu den Anwälten
          </Link>
        </div>
      </section>
    </>
  );
}
