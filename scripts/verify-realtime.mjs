// Realtime subscribe test — anon key se products + bookings channel join karke
// dekhta hai ki Supabase Realtime live hai ya nahi.
// Chalao: node scripts/verify-realtime.mjs (env me URL + ANON_KEY ho)
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || '';
const anon = process.env.VITE_SUPABASE_ANON_KEY || '';
if (!url || !anon) {
  console.error('MISSING: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env set karo.');
  process.exit(2);
}
const sb = createClient(url, anon);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const testChannel = (name, table) =>
  new Promise((resolve) => {
    let done = false;
    const finish = (ok, info) => {
      if (!done) { done = true; resolve({ name, ok, info }); }
    };
    try {
      const ch = sb
        .channel(name)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {})
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') { finish(true, 'subscribed'); sb.removeChannel(ch); }
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { finish(false, status); }
        });
      setTimeout(() => finish(false, 'timeout (15s) — Realtime reachable nahi'), 15000);
    } catch (e) {
      finish(false, String(e?.message || e));
    }
  });

const [p, b] = await Promise.all([testChannel('test-products', 'products'), testChannel('test-bookings', 'bookings')]);
console.log(`${p.ok ? 'PASS' : 'FAIL'} — realtime products channel (${p.info})`);
console.log(`${b.ok ? 'PASS' : 'FAIL'} — realtime bookings channel (${b.info})`);
const fail = p.ok && b.ok ? 0 : 1;
console.log(fail ? 'RESULT: Realtime issue — migration_realtime.sql Run hua ya nahi dekho.' : 'RESULT: Realtime live — admin change turant website par dikhega.');
process.exit(fail);
