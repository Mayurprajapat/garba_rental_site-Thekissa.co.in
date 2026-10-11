-- TheKissa.co — FRESH Supabase setup (client-handover ready)
-- Supabase Dashboard > SQL Editor > New query me poora copy-paste karke Run karo.
-- Ye file: saari tables + saare columns + safe RLS + current 11 ladies products seed.
-- Purane schema.sql / migration files ki zaroorat nahi — ye sab kuch cover karta hai.
-- Koi fake booking seed NAHI hai — bookings table khaali start hogi.

-- ============ 1. Products ============
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

-- ============ 2. Bookings ============
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
  status text default 'new' check (status in ('new','confirmed','delivered','returned','cancelled')),
  created_at timestamptz default now()
);

-- ============ 3. Deliveries (live tracking) ============
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

-- ============ 4. RLS ============
alter table public.products enable row level security;
alter table public.bookings enable row level security;
alter table public.deliveries enable row level security;

-- Products: shop sabko dikhe, likhe sirf login admin
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (true);
drop policy if exists "admin write products" on public.products;
create policy "admin write products" on public.products for all to authenticated using (true) with check (true);

-- Bookings: website se sirf INSERT (basic sanity: naam 3+ akshar, phone 10+ digit).
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

-- Deliveries: tracking links bina login ke chalne chahiye (agent/customer ke paas login nahi hota),
-- isliye read+insert+update open hai. DELETE sirf login admin.
-- NOTE: is table me sirf delivery kaam ka data rakho (naam/phone/address agent ko chahiye hota hai).
drop policy if exists "public delivery upsert" on public.deliveries;
drop policy if exists "link read deliveries" on public.deliveries;
create policy "link read deliveries" on public.deliveries for select to anon, authenticated using (true);
drop policy if exists "link create deliveries" on public.deliveries;
create policy "link create deliveries" on public.deliveries for insert to anon, authenticated with check (true);
drop policy if exists "link update deliveries" on public.deliveries;
create policy "link update deliveries" on public.deliveries for update to anon, authenticated using (true) with check (true);
drop policy if exists "admin delete deliveries" on public.deliveries;
create policy "admin delete deliveries" on public.deliveries for delete to authenticated using (true);

-- ============ 5. Product images bucket ============
insert into storage.buckets (id, name, public)
values ('product-images','product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read images" on storage.objects;
create policy "public read images" on storage.objects for select using (bucket_id = 'product-images');
drop policy if exists "admin upload images" on storage.objects;
create policy "admin upload images" on storage.objects for all to authenticated
  using (bucket_id = 'product-images') with check (bucket_id = 'product-images');

-- ============ 6. Seed: current 11 ladies products (website wala catalog) ============
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

-- ============ 7. Handover checklist (Dashboard me, 2 min) ============
-- a) Authentication > Users > Add user > client ka admin email + strong password > Add.
-- b) Authentication > Sign In / Sign Up > Email provider > "Allow new users to sign up" OFF > Save.
--    (Isse koi anjaan account bana ke bookings nahi padh payega.)
-- c) Upar (a) wala email+password Admin panel login me kaam karega (cloud mode auto-detect).
