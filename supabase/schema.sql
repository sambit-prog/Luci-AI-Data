-- ============================================================
-- LuciAI Database Schema
-- Run this in the Supabase SQL Editor (in order)
-- ============================================================

-- Table 1: luciAI_profiles
create table luciAI_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table luciAI_profiles enable row level security;
create policy "Users view own profile" on luciAI_profiles for select using (auth.uid() = id);

-- Table 2: luciAI_credit_balances
create table luciAI_credit_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references luciAI_profiles(id) on delete cascade,
  service_type text not null check (service_type in ('lead_finder', 'email_verifier')),
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  unique(user_id, service_type)
);
alter table luciAI_credit_balances enable row level security;
create policy "Users view own credits" on luciAI_credit_balances for select using (auth.uid() = user_id);

-- Table 3: luciAI_orders
create table luciAI_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references luciAI_profiles(id),
  razorpay_order_id text not null unique,
  service_type text not null check (service_type in ('lead_finder', 'email_verifier')),
  credits_to_add integer not null,
  amount_paise integer not null,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table luciAI_orders enable row level security;
create policy "Users view own orders" on luciAI_orders for select using (auth.uid() = user_id);

-- Table 4: luciAI_payment_transactions
create table luciAI_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references luciAI_orders(id),
  user_id uuid not null references luciAI_profiles(id),
  razorpay_payment_id text not null unique,
  razorpay_order_id text not null,
  razorpay_signature text not null,
  service_type text not null,
  credits_added integer not null,
  amount_paise integer not null,
  status text not null check (status in ('success', 'failed')),
  created_at timestamptz not null default now()
);
alter table luciAI_payment_transactions enable row level security;
create policy "Users view own transactions" on luciAI_payment_transactions for select using (auth.uid() = user_id);

-- Table 5: luciAI_webhook_events (no RLS — only edge function writes here)
create table luciAI_webhook_events (
  id uuid primary key default gen_random_uuid(),
  razorpay_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Table 6: luciAI_credit_usage_log
create table luciAI_credit_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references luciAI_profiles(id),
  service_type text not null check (service_type in ('lead_finder', 'email_verifier')),
  action text not null check (action in ('purchase', 'deduction', 'refund')),
  credits_delta integer not null,
  balance_after integer not null,
  reference_id text,
  description text,
  created_at timestamptz not null default now()
);
alter table luciAI_credit_usage_log enable row level security;
create policy "Users view own history" on luciAI_credit_usage_log for select using (auth.uid() = user_id);

-- Trigger: auto-create profile + credit rows on new user signup
create or replace function handle_new_user() returns trigger as $$
begin
  insert into luciAI_profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);

  insert into luciAI_credit_balances (user_id, service_type, balance) values
    (new.id, 'lead_finder', 10),
    (new.id, 'email_verifier', 100);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Migration 20260703_01: credit deduction idempotency
-- At most one deduction per (user, service, job) — backs the
-- insert-log-first flow in the deduct-credits edge function.
-- ============================================================
create unique index if not exists "uq_luciAI_usage_dedup"
  on "luciAI_credit_usage_log" (user_id, service_type, reference_id)
  where action = 'deduction' and reference_id is not null;

-- ============================================================
-- Migration 20260703_02: "My Files" stored verification results
-- Table 7: luciAI_verification_files (+ private storage bucket)
--
-- NOTE (discovered 2026-07-03): the deployed database does not actually
-- have a luciAI_profiles table, and none of the other luciAI_ tables'
-- user_id columns carry a foreign key — this schema.sql file is ahead of
-- what's live. user_id below is intentionally a plain uuid with no FK,
-- matching production; ownership is enforced via auth.uid() in RLS only.
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
create policy "Users view own verification files" on "luciAI_verification_files"
  for select using (auth.uid() = user_id);
create policy "Users insert own verification files" on "luciAI_verification_files"
  for insert with check (auth.uid() = user_id);
create policy "Users update own verification files" on "luciAI_verification_files"
  for update using (auth.uid() = user_id);
create policy "Users delete own verification files" on "luciAI_verification_files"
  for delete using (auth.uid() = user_id);
grant select, insert, update, delete on "luciAI_verification_files" to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('verification-results', 'verification-results', false, 52428800)
on conflict (id) do nothing;

create policy "vr read own" on storage.objects for select
  using (bucket_id = 'verification-results' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "vr write own" on storage.objects for insert
  with check (bucket_id = 'verification-results' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "vr update own" on storage.objects for update
  using (bucket_id = 'verification-results' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "vr delete own" on storage.objects for delete
  using (bucket_id = 'verification-results' and auth.uid()::text = (storage.foldername(name))[1]);

-- Migration 20260703_03 (cleanup cron) is environment-specific — see
-- supabase/migrations/20260703_03_cleanup_cron.sql for the pg_cron schedule.
