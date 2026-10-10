-- TheKissa.co — bookings me delivery address column
-- Dashboard > SQL Editor me Run karo (safe: agar column hai to skip).
-- Checkout me customer apna delivery address bharega, admin ko
-- Bookings me dikhega aur dispatch WhatsApp message me auto-judega.

alter table public.bookings add column if not exists address text default '';
