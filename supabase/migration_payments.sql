-- RaasLeela — existing Supabase DB ke liye migration
-- Dashboard > SQL Editor me Run karo (safe: agar column hai to skip).
-- Fresh setup walo ko kuch nahi karna, schema.sql me already hai.

alter table public.bookings add column if not exists order_id text default '';
alter table public.bookings add column if not exists token_amount int default 0;
alter table public.bookings add column if not exists payment_mode text default 'pending';
alter table public.bookings add column if not exists payment_id text default '';
alter table public.bookings add column if not exists payment_status text default 'pending';
-- Purane DB me ye bhi missing ho sakte hain (deposit flow baad me juda tha)
alter table public.bookings add column if not exists deposit int default 0;
alter table public.bookings add column if not exists deposit_status text default 'pending';
alter table public.bookings add column if not exists subtotal int default 0;
alter table public.bookings add column if not exists total int default 0;
alter table public.bookings add column if not exists items jsonb default '[]'::jsonb;
alter table public.bookings add column if not exists category text default '';
alter table public.bookings add column if not exists size text default '';
alter table public.bookings add column if not exists event_date date;
alter table public.bookings add column if not exists plan text default '3 days (standard)';
alter table public.bookings add column if not exists note text default '';
alter table public.bookings add column if not exists status text default 'new';

-- purani rows me order_id khaali ho to id se backfill (optional)
update public.bookings
set order_id = 'RL-2026-' || lpad((id % 9000 + 1000)::text, 4, '0')
where order_id is null or order_id = '';
