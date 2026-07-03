-- ============================================================
-- Idempotency guard: at most one deduction per (user, service, job)
--
-- Backs the insert-log-first flow in the deduct-credits edge function:
-- the log insert is the atomic claim on a bulk job's deduction, so the
-- live path, resume paths, and multiple tabs can all attempt to settle
-- the same job without double-charging.
--
-- BEFORE APPLYING, check for existing duplicates (must return 0 rows):
--   select user_id, service_type, reference_id, count(*)
--   from "luciAI_credit_usage_log"
--   where action = 'deduction' and reference_id is not null
--   group by 1, 2, 3 having count(*) > 1;
-- ============================================================

create unique index if not exists "uq_luciAI_usage_dedup"
  on "luciAI_credit_usage_log" (user_id, service_type, reference_id)
  where action = 'deduction' and reference_id is not null;
