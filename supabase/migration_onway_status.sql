-- TheKissa.co — "On the way" order status ke liye migration
-- Dashboard > SQL Editor me Run karo (safe: dobara Run se kuch nahi bigdega).
-- (SETUP_ONCE.sql me ye sab already hai — sirf tab chalao jab SETUP_ONCE kabhi Run na hua ho.)
--
-- Ye kya karta hai: bookings.status wale purane rule ko naye rule se badalta hai
-- taaki admin panel se order ko 'onway' (On the way — arriving soon) par set
-- kiya ja sake. Bina iske cloud 'onway' save karne se mana karega.
-- Koi booking DELETE/CHANGE nahi hoti — sirf rule update hota hai.

do $$
declare r record;
begin
  -- status par laga purana check rule dhundhkar hatao (naam jo bhi ho)
  for r in
    select conname from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.bookings drop constraint %I', r.conname);
  end loop;
  -- naya rule: onway samet 6 statuses
  alter table public.bookings
    add constraint bookings_status_check
    check (status in ('new','confirmed','onway','delivered','returned','cancelled'));
end
$$;
