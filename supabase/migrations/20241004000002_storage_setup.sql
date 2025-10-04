-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('test-screenshots', 'test-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow service role to upload screenshots"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'test-screenshots');

CREATE POLICY "Allow service role to update screenshots"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'test-screenshots');

CREATE POLICY "Allow service role to delete screenshots"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'test-screenshots');

CREATE POLICY "Public read access to screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'test-screenshots');

