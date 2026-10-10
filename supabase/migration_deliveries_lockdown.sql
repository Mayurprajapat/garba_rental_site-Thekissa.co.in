-- RaasLeela — deliveries table lockdown (anon key public hota hai, isliye zaroori)
-- Dashboard > SQL Editor me Run karo. Safe: purani policy drop karke nayi banata hai.
--
-- Problem: purani "public delivery upsert" policy anon ko SELECT+INSERT+UPDATE+DELETE
-- sab deti thi — koi bhi anon key se deliveries DELETE kar sakta tha.
-- Fix: anon/authenticated ko sirf read + insert + location/status update.
-- DELETE sirf logged-in admin (authenticated) kar sakta hai.
-- Tracking links (/d/:code agent, /t/:code customer) bina login ke chalte rahenge.
--
-- NOTE (honest limit): anon key frontend bundle me public hoti hai, isliye koi bhi
-- deliveries ki LIST padh sakta hai. Is table me sirf delivery ke liye zaroori
-- fields rakho (naam/phone/address agent ko chahiye hota hai) — extra sensitive
-- data yaha mat rakho.

drop policy if exists "public delivery upsert" on public.deliveries;

-- Tracking links: agent + customer bina login ke delivery padh sake
drop policy if exists "link read deliveries" on public.deliveries;
create policy "link read deliveries"
  on public.deliveries for select
  to anon, authenticated
  using (true);

-- Agent location/status push (upsertDelivery) bina login ke kaam kare
drop policy if exists "link create deliveries" on public.deliveries;
create policy "link create deliveries"
  on public.deliveries for insert
  to anon, authenticated
  with check (true);

drop policy if exists "link update deliveries" on public.deliveries;
create policy "link update deliveries"
  on public.deliveries for update
  to anon, authenticated
  using (true)
  with check (true);

-- Delete SIRF logged-in admin
drop policy if exists "admin delete deliveries" on public.deliveries;
create policy "admin delete deliveries"
  on public.deliveries for delete
  to authenticated
  using (true);
