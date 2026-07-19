-- Wird ausgeführt, sobald der Supabase-Storage-Container das storage-Schema angelegt hat.
INSERT INTO storage.buckets (id, name, public)
VALUES ('angebote', 'angebote', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins manage angebote" ON storage.objects;
CREATE POLICY "Admins manage angebote"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'angebote' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'angebote' AND public.has_role(auth.uid(), 'admin'));
