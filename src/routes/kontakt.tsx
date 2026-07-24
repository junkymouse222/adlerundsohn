import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — Rechtsanwaltskanzlei Adler und Sohn Sylt" },
      { name: "description", content: "Kontakt zur Rechtsanwaltskanzlei Adler und Sohn auf Sylt. Vertrauliches Erstgespräch, Termin nach Vereinbarung." },
      { property: "og:title", content: "Kontakt — Kanzlei Adler und Sohn" },
      { property: "og:description", content: "Vertrauliches Erstgespräch, Termin nach Vereinbarung." },
      { property: "og:url", content: "https://adlerundsohn.com/kontakt" },
    ],
    links: [{ rel: "canonical", href: "https://adlerundsohn.com/kontakt" }],
  }),
  component: KontaktPage,
});

function KontaktPage() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <section className="border-b border-border bg-parchment">
        <div className="container-prose py-24 md:py-32">
          <p className="eyebrow">Kontakt</p>
          <h1 className="mt-6 max-w-3xl text-5xl md:text-6xl">
            Ein Gespräch ist der erste Schritt.
          </h1>
          <span className="rule-gold mt-8" />
        </div>
      </section>

      <section className="container-prose grid gap-16 py-20 md:grid-cols-2 md:py-28">
        <div>
          <h2 className="text-3xl">Kanzlei Sylt</h2>
          <span className="rule-gold mt-6" />
          <address className="mt-8 space-y-1 not-italic text-base text-foreground/80">
            <p>Rechtsanwaltskanzlei Adler und Sohn</p>
            <p>Strandstraße 14</p>
            <p>25980 Westerland/Sylt</p>
          </address>

          <dl className="mt-8 space-y-4 border-t border-border pt-8 text-sm">
            <div className="grid grid-cols-[8rem_1fr] gap-4">
              <dt className="text-muted-foreground">Telefon</dt>
              <dd><a href="tel:+4965916659636" className="text-primary hover:text-gold">+49 6591 6659636</a></dd>
            </div>
            <div className="grid grid-cols-[8rem_1fr] gap-4">
              <dt className="text-muted-foreground">Telefax</dt>
              <dd>+49 (0)30 40 55 12 91</dd>
            </div>
            <div className="grid grid-cols-[8rem_1fr] gap-4">
              <dt className="text-muted-foreground">E-Mail</dt>
              <dd>
                <a href="mailto:info@adlerundsohn.de" className="text-primary hover:text-gold">info@adlerundsohn.de</a>
                <br />
                <a href="mailto:info@adlerundsohn.de" className="text-primary hover:text-gold">info@adlerundsohn.de</a>
              </dd>
            </div>
            <div className="grid grid-cols-[8rem_1fr] gap-4">
              <dt className="text-muted-foreground">Web</dt>
              <dd>adlerundsohn.com</dd>
            </div>
          </dl>

          <div className="mt-10 border-t border-border pt-8">
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">Sprechzeiten</p>
            <ul className="mt-4 space-y-2 text-sm text-foreground/80">
              <li className="flex justify-between border-b border-border pb-2">
                <span>Montag – Donnerstag</span><span>08:30 – 18:00</span>
              </li>
              <li className="flex justify-between border-b border-border pb-2">
                <span>Freitag</span><span>08:30 – 16:00</span>
              </li>
              <li className="flex justify-between">
                <span>Termine außerhalb</span><span>nach Vereinbarung</span>
              </li>
            </ul>
          </div>

          <div className="mt-10 border-t border-border pt-8">
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">Anfahrt</p>
            <p className="mt-4 text-sm text-foreground/80">
              Bahn: Bahnhof Westerland (Sylt) — 5 Gehminuten<br />
              Auto: A7 bis Niebüll, Sylt Shuttle nach Westerland<br />
              Flug: Flughafen Sylt (GWT) — 10 Minuten mit dem Taxi
            </p>
          </div>
        </div>

        <div className="bg-parchment p-8 md:p-10">
          <h2 className="text-3xl">Erstberatung anfragen</h2>
          <span className="rule-gold mt-6" />
          <p className="mt-6 text-sm text-muted-foreground">
            Wir melden uns innerhalb eines Werktages bei Ihnen zurück.
            Alle Angaben werden vertraulich behandelt.
          </p>

          {sent ? (
            <div className="mt-8 border border-gold bg-background p-6 text-sm">
              Vielen Dank für Ihre Nachricht. Wir werden uns zeitnah bei Ihnen melden.
            </div>
          ) : (
            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            >
              {[
                { name: "name", label: "Name", type: "text", required: true },
                { name: "email", label: "E-Mail", type: "email", required: true },
                { name: "telefon", label: "Telefon (optional)", type: "tel" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    name={f.name}
                    required={f.required}
                    className="mt-2 w-full border-b border-border bg-transparent py-2 text-sm text-foreground outline-none focus:border-gold"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Ihr Anliegen
                </label>
                <textarea
                  name="anliegen"
                  rows={5}
                  required
                  className="mt-2 w-full border-b border-border bg-transparent py-2 text-sm text-foreground outline-none focus:border-gold"
                />
              </div>
              <label className="flex items-start gap-3 text-xs text-muted-foreground">
                <input type="checkbox" required className="mt-1 accent-[color:var(--color-gold)]" />
                <span>Ich habe die Datenschutzerklärung zur Kenntnis genommen und stimme der Verarbeitung meiner Daten zur Bearbeitung der Anfrage zu.</span>
              </label>
              <button
                type="submit"
                className="w-full bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90"
              >
                Anfrage senden
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
