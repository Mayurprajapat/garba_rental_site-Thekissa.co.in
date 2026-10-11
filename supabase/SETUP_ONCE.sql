-- TheKissa.co — COMPLETE one-time setup (client handover)
-- ============================================================================
-- CLIENT KE LIYE: Supabase Dashboard > SQL Editor > New query me is POORI file
-- ko copy-paste karke ek baar Run karo — bas, ho gaya. Dobara chalane ki
-- zaroorat kabhi nahi padegi (ye file safe hai: dobara Run karo to bhi kuch
-- nahi bigdega — tables/columns/policies sab "agar hai to skip" wale hain).
--
-- Is ek file me sab kuch hai:
--   1. products / bookings / deliveries tables (saare columns ke saath)
--   2. purane DB ho to missing columns auto-add (saare migration_*.sql wale)
--   3. safe RLS policies (bookings public-read band, admin-only)
--   4. customer self-lookup functions (My Orders: mobile number / Order ID se,
--      bina poori table public kiye — alag phone par order dekhne ke liye)
--   5. product-images bucket + current 11 ladies products seed (sirf khaali ho to)
--   6. purani bookings me order_id khaali ho to auto-backfill
--
-- Purani migration_*.sql / schema*.sql files ab chhune ki zaroorat NAHI —
-- ye file un sabko cover karti hai. Koi booking/product DELETE nahi hota.
-- ============================================================================

-- ============ 1. Products table (saare columns) ============
create table if not exists public.products (
  id text primary key,
  name text not null,
  hindi text default '',
  category text not null check (category in ('women','men','kids','combo','premium')),
  rent1 int not null default 999,
  rent3 int not null default 999,
  rent9 int not null default 1999,
  buy int not null default 2999,
  deposit int not null default 1500,
  rating numeric default 4.8,
  reviews int default 0,
  sizes text[] default array['S','M','L','XL'],
  colors text[] default array['Multicolor'],
  img text default '/images/g-hero.webp',
  images jsonb default '[]'::jsonb,
  badge text,
  "desc" text default '',
  fabric text default 'Cotton',
  accessories jsonb default '[]'::jsonb,
  stock int default 5,
  active boolean default true,
  created_at timestamptz default now()
);

-- Purane DB me naye columns missing hon to jod do (dobara safe)
alter table public.products add column if not exists rent1 int default 999;
alter table public.products add column if not exists rent3 int default 999;
alter table public.products add column if not exists rent9 int default 1999;
alter table public.products add column if not exists accessories jsonb default '[]'::jsonb;
alter table public.products add column if not exists images jsonb default '[]'::jsonb;

-- ============ 2. Bookings table (saare columns) ============
create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  order_id text default '',
  name text not null,
  phone text not null,
  category text default '',
  size text default '',
  event_date date,
  plan text default '1 day (fixed)',
  note text default '',
  address text default '',
  items jsonb default '[]'::jsonb,
  subtotal int default 0,
  total int default 0,
  token_amount int default 0,
  deposit int default 0,
  deposit_status text default 'pending',
  payment_mode text default 'pending',
  payment_id text default '',
  payment_status text default 'pending',
  ready_date date,
  admin_note text default '',
  promo_code text default '',
  status text default 'new' check (status in ('new','confirmed','delivered','returned','cancelled')),
  created_at timestamptz default now()
);

-- Purane DB me missing columns hon to jod do (dobara safe)
alter table public.bookings add column if not exists order_id text default '';
alter table public.bookings add column if not exists category text default '';
alter table public.bookings add column if not exists size text default '';
alter table public.bookings add column if not exists event_date date;
alter table public.bookings add column if not exists plan text default '1 day (fixed)';
alter table public.bookings add column if not exists note text default '';
alter table public.bookings add column if not exists address text default '';
alter table public.bookings add column if not exists items jsonb default '[]'::jsonb;
alter table public.bookings add column if not exists subtotal int default 0;
alter table public.bookings add column if not exists total int default 0;
alter table public.bookings add column if not exists token_amount int default 0;
alter table public.bookings add column if not exists deposit int default 0;
alter table public.bookings add column if not exists deposit_status text default 'pending';
alter table public.bookings add column if not exists payment_mode text default 'pending';
alter table public.bookings add column if not exists payment_id text default '';
alter table public.bookings add column if not exists payment_status text default 'pending';
alter table public.bookings add column if not exists ready_date date;
alter table public.bookings add column if not exists admin_note text default '';
alter table public.bookings add column if not exists promo_code text default '';
alter table public.bookings add column if not exists status text default 'new';

