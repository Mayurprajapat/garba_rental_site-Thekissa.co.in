-- TheKissa.co — UTR reuse guard ke liye migration
-- Dashboard > SQL Editor me Run karo (safe: hai to skip, dobara Run se kuch nahi bigdega).
-- (SETUP_ONCE.sql me ye sab already hai — sirf tab chalao jab SETUP_ONCE kabhi Run na hua ho.)
--
-- Ye function sirf true/false deta hai (UTR used ya nahi) — koi booking data public nahi hota.

create or replace function public.check_utr_used(p_utr text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bookings b
    where b.payment_id = trim(coalesce(p_utr, '')) and trim(coalesce(p_utr, '')) <> ''
  );
$$;

revoke all on function public.check_utr_used(text) from public;
grant execute on function public.check_utr_used(text) to anon, authenticated;
