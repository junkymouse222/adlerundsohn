import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-4 text-4xl">Seite nicht gefunden</h1>
        <span className="rule-gold mx-auto mt-6" />
        <p className="mt-6 text-sm text-muted-foreground">
          Die aufgerufene Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-8">
          <Link to="/" className="inline-flex items-center gap-2 border-b border-gold pb-1 text-sm uppercase tracking-widest text-primary hover:text-gold">
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl">Ein Fehler ist aufgetreten</h1>
        <span className="rule-gold mx-auto mt-6" />
        <p className="mt-6 text-sm text-muted-foreground">
          Bitte versuchen Sie es erneut oder kehren Sie zur Startseite zurück.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="bg-primary px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
          >
            Erneut versuchen
          </button>
          <a href="/" className="border border-primary px-6 py-3 text-xs uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground">
            Startseite
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Rechtsanwaltskanzlei Goldmann — Insolvenzrecht & Insolvenzverwaltung" },
      { name: "description", content: "Spezialisierte Kanzlei für Insolvenzrecht und Insolvenzverwaltung. Persönliche Beratung von Unternehmen, Gläubigern und Privatpersonen." },
      { name: "author", content: "Rechtsanwaltskanzlei Goldmann" },
      { property: "og:title", content: "Rechtsanwaltskanzlei Goldmann — Insolvenzrecht & Insolvenzverwaltung" },
      { property: "og:description", content: "Spezialisierte Kanzlei für Insolvenzrecht und Insolvenzverwaltung. Persönliche Beratung von Unternehmen, Gläubigern und Privatpersonen." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Rechtsanwaltskanzlei Goldmann" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Rechtsanwaltskanzlei Goldmann — Insolvenzrecht & Insolvenzverwaltung" },
      { name: "twitter:description", content: "Spezialisierte Kanzlei für Insolvenzrecht und Insolvenzverwaltung. Persönliche Beratung von Unternehmen, Gläubigern und Privatpersonen." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/f6e843e0-b235-45b6-9f3a-7d838694cbf1" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/f6e843e0-b235-45b6-9f3a-7d838694cbf1" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const navItems = [
  { to: "/", label: "Startseite" },
  { to: "/kanzlei", label: "Kanzlei" },
  { to: "/anwaelte", label: "Anwälte" },
  { to: "/fachgebiete", label: "Fachgebiete" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-prose flex items-center justify-between py-5">
        <Link to="/" className="group flex items-baseline gap-3" onClick={() => setOpen(false)}>
          <span className="font-serif text-2xl leading-none text-primary">Goldmann</span>
          <span className="hidden text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground sm:inline">
            Rechtsanwälte
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-[0.78rem] uppercase tracking-[0.18em] text-foreground/70 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary border-b border-gold pb-1" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="md:hidden text-xs uppercase tracking-widest text-primary"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menü"
        >
          {open ? "Schließen" : "Menü"}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="container-prose flex flex-col divide-y divide-border">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="py-4 text-sm uppercase tracking-widest text-foreground/80"
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-primary text-primary-foreground">
      <div className="container-prose grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-serif text-2xl">Rechtsanwaltskanzlei Goldmann</p>
          <span className="rule-gold mt-4" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
            Spezialisiert auf Insolvenzrecht und Insolvenzverwaltung.
            Verlässliche Beratung für Unternehmen, Gläubiger und Privatpersonen.
          </p>
        </div>
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.24em] text-gold">Kontakt</p>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li>Friedrichstraße 112</li>
            <li>10117 Berlin</li>
            <li>+49 6591 6659636</li>
            <li>kanzlei@kanzlei-goldmann.de</li>
          </ul>
        </div>
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.24em] text-gold">Rechtliches</p>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li><Link to="/impressum" className="hover:text-gold">Impressum</Link></li>
            <li><Link to="/datenschutz" className="hover:text-gold">Datenschutz</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-prose flex flex-col items-start justify-between gap-3 py-6 text-xs text-primary-foreground/50 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Rechtsanwaltskanzlei Goldmann · kanzlei-goldmann.de</span>
          <span>Mitglied der Rechtsanwaltskammer Berlin</span>
        </div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
