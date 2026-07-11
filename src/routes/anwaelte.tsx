import { createFileRoute, Link } from "@tanstack/react-router";
import goldmannImg from "@/assets/anwalt-goldmann.jpg";
import weberImg from "@/assets/anwaeltin-weber.jpg";
import hartmannImg from "@/assets/anwalt-hartmann.jpg";

export const Route = createFileRoute("/anwaelte")({
  head: () => ({
    meta: [
      { title: "Anwälte — Rechtsanwaltskanzlei Goldmann" },
      { name: "description", content: "Lernen Sie die Anwältinnen und Anwälte der Kanzlei Goldmann kennen: Fachanwälte für Insolvenzrecht mit langjähriger Erfahrung." },
      { property: "og:title", content: "Anwälte — Rechtsanwaltskanzlei Goldmann" },
      { property: "og:description", content: "Fachanwälte für Insolvenzrecht mit langjähriger Erfahrung." },
      { property: "og:url", content: "https://kanzlei-goldmann.de/anwaelte" },
    ],
    links: [{ rel: "canonical", href: "https://kanzlei-goldmann.de/anwaelte" }],
  }),
  component: AnwaeltePage,
});

const anwaelte = [
  {
    name: "Dr. Friedrich Goldmann",
    role: "Gründungspartner · Insolvenzverwalter",
    img: goldmannImg,
    bio: [
      "Dr. Friedrich Goldmann gründete die Kanzlei 1998. Er wird seit 2003 regelmäßig als Insolvenzverwalter, Sachwalter und Treuhänder an den Amtsgerichten Berlin-Charlottenburg und Potsdam bestellt und hat in dieser Funktion Verfahren von mittelständischen Produktionsbetrieben bis zu international vernetzten Handelsgesellschaften geführt.",
      "Er promovierte an der Humboldt-Universität zu Berlin über die Reform der Restschuldbefreiung und veröffentlicht regelmäßig in der ZInsO und der NZI.",
    ],
    schwerpunkte: ["Regelinsolvenzverfahren", "Eigenverwaltung", "Konzerninsolvenzen", "Sanierungsberatung"],
    ausbildung: [
      "Studium der Rechtswissenschaften, Freie Universität Berlin",
      "Promotion, Humboldt-Universität zu Berlin (2001)",
      "Fachanwalt für Insolvenzrecht (seit 2005)",
    ],
    kontakt: "f.goldmann@kanzlei-goldmann.de",
  },
  {
    name: "Dr. Katharina Weber",
    role: "Partnerin · Sanierung & Restrukturierung",
    img: weberImg,
    bio: [
      "Dr. Katharina Weber verstärkt die Kanzlei seit 2011 und leitet den Bereich Sanierung und Restrukturierung. Sie berät Unternehmen in vorinsolvenzlichen Krisensituationen — insbesondere bei der Vorbereitung von Schutzschirmverfahren und der Umsetzung von Restrukturierungsplänen nach dem StaRUG.",
      "Vor ihrer Anwaltstätigkeit war sie mehrere Jahre in der Corporate-Abteilung einer international tätigen Wirtschaftskanzlei tätig.",
    ],
    schwerpunkte: ["Schutzschirmverfahren", "StaRUG-Restrukturierung", "M&A in der Krise", "Gesellschaftsrecht"],
    ausbildung: [
      "Studium in Heidelberg und Cambridge (LL.M.)",
      "Promotion zum StaRUG (2013)",
      "Fachanwältin für Handels- und Gesellschaftsrecht",
    ],
    kontakt: "k.weber@kanzlei-goldmann.de",
  },
  {
    name: "Marcus Hartmann",
    role: "Partner · Gläubigervertretung",
    img: hartmannImg,
    bio: [
      "Marcus Hartmann ist seit 2020 Teil der Kanzlei und verantwortet die Gläubigervertretung. Er begleitet Banken, Lieferanten und institutionelle Gläubiger von der Forderungsanmeldung über die Verwertung von Sicherheiten bis zur Vertretung im Gläubigerausschuss.",
      "Ein besonderer Fokus liegt auf der Anfechtungsabwehr sowie der Prüfung und Durchsetzung von Absonderungs- und Aussonderungsrechten.",
    ],
    schwerpunkte: ["Forderungsanmeldung", "Gläubigerausschuss", "Anfechtungsrecht", "Sicherheitenverwertung"],
    ausbildung: [
      "Studium an der Universität Münster",
      "Referendariat am OLG Hamm",
      "Fachanwalt für Insolvenzrecht (seit 2018)",
    ],
    kontakt: "m.hartmann@kanzlei-goldmann.de",
  },
];

function AnwaeltePage() {
  return (
    <>
      <section className="border-b border-border bg-parchment">
        <div className="container-prose py-24 md:py-32">
          <p className="eyebrow">Anwälte</p>
          <h1 className="mt-6 max-w-3xl text-5xl md:text-6xl">
            Drei Perspektiven auf ein spezialisiertes Rechtsgebiet.
          </h1>
          <span className="rule-gold mt-8" />
          <p className="mt-8 max-w-2xl text-lg text-muted-foreground">
            Unsere Anwältinnen und Anwälte verbinden akademische Präzision mit
            der Erfahrung aus hunderten geführten Verfahren.
          </p>
        </div>
      </section>

      <div className="container-prose divide-y divide-border">
        {anwaelte.map((a, i) => (
          <section key={a.name} className="grid gap-12 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-16 md:py-28">
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <img
                src={a.img}
                alt={`Portrait ${a.name}`}
                className="aspect-[4/5] w-full object-cover"
                width={1024}
                height={1280}
                loading="lazy"
              />
            </div>
            <div className={i % 2 === 1 ? "md:order-1" : ""}>
              <p className="text-[0.7rem] uppercase tracking-[0.24em] text-gold">{a.role}</p>
              <h2 className="mt-4 text-4xl md:text-5xl">{a.name}</h2>
              <span className="rule-gold mt-6" />
              <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/80">
                {a.bio.map((p, idx) => <p key={idx}>{p}</p>)}
              </div>

              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">Schwerpunkte</p>
                  <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                    {a.schwerpunkte.map((s) => <li key={s}>· {s}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">Werdegang</p>
                  <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                    {a.ausbildung.map((s) => <li key={s}>· {s}</li>)}
                  </ul>
                </div>
              </div>

              <p className="mt-8 border-t border-border pt-6 text-sm">
                <span className="text-muted-foreground">E-Mail: </span>
                <a href={`mailto:${a.kontakt}`} className="text-primary hover:text-gold">{a.kontakt}</a>
              </p>
            </div>
          </section>
        ))}
      </div>

      <section className="container-prose pb-24">
        <div className="border border-border bg-parchment p-10 text-center md:p-16">
          <h2 className="text-3xl md:text-4xl">Ein persönliches Gespräch sagt mehr als jede Vita.</h2>
          <Link to="/kontakt" className="mt-8 inline-block bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90">
            Termin vereinbaren
          </Link>
        </div>
      </section>
    </>
  );
}
