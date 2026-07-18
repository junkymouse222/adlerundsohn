ALTER TABLE public.offer_requests
  ADD COLUMN IF NOT EXISTS pay_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_ip text;
CREATE INDEX IF NOT EXISTS offer_requests_pay_token_idx ON public.offer_requests(pay_token);