-- Make bucket public so avatar URLs work without auth tokens
UPDATE storage.buckets SET public = true WHERE id = 'chore-proofs';

-- Allow authenticated users (parents) to upload to avatars/ folder
CREATE POLICY "parent_upload_avatar" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chore-proofs'
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to overwrite avatars (for upsert)
CREATE POLICY "parent_update_avatar" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'chore-proofs'
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- Allow deleting old avatars
CREATE POLICY "parent_delete_avatar" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chore-proofs'
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.role() = 'authenticated'
  );
