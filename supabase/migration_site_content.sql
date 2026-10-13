-- TheKissa.co — Website content cloud sync (one-time)
-- ============================================================================
-- KYUN: Admin → Website → "Save — live on website" abhi sirf usi phone/browser
-- ke localStorage me save hota tha. Dusre phone ya customer ko change kabhi
-- nahi dikhta tha. Is table ke baad Save dabate hi content Supabase me jayega
-- aur website (sab devices par) turant update hogi.
--
-- KAISE: Supabase Dashboard > SQL Editor > New query me is POORI file ko
-- copy-paste karke ek baar Run karo — bas. Dobara Run karna safe hai.
-- ============================================================================

create table if not exists public.site_content (
  id int primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.site_content enable row level security;

-- Website sabko dikhe (bina login ke padh sakte hain)
drop policy if exists "public read site_content" on public.site_content;
create policy "public read site_content" on public.site_content for select using (true);

-- Likhe sirf login admin (Admin panel cloud mode me login hota hai)
drop policy if exists "admin write site_content" on public.site_content;
create policy "admin write site_content" on public.site_content for all to authenticated
  using (true) with check (true);

-- Realtime: admin Save dabaye → website turant update (dobara safe)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'site_content'
  ) then
    alter publication supabase_realtime add table public.site_content;
  end if;
end
$$;
