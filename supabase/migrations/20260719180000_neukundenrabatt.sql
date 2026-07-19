-- Neukundenrabatt: neue Spalten + Standard 5% + Backfill offener Angebote.

ALTER TABLE public.offer_requests
  ADD COLUMN IF NOT EXISTS rabatt_rate numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS rabatt      numeric NOT NULL DEFAULT 0;

-- Für noch nicht versendete (pending) Angebote den 5%-Neukundenrabatt ausweisen
-- und Summen neu berechnen, damit auch die automatischen Angebote ihn zeigen.
WITH calc AS (
  SELECT
    id,
    round(subtotal * 0.05, 2) AS rabatt,
    round(subtotal - round(subtotal * 0.05, 2) + lieferkosten, 2) AS netto,
    mwst_rate
  FROM public.offer_requests
  WHERE status = 'pending'
)
UPDATE public.offer_requests o
SET
  rabatt_rate = 5,
  rabatt = calc.rabatt,
  mwst = round(calc.netto * calc.mwst_rate / 100, 2),
  total = round(calc.netto + round(calc.netto * calc.mwst_rate / 100, 2), 2)
FROM calc
WHERE o.id = calc.id;
