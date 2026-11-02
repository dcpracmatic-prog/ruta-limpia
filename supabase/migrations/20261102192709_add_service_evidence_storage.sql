/*
# Add private storage for service evidence

1. New columns
- `evidences.file_path`: internal storage path for the uploaded file.
- `evidences.mime_type`: validated media type used for display and download behavior.
- `evidences.size_bytes`: file size recorded for the service record.

2. Storage
- Creates the private `service-evidence` bucket.
- Limits uploads to 10 MB.
- Allows only JPEG, PNG, WebP and PDF files.

3. Security
- Enables storage policies for the shared pilot workspace only.
- Anonymous and authenticated users may upload, read and delete files only inside the `service-evidence` bucket.
- Files remain private and are accessed by short-lived signed URLs from the application.

4. Important notes
- The current pilot has no sign-in screen, so access is shared at the workspace level.
- Before production use, add user accounts and replace shared policies with service/team membership checks.
*/

ALTER TABLE evidences ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE evidences ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE evidences ADD COLUMN IF NOT EXISTS size_bytes integer;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('service-evidence', 'service-evidence', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

DROP POLICY IF EXISTS "shared_evidence_upload" ON storage.objects;
CREATE POLICY "shared_evidence_upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'service-evidence');

DROP POLICY IF EXISTS "shared_evidence_read" ON storage.objects;
CREATE POLICY "shared_evidence_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'service-evidence');

DROP POLICY IF EXISTS "shared_evidence_delete" ON storage.objects;
CREATE POLICY "shared_evidence_delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'service-evidence');
