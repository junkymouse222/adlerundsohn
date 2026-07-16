
ALTER TABLE public.offer_requests
  ADD COLUMN IF NOT EXISTS accept_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_ip text,
  ADD COLUMN IF NOT EXISTS bank_inhaber text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_iban text,
  ADD COLUMN IF NOT EXISTS bank_bic text;

CREATE UNIQUE INDEX IF NOT EXISTS offer_requests_accept_token_key
  ON public.offer_requests(accept_token);
