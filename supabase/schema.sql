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