-- ============ 3. Deliveries table (live tracking) ============
create table if not exists public.deliveries (
  code text primary key,
  booking_id text default '',
  customer text default '',
  phone text default '',
  address text default '',
  dest_lat double precision default 22.7196,
  dest_lng double precision default 75.8577,
  agent text default '',
  agent_phone text default '',
  status text default 'assigned' check (status in ('assigned','picked','onway','delivered')),
  agent_lat double precision,
  agent_lng double precision,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============ 4. RLS + policies (safe, dobara Run karne par bhi same) ============
alter table public.products enable row level security;
alter table public.bookings enable row level security;
alter table public.deliveries enable row level security;

-- Products: shop sabko dikhe, likhe sirf login admin
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (true);
drop policy if exists "admin write products" on public.products;
create policy "admin write products" on public.products for all to authenticated using (true) with check (true);

-- Bookings: website se sirf INSERT (naam 3+ akshar, phone 10+ digit).
-- READ/UPDATE/DELETE sirf login admin. Anon SELECT policy NAHI hai = public list bilkul band.
drop policy if exists "anyone can book" on public.bookings;
create policy "anyone can book" on public.bookings for insert
  with check (char_length(name) >= 3 and char_length(phone) >= 10);
drop policy if exists "admin read bookings" on public.bookings;
create policy "admin read bookings" on public.bookings for select to authenticated using (true);
drop policy if exists "admin update bookings" on public.bookings;
create policy "admin update bookings" on public.bookings for update to authenticated using (true) with check (true);
drop policy if exists "admin delete bookings" on public.bookings;
create policy "admin delete bookings" on public.bookings for delete to authenticated using (true);

-- Deliveries: tracking links bina login ke chalne chahiye (agent/customer ke paas login nahi hota).
-- read+insert+update open, DELETE sirf login admin.
drop policy if exists "public delivery upsert" on public.deliveries;
drop policy if exists "link read deliveries" on public.deliveries;
create policy "link read deliveries" on public.deliveries for select to anon, authenticated using (true);
drop policy if exists "link create deliveries" on public.deliveries;
create policy "link create deliveries" on public.deliveries for insert to anon, authenticated with check (true);
drop policy if exists "link update deliveries" on public.deliveries;
create policy "link update deliveries" on public.deliveries for update to anon, authenticated using (true) with check (true);
drop policy if exists "admin delete deliveries" on public.deliveries;
create policy "admin delete deliveries" on public.deliveries for delete to authenticated using (true);

-- ============ 5. Customer self-lookup (My Orders: dusre phone se bhi) ============
-- 2 SECURITY DEFINER functions — sirf matching phone / order_id wali rows dete hain,
-- poori bookings table kabhi public nahi khulti. Website ka "Find my orders" box inhi ko call karta hai.
create or replace function public.get_my_orders_by_phone(p_phone text)
returns setof public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  digits text;
begin
  digits := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  if char_length(digits) < 10 then
    return;
  end if;
  return query
  select *
  from public.bookings b
  where right(regexp_replace(coalesce(b.phone, ''), '\D', '', 'g'), 10) = digits
  order by b.created_at desc
  limit 20;
end;
$$;

create or replace function public.get_my_order_by_id(p_order_id text)
returns setof public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  needle text;
begin
  needle := upper(trim(coalesce(p_order_id, '')));
  if needle = '' then
    return;
  end if;
  return query
  select *
  from public.bookings b
  where upper(trim(coalesce(b.order_id, ''))) = needle
  limit 5;
end;
$$;

revoke all on function public.get_my_orders_by_phone(text) from public;
revoke all on function public.get_my_order_by_id(text) from public;
grant execute on function public.get_my_orders_by_phone(text) to anon, authenticated;
grant execute on function public.get_my_order_by_id(text) to anon, authenticated;

-- ============ 6. Product images bucket ============
insert into storage.buckets (id, name, public)
values ('product-images','product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read images" on storage.objects;
create policy "public read images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "admin upload images" on storage.objects;
create policy "admin upload images"
  on storage.objects for all to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

-- ============ 7. Seed: current 11 ladies products (sirf naye judenge, purane safe) ============
insert into public.products (id, name, hindi, category, rent1, rent3, rent9, buy, deposit, rating, reviews, sizes, colors, img, badge, "desc", fabric, accessories, stock, active) values
('RL-01','Mirror-Work Rainbow Chaniya Choli','Multicolor mirror work','women',899,1499,2999,4999,2000,4.9,412,array['S','M','L','XL'],array['Multicolor','Red','Pink'],'/images/g-hero.webp','BESTSELLER','Original mirror work, 8m flare, padded blouse + latkan + bandhani dupatta included.','Cotton + Georgette','[]',5,true),
('RL-05','Bridal Navratri Designer Lehenga','Heavy premium look','premium',2099,3499,6499,11999,4000,5.0,96,array['S','M','L'],array['Maroon-Gold','Wine'],'/images/g-koti.webp','PREMIUM','Designer boutique piece, hand embroidery, can-can flare. Jewellery set free*.','Velvet + Net','[]',5,true),
('RL-06','Black-White Modern Fusion Choli','Day-5 white special','women',959,1599,2999,5299,2000,4.7,203,array['S','M','L','XL'],array['Black-White'],'/images/g-whiteblack.webp',null,'Koti-style fusion with oxidised latkan. Stands out most in photos.','Rayon + Koti','[]',5,true),
('RL-08','Navy-Magenta Gujarati Chaniya','Classic garba','women',779,1299,2499,4299,2000,4.8,347,array['S','M','L','XL','XXL'],array['Navy-Magenta'],'/images/g-chaniya1.jpg',null,'Authentic Gujarati border with full flair. Most comfortable for beginners.','Cotton','[]',5,true),
('RL-09','Wine Koti-Style Lehenga','Koti jacket look','premium',1499,2499,4699,7999,3500,4.9,142,array['M','L','XL'],array['Wine-Multi'],'/images/g-pinkmulti.webp','TRENDING','Long koti jacket + sleeveless choli + heavy ghaghra. Stage performance hit.','Georgette','[]',5,true),
('RL-13','Multicolor Navratri Diva Set','For every day','women',1199,1999,3699,6499,2500,4.9,117,array['S','M','L'],array['White-Black'],'/images/g-multi2.webp',null,'Auspicious multicolor combo — looks best with oxidised jewellery.','Chanderi','[]',5,true),
('RL-15','Red-Yellow Traditional Ghaghra','Evergreen','women',839,1399,2599,4499,2000,4.8,295,array['S','M','L','XL','XXL'],array['Red-Yellow'],'/images/g-girls2.jpg',null,'Our most re-rented design. Gamthi print, full comfort.','Pure Cotton','[]',5,true),
('RL-16','Golden Diva Premium Choli','Garba queen','premium',1799,2999,5599,9499,4000,5.0,73,array['S','M','L'],array['Gold-Maroon'],'/images/g-chaniya2.webp','LIMITED','Zari + sequin handwork. Steals the spotlight on entry. Dry-cleaned + steam-pressed.','Silk + Zari','[]',5,true),
('RL-17','Red Embroidered Padded Blouse','Solo blouse','women',299,499,999,1499,500,4.7,58,array['S','M','L','XL'],array['Red','Gold'],'/images/g-chaniya2.webp','NEW','Padded designer blouse with back dori and latkan. Pairs with any chaniya.','Cotton Silk','[{"name":"Back dori + latkan","tag":"included"},{"name":"Oxidised Jhumka - Pearl Drop","tag":"addon","price":129}]',5,true),
('RL-23','Teal Mirror Koti Jacket Set','Jacket style','women',899,1499,2799,4799,2000,4.8,89,array['S','M','L'],array['Teal-Gold'],'/images/g-whiteblack.webp','TRENDING','Long mirror-work koti jacket with inner and flared skirt. Stage-ready look.','Georgette + Koti','[{"name":"Koti jacket + inner","tag":"included"},{"name":"Designer dupatta","tag":"included"},{"name":"Dandiya pair","tag":"free"}]',5,true),
('RL-24','Maroon Velvet Bridal Lehenga','Bridal special','premium',1899,3199,5999,10999,4000,5.0,73,array['S','M','L'],array['Maroon-Gold'],'/images/g-hero.webp','PREMIUM','Heavy velvet bridal lehenga with zari border and can-can flare. Kundan jewellery set available as add-on.','Velvet + Zari','[{"name":"Designer dupatta + latkan","tag":"included"},{"name":"Gold Kamarbandh","tag":"addon","price":199},{"name":"Kundan Jewellery Set","tag":"addon","price":299}]',5,true)
on conflict (id) do nothing;

-- ============ 8. Purani bookings me order_id khaali ho to backfill (data safe) ============
update public.bookings
set order_id = 'RL-2026-' || lpad((id % 9000 + 1000)::text, 4, '0')
where order_id is null or order_id = '';

-- ============ DONE — dobara Run karne ki zaroorat nahi ============
-- Handover checklist (sirf ek baar, 2 min):
-- a) Authentication > Users > client ka admin email + strong password > Add.
-- b) Authentication > Sign In / Sign Up > Email provider > "Allow new users to sign up" OFF > Save.
