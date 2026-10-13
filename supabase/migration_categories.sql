-- TheKissa.co — Shop category tiles cloud sync (one-time)
-- ============================================================================
-- KYUN: Admin → Categories me tile (naam/photo/keyword/Strict) badlo to abhi
-- sirf usi phone/browser me save hota tha. Dusre phone ya customer ko change
-- kabhi nahi dikhta tha. Is table ke baad tile changes Supabase me jayenge
-- aur shop (sab devices par) turant update hogi.
--
-- KAISE: Supabase Dashboard > SQL Editor > New query me is POORI file ko
-- copy-paste karke ek baar Run karo — bas. Dobara Run karna safe hai.
-- ============================================================================

create table if not exists public.categories (
  id int primary key check (id = 1),
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);

alter table public.categories enable row level security;

-- Website sabko dikhe (bina login ke padh sakte hain)
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);

-- Likhe sirf login admin (Admin panel cloud mode me login hota hai)
drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories for all to authenticated
  using (true) with check (true);

-- Realtime: admin tile badle → shop turant update (dobara safe)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;
end
$$;
