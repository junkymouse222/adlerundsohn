# Angebotsanforderung mit verzögertem Resend-Versand + Admin-Backend

## Ablauf für den Kunden
1. Kunde klickt in der PDF auf „Angebot Anfordern" → landet auf `/angebot-anfordern` (optional mit `?ref=<kampagnen-id>` aus der PDF).
2. Wählt Produkte aus dem Katalog (`src/lib/katalog.ts`) mit Suche/Kategorie-Filter, gibt Menge an.
3. Trägt Kontaktdaten ein: Firma, Name, E-Mail, Telefon, Lieferadresse, USt-ID (optional), Nachricht.
4. Absenden → Anfrage wird in DB gespeichert mit Status `pending` und einem `scheduled_send_at`-Zeitpunkt (siehe Zeitfenster-Logik).
5. Kunde sieht Bestätigungsseite: „Wir senden Ihr Angebot in Kürze per E-Mail."

## Zeitfenster-Logik (Versandzeitpunkt bestimmen)
Beim Absenden wird `scheduled_send_at` berechnet:
- Aktueller Zeitpunkt + zufällige Verzögerung 15–30 Min.
- Fällt das Ergebnis außerhalb Mo–Fr 07:00–19:00 (Europe/Berlin) → auf nächsten gültigen Werktagsslot verschieben, dabei zufälligen Offset innerhalb des Fensters wählen, damit es „menschlich" wirkt.

## Automatischer Versand
- **pg_cron** läuft alle 5 Minuten und ruft eine öffentliche Server-Route `/api/public/hooks/send-scheduled-offers` auf.
- Die Route:
  1. Ladet alle Anfragen mit `status='pending'` und `scheduled_send_at <= now()`.
  2. Generiert für jede ein PDF-Angebot (gleiche Logik wie `/rechnung`, serverseitig via `@react-pdf/renderer` oder als HTML-Angebot inline in der Mail — Plan: HTML-Angebot in der Mail + Angebotsnummer, Tabellen-Layout an bestehendes Design angelehnt).
  3. Versendet per **Resend** (Connector, gateway-basiert) mit Absender `angebote@goldmann-ra.de` (Domain muss in Resend verifiziert sein).
  4. Setzt Status auf `sent`, speichert `sent_at`, `resend_message_id`, `angebot_html` (für Admin-Ansicht).
  5. Bei Fehler → Status `failed`, `error_message`.

## Admin-Backend
- Route `/admin` unter `_authenticated/`-Layout (E-Mail/Passwort-Login via bestehendem Cloud Auth).
- Anonyme Anmeldungen aus, ein Admin-Account wird per Migration/Insert-Seed vorbereitet (User legt Passwort beim ersten Login-Versuch via „Passwort vergessen" fest — oder du gibst mir die Wunsch-Admin-E-Mail und ich lege den User per Auth-Admin-API an).
- `user_roles`-Tabelle mit Enum `admin` und `has_role()`-Security-Definer-Funktion.
- Übersichtstabelle aller Angebotsanfragen: Datum, Kunde, E-Mail, Anzahl Positionen, Summe, Status, geplanter Versand, tatsächlicher Versand.
- Detailansicht pro Anfrage: alle Positionen, generierter Angebotstext/HTML-Preview, „Erneut senden"-Button.
- Filter: Status, Zeitraum.

## Datenmodell (Migration)
```
offer_requests
  id uuid pk
  created_at, scheduled_send_at, sent_at timestamptz
  status text (pending|sent|failed)
  customer_company, customer_name, customer_email, customer_phone text
  customer_address text
  customer_ust_id text nullable
  message text nullable
  ref_source text nullable
  angebot_nr text
  subtotal, mwst, total numeric
  offer_html text nullable
  resend_message_id text nullable
  error_message text nullable

offer_request_items
  id uuid pk
  request_id uuid fk → offer_requests(id) on delete cascade
  artikel text, name text, beschreibung text, einheit text
  einzelpreis numeric, menge int, position_total numeric

user_roles (Standardmuster mit app_role enum)
```
- **RLS**: `offer_requests`/`offer_request_items` — INSERT für `anon` erlaubt (öffentliches Formular), SELECT/UPDATE nur für `admin`. `user_roles` — SELECT nur eigene, alles andere service_role.
- **GRANTS**: `INSERT` auf `anon`; `SELECT/UPDATE` auf `authenticated`; `ALL` auf `service_role`.

## Neue Dateien/Routen
- `src/routes/angebot-anfordern.tsx` — öffentliches Formular mit Produktauswahl (Wiederverwendung der Filter/Position-Logik aus `rechnung.tsx`).
- `src/routes/angebot-anfordern.danke.tsx` — Bestätigung.
- `src/lib/offer.functions.ts` — `submitOfferRequest` (öffentlich, ohne Auth, mit Zod-Validation + Rate-Limit via IP).
- `src/lib/offer-scheduling.ts` — Berechnung `scheduled_send_at`.
- `src/lib/offer-email.ts` — HTML-Angebot rendern + Resend-Call via Gateway (`connector-gateway.lovable.dev/resend/emails`).
- `src/routes/api/public/hooks/send-scheduled-offers.ts` — Cron-Endpoint.
- `src/routes/_authenticated/admin/index.tsx` — Admin-Liste.
- `src/routes/_authenticated/admin/$id.tsx` — Detailansicht.
- Migration mit Tabellen + Rollen + Policies + Grants.
- pg_cron-Job via `supabase--insert` (nach Deploy der Route).

## Voraussetzungen, die du erledigen musst
1. **Resend-Connector verbinden** (ich rufe `standard_connectors--connect` mit `resend` auf → du fügst API-Key hinzu).
2. **Absender-Domain in Resend verifizieren** — z.B. `goldmann-ra.de` mit DNS-Records; ohne verifizierte Domain kann nur an Account-Owner-E-Mail gesendet werden.
3. **Admin-E-Mail** angeben, mit der du dich einloggen willst.

## Nicht enthalten (kann später)
- Umbenennung „Goldmann → Adler" (laut deiner Antwort später).
- PDF-Anhang statt HTML-Mail (kann als Erweiterung nachgezogen werden).
- „Erneut senden" mit Änderungen im Admin.

Wenn du zustimmst, baue ich das in dieser Reihenfolge: Connector + Migration → Formular → Cron-Route + E-Mail → Admin-Backend.
