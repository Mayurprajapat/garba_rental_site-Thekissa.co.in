-- TheKissa.co — compulsory UTR + payment screenshot ke liye migration
-- Dashboard > SQL Editor me Run karo (safe: hai to skip, dobara Run se kuch nahi bigdega).
-- (SETUP_ONCE.sql me ye sab already hai — sirf tab chalao jab SETUP_ONCE kabhi Run na hua ho.)

alter table public.bookings add column if not exists promo_code text default '';
alter table public.bookings add column if not exists payment_proof text default '';

insert into storage.buckets (id, name, public)
values ('payment-proofs','payment-proofs', true)
on conflict (id) do nothing;

drop policy if exists "public read proofs" on storage.objects;
create policy "public read proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');

drop policy if exists "anon upload proofs" on storage.objects;
create policy "anon upload proofs"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'payment-proofs');
