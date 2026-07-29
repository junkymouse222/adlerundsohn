-- Tracking für manuell versandte Zahlungsbestätigungs-E-Mails (Spedition/Liefertermin).
alter table public.offer_requests
  add column if not exists payment_confirm_sent_at timestamptz,
  add column if not exists payment_confirm_message_id text;
