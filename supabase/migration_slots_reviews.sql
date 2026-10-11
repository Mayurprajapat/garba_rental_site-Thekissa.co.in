-- TheKissa.co — slot availability + photo reviews ke liye migration
-- Dashboard > SQL Editor me Run karo (safe: hai to skip, dobara Run se kuch nahi bigdega).
-- (SETUP_ONCE.sql me ye sab already hai — sirf tab chalao jab SETUP_ONCE kabhi Run na hua ho.)

-- 1. Availability aggregates (koi PII public nahi — sirf date/product/qty)
create or replace function public.get_availability(p_from date, p_to date)
returns table (event_date date, product_id text, qty int)
language sql
security definer
set search_path = public
as $$
  select b.event_date,
         it->>'id' as product_id,
         sum(case when it->>'qty' ~ '^[0-9]+$' then (it->>'qty')::int else 1 end)::int as qty
  from public.bookings b,
       jsonb_array_elements(coalesce(b.items, '[]'::jsonb)) as it
  where b.status <> 'cancelled'
    and b.event_date between p_from and p_to
    and it->>'id' is not null
  group by b.event_date, it->>'id';
$$;

revoke all on function public.get_availability(date, date) from public;
grant execute on function public.get_availability(date, date) to anon, authenticated;

-- 2. Photo reviews table
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  product_id text not null,
  name text not null,
  rating int not null check (rating between 1 and 5),
  text text default '',
  photo_url text default '',
  status text default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

drop policy if exists "anyone can review" on public.reviews;
create policy "anyone can review" on public.reviews for insert to anon, authenticated
  with check (char_length(name) >= 2 and rating between 1 and 5 and char_length(text) <= 1000);
drop policy if exists "public read approved reviews" on public.reviews;
create policy "public read approved reviews" on public.reviews for select to anon, authenticated
  using (status = 'approved');
drop policy if exists "admin manage reviews" on public.reviews;
create policy "admin manage reviews" on public.reviews for all to authenticated
  using (true) with check (true);

-- 3. Review photos bucket
insert into storage.buckets (id, name, public)
values ('review-photos','review-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read review photos" on storage.objects;
create policy "public read review photos"
  on storage.objects for select
  using (bucket_id = 'review-photos');

drop policy if exists "anon upload review photos" on storage.objects;
create policy "anon upload review photos"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'review-photos');
