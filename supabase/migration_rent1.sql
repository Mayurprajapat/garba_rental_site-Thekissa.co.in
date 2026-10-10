-- RaasLeela — 1-day rental plan ke liye migration
-- Dashboard > SQL Editor me Run karo (safe: column ho to skip).
-- Website ab sirf 1-day rent (rent1) use karti hai.

alter table public.products add column if not exists rent1 int default 999;
