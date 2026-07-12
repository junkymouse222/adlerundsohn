import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum — Rechtsanwaltskanzlei Goldmann" },
      { name: "description", content: "Impressum und Angaben gemäß § 5 TMG der Rechtsanwaltskanzlei Goldmann." },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: "https://kanzlei-goldmann.de/impressum" },
    ],
    links: [{ rel: "canonical", href: "https://kanzlei-goldmann.de/impressum" }],
  }),
  component: ImpressumPage,
});

function ImpressumPage() {
  return (
    <section className="container-prose py-24 md:py-32">
      <p className="eyebrow">Rechtliches</p>
      <h1 className="mt-6 text-5xl md:text-6xl">Impressum</h1>
      <span className="rule-gold mt-8" />

      <div className="mt-16 grid gap-12 md:grid-cols-[1fr_2fr]">
        <div className="space-y-10 text-sm leading-relaxed text-foreground/85">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">Anbieter</p>
            <p className="mt-3">Rechtsanwaltskanzlei Goldmann<br />Dr. Friedrich Goldmann<br />Friedrichstraße 112<br />10117 Berlin</p>
          </div>
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">Kontakt</p>
            <p className="mt-3">Telefon: +49 6591 6659636<br />Telefax: +49 (0)30 40 55 12 91<br />E-Mail: info@kanzlei-goldmann.de</p>
          </div>
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">USt-IdNr.</p>
            <p className="mt-3">DE 271 552 088</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <div>
            <h2 className="text-2xl">Berufsrechtliche Angaben</h2>
            <p className="mt-4">
              Die in der Kanzlei tätigen Rechtsanwältinnen und Rechtsanwälte
              sind in der Bundesrepublik Deutschland zugelassen und Mitglieder
              der Rechtsanwaltskammer Berlin, Littenstraße 9, 10179 Berlin.
            </p>
            <p className="mt-4">Es gelten folgende berufsrechtliche Regelungen:</p>
            <ul className="mt-3 space-y-1 pl-4">
              <li>· Bundesrechtsanwaltsordnung (BRAO)</li>
              <li>· Berufsordnung der Rechtsanwälte (BORA)</li>
              <li>· Fachanwaltsordnung (FAO)</li>
              <li>· Rechtsanwaltsvergütungsgesetz (RVG)</li>
              <li>· Berufsregeln der Rechtsanwälte der Europäischen Union (CCBE)</li>
            </ul>
            <p className="mt-4">
              Einsehbar unter <span className="text-primary">brak.de</span> unter der Rubrik „Berufsrecht".
            </p>
          </div>

          <div>
            <h2 className="text-2xl">Berufshaftpflichtversicherung</h2>
            <p className="mt-4">
              HDI Versicherung AG, HDI-Platz 1, 30659 Hannover.<br />
              Räumlicher Geltungsbereich: weltweit (im Rahmen der
              Versicherungsbedingungen).
            </p>
          </div>

          <div>
            <h2 className="text-2xl">Verantwortlich i. S. d. § 18 Abs. 2 MStV</h2>
            <p className="mt-4">Dr. Friedrich Goldmann, Anschrift wie oben.</p>
          </div>

          <div>
            <h2 className="text-2xl">Streitschlichtung</h2>
            <p className="mt-4">
              Zur außergerichtlichen Beilegung von Streitigkeiten zwischen
              Mandanten und Rechtsanwälten besteht auf Antrag die Möglichkeit
              der Schlichtung bei der Schlichtungsstelle der Rechtsanwaltschaft
              (Neue Grünstraße 17, 10179 Berlin).
            </p>
            <p className="mt-4">
              Wir sind nicht bereit oder verpflichtet, an einem
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
              teilzunehmen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
