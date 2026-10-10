-- TheKissa.co — bookings me admin reply (customer message) column
-- Dashboard > SQL Editor me Run karo (safe: agar column hai to skip).
-- Admin panel → Bookings → Customer reply me jo message likha jayega,
-- customer ko My Orders me dikhega + WhatsApp par bheja ja sakega.

alter table public.bookings add column if not exists admin_note text default '';
