CREATE TABLE IF NOT EXISTS public.manual_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  beleg_art TEXT NOT NULL CHECK (beleg_art IN ('Angebot','Rechnung')),
  beleg_nr TEXT NOT NULL,
  kunde_name TEXT,
  kunde_anschrift TEXT,
  total NUMERIC(12,2),
  ip TEXT,
  user_agent TEXT
);
GRANT INSERT ON public.manual_confirmations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_confirmations TO authenticated;
GRANT ALL ON public.manual_confirmations TO service_role;
ALTER TABLE public.manual_confirmations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create manual confirmations" ON public.manual_confirmations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view manual confirmations" ON public.manual_confirmations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete manual confirmations" ON public.manual_confirmations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS manual_confirmations_created_idx ON public.manual_confirmations (created_at DESC);