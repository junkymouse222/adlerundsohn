
ALTER TABLE public.offer_requests
  ADD COLUMN IF NOT EXISTS rechnung_nr text,
  ADD COLUMN IF NOT EXISTS rechnung_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS rechnung_sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rechnung_message_id text,
  ADD COLUMN IF NOT EXISTS rechnung_faellig_am date,
  ADD COLUMN IF NOT EXISTS rechnung_error text;
