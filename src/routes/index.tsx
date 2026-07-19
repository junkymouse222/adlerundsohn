import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/kanzlei-hero.jpg";
import goldmannImg from "@/assets/anwalt-goldmann.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:url", content: "https://adlerundsohn.com/" },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
    ],
    links: [{ rel: "canonical", href: "https://adlerundsohn.com/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LegalService",
        name: "Rechtsanwaltskanzlei Adler und Sohn",
        description: "Fachanwaltskanzlei für Insolvenzrecht und Insolvenzverwaltung.",
        url: "https://adlerundsohn.com",
        telephone: "+49-30-40551290",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Strandstraße 14",
          addressLocality: "Westerland",
          postalCode: "25980",
          addressCountry: "DE",
        },
        areaServed: "DE",
      }),
    }],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImg}
            alt="Empfangshalle der Rechtsanwaltskanzlei Adler und Sohn"
            className="h-full w-full object-cover"
            width={1280}
            height={858}
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/30" />
        </div>

        <div className="container-prose py-32 md:py-48">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-gold">
            Seit 1998 · Sylt
          </p>
          <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[1.05] text-primary-foreground md:text-7xl">
            Insolvenz&shy;recht mit
            <span className="italic text-gold-soft"> Weitblick</span> und
            juristischer Präzision.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-primary-foreground/80">
            Die Rechtsanwaltskanzlei Adler und Sohn begleitet Unternehmen, Gläubiger
            und Privatpersonen durch komplexe Insolvenzverfahren — diskret,
            strukturiert und mit über 25 Jahren Erfahrung als bestellter
            Insolvenzverwalter.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/kontakt" className="bg-gold px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-primary transition-colors hover:bg-gold-soft">
              Erstberatung anfragen
            </Link>
            <Link to="/fachgebiete" className="border border-primary-foreground/30 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:border-gold hover:text-gold">
              Fachgebiete ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-border bg-parchment">
        <div className="container-prose grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {[
            ["25+", "Jahre Erfahrung"],
            ["380+", "geführte Verfahren"],
            ["3", "Fachanwälte"],
            ["100%", "Vertraulichkeit"],
          ].map(([k, v]) => (
            <div key={v}>
              <p className="font-serif text-4xl text-primary">{k}</p>
              <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leistungen */}
      <section className="container-prose py-24 md:py-32">
        <div className="grid gap-16 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">Fachgebiete</p>
            <h2 className="mt-4 text-4xl md:text-5xl">Konzentriert. Spezialisiert. Verlässlich.</h2>
            <span className="rule-gold mt-6" />
          </div>
          <div className="grid gap-px bg-border">
            {[
              {
                title: "Regelinsolvenzverfahren",
                text: "Betreuung eröffneter Verfahren, Sicherung der Masse und geordnete Verwertung im Interesse der Gläubiger.",
              },
              {
                title: "Eigenverwaltung & Schutzschirm",
                text: "Sanierung in Eigenregie unter gerichtlicher Aufsicht — für Unternehmen mit tragfähigem Fortführungskonzept.",
              },
              {
                title: "Gläubigervertretung",
                text: "Durchsetzung von Forderungen, Anmeldung zur Insolvenztabelle und Vertretung im Gläubigerausschuss.",
              },
              {
                title: "Verbraucherinsolvenz",
                text: "Wegbegleitung natürlicher Personen von der Schuldenregulierung bis zur Restschuldbefreiung.",
              },
            ].map((it) => (
              <article key={it.title} className="bg-background p-8">
                <h3 className="text-xl">{it.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{it.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="bg-primary text-primary-foreground">
        <div className="container-prose grid gap-12 py-24 md:grid-cols-2 md:items-center md:py-32">
          <div className="order-2 md:order-1">
            <p className="text-[0.7rem] uppercase tracking-[0.24em] text-gold">Gründer & Insolvenzverwalter</p>
            <h2 className="mt-4 font-serif text-4xl text-primary-foreground md:text-5xl">
              Dr. Friedrich Adler
            </h2>
            <span className="rule-gold mt-6" />
            <p className="mt-8 text-base leading-relaxed text-primary-foreground/80">
              „Ein Insolvenzverfahren ist selten das Ende. Es ist der Moment,
              in dem geordnete Rechtsberatung darüber entscheidet, ob Werte
              erhalten, Arbeitsplätze gesichert und neue Perspektiven eröffnet
              werden."
            </p>
            <p className="mt-6 text-sm leading-relaxed text-primary-foreground/60">
              Fachanwalt für Insolvenzrecht · Bestellter Insolvenzverwalter
              an den Amtsgerichten Niebüll und Flensburg · Mitglied
              des VID Verband Insolvenzverwalter Deutschlands e.V.
            </p>
            <Link to="/anwaelte" className="mt-10 inline-block border-b border-gold pb-1 text-xs uppercase tracking-[0.22em] text-gold hover:text-gold-soft">
              Alle Anwälte kennenlernen
            </Link>
          </div>
          <div className="order-1 md:order-2">
            <img
              src={goldmannImg}
              alt="Portrait Dr. Friedrich Adler"
              className="aspect-[4/5] w-full object-cover grayscale-[15%]"
              width={1024}
              height={1280}
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-prose py-24 md:py-32">
        <div className="border border-border p-10 md:p-16">
          <div className="grid gap-8 md:grid-cols-[2fr_1fr] md:items-end">
            <div>
              <p className="eyebrow">Vertrauliches Erstgespräch</p>
              <h2 className="mt-4 text-4xl md:text-5xl">
                Sprechen Sie mit uns — bevor es dringlich wird.
              </h2>
              <p className="mt-6 max-w-xl text-base text-muted-foreground">
                Ob drohende Zahlungsunfähigkeit, Sanierung in Eigenverwaltung
                oder Anmeldung Ihrer Forderung: Ein frühes Gespräch schafft
                Handlungsspielraum. Wir hören zu, prüfen und beraten Sie
                individuell.
              </p>
            </div>
            <Link to="/kontakt" className="inline-flex w-full items-center justify-center bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 md:w-auto">
              Termin vereinbaren
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
