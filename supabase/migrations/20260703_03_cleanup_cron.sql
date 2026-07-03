-- ============================================================
-- Daily cleanup of expired "My Files" results (02:15 UTC)
--
-- Invokes the cleanup-expired-files edge function via pg_net.
-- The edge function deletes storage objects through the storage API
-- (deleting storage.objects rows directly would orphan the underlying
-- S3 objects) and then removes the table rows.
--
-- BEFORE APPLYING:
--   1. Enable the pg_cron and pg_net extensions
--      (Dashboard -> Database -> Extensions).
--   2. Deploy the cleanup-expired-files edge function and set its
--      CLEANUP_SECRET function secret.
--   3. Replace <project-ref> and <CLEANUP_SECRET> placeholders below.
-- ============================================================

select cron.schedule(
  'cleanup-expired-verification-files',
  '15 2 * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.functions.supabase.co/cleanup-expired-files',
    headers := jsonb_build_object(
      'x-cleanup-key', '<CLEANUP_SECRET>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
