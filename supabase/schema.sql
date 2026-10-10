-- RaasLeela Garba Rental — Supabase schema
-- Supabase Dashboard > SQL Editor me ye poora copy-paste karke Run karo.

-- 1. Products table
create table if not exists public.products (
  id text primary key,
  name text not null,
  hindi text default '',
  category text not null check (category in ('women','men','kids','combo','premium')),
  rent3 int not null default 999,
  rent9 int not null default 1999,
  buy int not null default 2999,
  deposit int not null default 1500,
  rating numeric default 4.8,
  reviews int default 0,
  sizes text[] default array['M','L','XL'],
  colors text[] default array['Multicolor'],
  img text default '/images/g-hero.webp',
  badge text,
  "desc" text default '',
  fabric text default 'Cotton',
  accessories jsonb default '[]'::jsonb,
  images jsonb default '[]'::jsonb,
  stock int default 5,
  active boolean default true,
  created_at timestamptz default now()
);

-- 2. Bookings table (website form + cart checkout dono yahi save honge)
create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  order_id text default '',
  name text not null,
  phone text not null,
  category text default '',
  size text default '',
  event_date date,
  plan text default '3 days (standard)',
  note text default '',
  items jsonb default '[]'::jsonb,
  subtotal int default 0,
  total int default 0,
  token_amount int default 0,
  deposit int default 0,
  deposit_status text default 'pending',
  payment_mode text default 'pending',
  payment_id text default '',
  payment_status text default 'pending',
  status text default 'new' check (status in ('new','confirmed','delivered','returned','cancelled')),
  created_at timestamptz default now()
);

-- 3. RLS enable
alter table public.products enable row level security;
alter table public.bookings enable row level security;

-- 4. Public read products (shop sabko dikhe), write sirf authenticated (admin)
drop policy if exists "public read products" on public.products;
create policy "public read products"
  on public.products for select
  using (true);

drop policy if exists "admin write products" on public.products;
create policy "admin write products"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- 5. Bookings: koi bhi insert kar sakta hai (public form), read/update sirf admin
drop policy if exists "anyone can book" on public.bookings;
create policy "anyone can book"
  on public.bookings for insert
  with check (true);

drop policy if exists "admin read bookings" on public.bookings;
create policy "admin read bookings"
  on public.bookings for select
  to authenticated
  using (true);

drop policy if exists "admin update bookings" on public.bookings;
create policy "admin update bookings"
  on public.bookings for update
  to authenticated
  using (true)
  with check (true);

