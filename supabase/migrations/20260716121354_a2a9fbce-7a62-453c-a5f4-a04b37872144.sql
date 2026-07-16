
-- Rollen
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Angebotsanfragen
CREATE TABLE public.offer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_send_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  angebot_nr TEXT NOT NULL,
  customer_company TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT NOT NULL,
  customer_ust_id TEXT,
  message TEXT,
  ref_source TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  mwst_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  mwst NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  lieferkosten NUMERIC(12,2) NOT NULL DEFAULT 0,
  offer_html TEXT,
  resend_message_id TEXT,
  error_message TEXT
);

GRANT INSERT ON public.offer_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_requests TO authenticated;
GRANT ALL ON public.offer_requests TO service_role;

ALTER TABLE public.offer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create offer requests"
  ON public.offer_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view offer requests"
  ON public.offer_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update offer requests"
  ON public.offer_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete offer requests"
  ON public.offer_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Positionen
CREATE TABLE public.offer_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.offer_requests(id) ON DELETE CASCADE,
  pos INT NOT NULL,
  artikel TEXT NOT NULL,
  name TEXT NOT NULL,
  beschreibung TEXT,
  einheit TEXT NOT NULL,
  einzelpreis NUMERIC(12,2) NOT NULL,
  menge INT NOT NULL CHECK (menge > 0),
  position_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.offer_request_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_request_items TO authenticated;
GRANT ALL ON public.offer_request_items TO service_role;

ALTER TABLE public.offer_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create offer items"
  ON public.offer_request_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view offer items"
  ON public.offer_request_items FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update offer items"
  ON public.offer_request_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete offer items"
  ON public.offer_request_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at Trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER offer_requests_updated_at
BEFORE UPDATE ON public.offer_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX offer_requests_status_scheduled_idx
  ON public.offer_requests (status, scheduled_send_at);
