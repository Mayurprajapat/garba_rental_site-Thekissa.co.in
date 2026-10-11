-- TheKissa.co — Live sync (Realtime) ke liye migration
-- Dashboard > SQL Editor me Run karo (safe: hai to skip, dobara Run se kuch nahi bigdega).
-- (SETUP_ONCE.sql me ye sab already hai — sirf tab chalao jab SETUP_ONCE kabhi Run na hua ho.)
--
-- Ye kya karta hai: products + bookings tables ko Supabase Realtime publication me
-- jodta hai. Iske bina website ka "live update" (admin change → website turant,
-- naya order → admin panel turant) dusre device par kaam nahi karega.
-- Privacy safe hai: Realtime RLS follow karta hai —
--   products = public read (shop sabko dikhta hai, to live bhi sabko milega)
--   bookings = anon read band (customer ko kuch leak nahi hoga;
--             login admin ko apne session me live updates milenge)

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end
$$;