-- 6. Seed: existing 16 products (id same RL-01...)
insert into public.products (id, name, hindi, category, rent3, rent9, buy, deposit, rating, reviews, sizes, colors, img, badge, "desc", fabric, stock) values
('RL-01','Mirror-Work Rainbow Chaniya Choli','Multicolor sheesha work','women',1499,2999,4999,2000,4.9,412,array['S','M','L','XL'],array['Multicolor','Red','Pink'],'/images/g-hero.webp','BESTSELLER','Original mirror work, 8m ghera, padded blouse + latkan + bandhani dupatta included.','Cotton + Georgette',5),
('RL-02','Royal Kediyu Dhoti + Pagdi Set','Men traditional','men',999,1999,2999,1500,4.8,268,array['M','L','XL','XXL'],array['Yellow','Red','Green'],'/images/g-boys1.jpg','NEW','Angrakha-style kediyu, cotton dhoti, safa/pagdi + dupatta.','Cotton Silk',8),
('RL-03','Kids Princess Ghaghra (2–8 yrs)','Chhoti radha look','kids',799,1599,2499,1000,4.9,531,array['2-4Y','4-6Y','6-8Y'],array['Pink','Yellow','Orange'],'/images/g-girls1.webp','KIDS LOVE','Soft cotton lining, itch-free, elastic back. Hair accessory free.','Soft Cotton',10),
('RL-04','Couple Combo — Match & Twirl','2 dress + dandiya free','combo',2499,4499,7999,3000,5.0,189,array['M','L','XL'],array['Red-Gold','Green-Yellow'],'/images/g-combo1.jpg','SAVE 30%','Her chaniya choli + his kediyu, color-coordinated. Dandiya pair + jewellery FREE.','Mixed Festive',4),
('RL-05','Bridal Navratri Designer Lehenga','Heavy premium look','premium',3499,6499,11999,4000,5.0,96,array['S','M','L'],array['Maroon-Gold','Wine'],'/images/g-koti.webp','PREMIUM','Designer boutique piece, hand embroidery, can-can flare.','Velvet + Net',2),
('RL-06','Black-White Modern Fusion Choli','Day-5 white special','women',1599,2999,5299,2000,4.7,203,array['S','M','L','XL'],array['Black-White'],'/images/g-whiteblack.webp',null,'Koti-style fusion, oxidised latkan.','Rayon + Koti',5),
('RL-07','Boys Yellow Angrakha Dhoti','Chhota kediyu','kids',899,1699,2699,1000,4.8,174,array['4-6Y','6-10Y','10-14Y'],array['Yellow','Orange'],'/images/g-angarkha.jpg',null,'School function + garba night dono ke liye perfect. Pagdi included.','Cotton',8),
('RL-08','Navy-Magenta Gujarati Chaniya','Classic garba','women',1299,2499,4299,2000,4.8,347,array['S','M','L','XL','XXL'],array['Navy-Magenta'],'/images/g-chaniya1.jpg',null,'Authentic Gujarati border, full flair.','Cotton',6),
('RL-09','Wine Koti-Style Lehenga','Koti jacket look','premium',2499,4699,7999,3500,4.9,142,array['M','L','XL'],array['Wine-Multi'],'/images/g-pinkmulti.webp','TRENDING','Long koti jacket + sleeveless choli + heavy ghaghra.','Georgette',3),
('RL-10','Men Green Bandhej Kediyu','Bandhej special','men',1099,2099,3299,1500,4.7,158,array['M','L','XL','XXL'],array['Green','Red'],'/images/g-kedia-green.jpg',null,'Rajasthani bandhej print, mirror buttons.','Cotton',7),
('RL-11','Mother-Daughter Same-Same Combo','Family goals','combo',2999,5499,8999,3000,5.0,88,array['Kids+M','Kids+L'],array['Pink-Multi','Red-Yellow'],'/images/g-combo3.jpg','FAMILY HIT','Maa-beti matching chaniya choli.','Cotton + Mirror',3),
('RL-12','Pink Multicolor Kids Lehenga','Twirl machine','kids',999,1899,2999,1000,4.8,226,array['2-4Y','4-8Y','8-12Y'],array['Pink-Multi'],'/images/g-kids1.webp',null,'Double-layer net flare. Dupatta attached.','Net + Cotton',9),
('RL-13','Multicolor Navratri Diva Set','Har din ke liye','women',1999,3699,6499,2500,4.9,117,array['S','M','L'],array['White-Black'],'/images/g-multi2.webp',null,'Shubh multicolor combo, oxidised jewellery ke saath best.','Chanderi',4),
('RL-14','Boys Group Pack (5 Kediyu)','Society / school','men',3999,7499,12999,5000,4.9,64,array['M','L','XL'],array['Mixed'],'/images/g-boys2.jpg','BULK 25% OFF','5 same-color kediyu set. Group performance ke liye.','Cotton',5),
('RL-15','Red-Yellow Traditional Ghaghra','Evergreen','women',1399,2599,4499,2000,4.8,295,array['S','M','L','XL','XXL'],array['Red-Yellow'],'/images/g-girls2.jpg',null,'Sabse zyada re-rented design. Gamthi print.','Pure Cotton',6),
('RL-16','Golden Diva Premium Choli','Garba queen','premium',2999,5599,9499,4000,5.0,73,array['S','M','L'],array['Gold-Maroon'],'/images/g-chaniya2.webp','LIMITED','Zari + sequin handwork. Dry-cleaned + steam-pressed.','Silk + Zari',2)
on conflict (id) do nothing;

-- 7. Product images bucket (optional — agar Supabase Storage se upload karna ho)
insert into storage.buckets (id, name, public)
values ('product-images','product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read images" on storage.objects;
create policy "public read images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "admin upload images" on storage.objects;
create policy "admin upload images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

-- 8. Deliveries — live agent tracking (owner map + customer link)
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

alter table public.deliveries enable row level security;

-- agent phone se location update kar sake (public link), owner admin se dekhe
drop policy if exists "public delivery upsert" on public.deliveries;
create policy "public delivery upsert"
  on public.deliveries for all
  using (true)
  with check (true);
