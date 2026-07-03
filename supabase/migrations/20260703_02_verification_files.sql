-- ============================================================
-- "My Files": consent-based storage of bulk verification results
--
-- One row per saved job. The results CSV itself lives in the private
-- 'verification-results' storage bucket at '{user_id}/{job_id}.csv'.
-- Rows/objects are removed by the cleanup-expired-files edge function
-- after expires_at; client queries additionally filter expires_at > now()
-- as defense in depth.
--
-- NOTE: identifiers are quoted on purpose — the deployed tables use
-- mixed-case names (e.g. "luciAI_credit_balances").
--
-- NOTE: user_id has NO foreign key constraint, matching the existing
-- production schema — "luciAI_profiles" does not exist in this deployment
-- and other luciAI_ tables (credit_balances, orders, etc.) do not FK
-- user_id anywhere either. Ownership is enforced entirely via auth.uid()
-- in the RLS policies below.
-- ============================================================

create table "luciAI_verification_files" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  job_id text not null,
  file_name text not null,
  total_emails integer not null default 0,
  stats jsonb,                                   -- {valid,invalid,risky,catch_all,cancelled,total}
  storage_path text,                             -- '{user_id}/{job_id}.csv' once uploaded
  retention_days integer not null check (retention_days between 5 and 30),
  expires_at timestamptz not null,
  status text not null default 'saving' check (status in ('saving', 'stored', 'failed')),
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index "idx_luciAI_verification_files_expiry" on "luciAI_verification_files"(expires_at);

alter table "luciAI_verification_files" enable row level security;

-- Full CRUD on own rows only. Expiry filtering is intentionally NOT in the
-- select policy: cleanup tooling and support need expired rows visible.
create policy "Users view own verification files" on "luciAI_verification_files"
  for select using (auth.uid() = user_id);
create policy "Users insert own verification files" on "luciAI_verification_files"
  for insert with check (auth.uid() = user_id);
create policy "Users update own verification files" on "luciAI_verification_files"
  for update using (auth.uid() = user_id);
create policy "Users delete own verification files" on "luciAI_verification_files"
  for delete using (auth.uid() = user_id);

-- Tables created via the SQL Editor do not automatically get role grants the
-- way tables created through the dashboard Table Editor do. RLS policies
-- above control WHICH rows a role can touch; this GRANT is what lets the
-- `authenticated` role touch the table at all. Without it, PostgREST returns
-- 403 "permission denied for table ..." (Postgres 42501) on every request.
grant select, insert, update, delete on "luciAI_verification_files" to authenticated;

-- ── Private storage bucket (50MB cap; a 1M-row email,status CSV is ~35MB) ──
insert into storage.buckets (id, name, public, file_size_limit)
values ('verification-results', 'verification-results', false, 52428800)
on conflict (id) do nothing;

-- Storage RLS: users only touch objects under their own uid folder
create policy "vr read own" on storage.objects for select
  using (bucket_id = 'verification-results' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "vr write own" on storage.objects for insert
  with check (bucket_id = 'verification-results' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "vr update own" on storage.objects for update
  using (bucket_id = 'verification-results' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "vr delete own" on storage.objects for delete
  using (bucket_id = 'verification-results' and auth.uid()::text = (storage.foldername(name))[1]);
