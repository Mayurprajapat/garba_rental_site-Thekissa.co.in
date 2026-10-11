-- Customer apne orders khud dekh sake (My Orders recovery) — bina login ke,
-- bina poori bookings table public kiye.
-- Ye 2 SECURITY DEFINER functions sirf matching phone / order_id wali rows dete hain.
-- Supabase Dashboard > SQL Editor me copy-paste karke Run karo.
-- (Na chalane par bhi website chalti rahegi — sirf same-device local history dikhegi.)

-- Phone se lookup: last-10-digit match (country code +91 handle hota hai)
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

-- Order ID se lookup: exact match (case-insensitive)
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

-- Anon users ko sirf ye 2 functions chalane do (table par SELECT policy mat kholo)
revoke all on function public.get_my_orders_by_phone(text) from public;
revoke all on function public.get_my_order_by_id(text) from public;
grant execute on function public.get_my_orders_by_phone(text) to anon, authenticated;
grant execute on function public.get_my_order_by_id(text) to anon, authenticated;
