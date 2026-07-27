-- t.ly-Kurzlinks für Angebots-/Rechnungs-Aktionslinks.
--
-- Damit in den Angebots-/Rechnungs-E-Mails und -PDFs nur t.ly-Domains statt der
-- eigenen Kanzlei-Domain erscheinen (Spam-/Reputationsschutz), wird pro Angebot
-- der erzeugte t.ly-Kurzlink gespeichert und wiederverwendet.
alter table public.offer_requests
  add column if not exists accept_short_url text,
  add column if not exists pay_short_url text;
