-- TheKissa.co — bookings me "order ready by" date column
-- Dashboard > SQL Editor me Run karo (safe: agar column hai to skip).
-- Admin panel → Bookings me har order ke liye ready date set hogi,
-- customer ko My Orders me "Available by <date>" dikhega.

alter table public.bookings add column if not exists ready_date date;
