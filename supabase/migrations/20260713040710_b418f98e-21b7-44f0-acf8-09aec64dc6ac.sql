
CREATE POLICY "angebote_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'angebote');
CREATE POLICY "angebote_public_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'angebote');
