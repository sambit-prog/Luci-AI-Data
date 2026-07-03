import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Deletes expired "My Files" verification results: storage objects first
// (via the storage API — deleting storage.objects rows directly would orphan
// the underlying files), then the tracking rows.
//
// Not user-facing: invoked daily by pg_cron + pg_net (see migration
// 20260703_03_cleanup_cron.sql), authenticated with the CLEANUP_SECRET
// function secret via the x-cleanup-key header.

const BUCKET = 'verification-results';
const BATCH_SIZE = 200;

serve(async (req) => {
  try {
    const secret = Deno.env.get('CLEANUP_SECRET');
    if (!secret || req.headers.get('x-cleanup-key') !== secret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let deleted = 0;

    for (;;) {
      const { data: expired, error: selectError } = await supabaseAdmin
        .from('luciAI_verification_files')
        .select('id, storage_path')
        .lt('expires_at', new Date().toISOString())
        .limit(BATCH_SIZE);

      if (selectError) throw selectError;
      if (!expired || expired.length === 0) break;

      const paths = expired
        .map((row: { storage_path: string | null }) => row.storage_path)
        .filter((p: string | null): p is string => !!p);
      if (paths.length > 0) {
        // Best effort — a missing object must not block deleting the rows
        await supabaseAdmin.storage.from(BUCKET).remove(paths);
      }

      const ids = expired.map((row: { id: string }) => row.id);
      const { error: deleteError } = await supabaseAdmin
        .from('luciAI_verification_files')
        .delete()
        .in('id', ids);
      if (deleteError) throw deleteError;

      deleted += expired.length;
      if (expired.length < BATCH_SIZE) break;
    }

    return new Response(JSON.stringify({ success: true, deleted }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('cleanup-expired-files error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
