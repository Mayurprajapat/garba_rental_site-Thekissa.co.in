// Supabase keys verify — VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY env se lekar
// check karta hai: (1) products public-read, (2) lookup RPCs maujood.
// Chalao:  $env:VITE_SUPABASE_URL='https://xyz.supabase.co'; $env:VITE_SUPABASE_ANON_KEY='eyJ...'; node scripts/verify-supabase.mjs
const url = (process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anon = process.env.VITE_SUPABASE_ANON_KEY || '';
if (!url || !anon) {
  console.error('MISSING: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env set karo.');
  process.exit(2);
}
const H = { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' };
let fail = 0;
const check = async (label, fn) => {
  try {
    const ok = await fn();
    console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}`);
    if (!ok) fail = 1;
  } catch (e) {
    console.log(`FAIL — ${label} (${e?.message || e})`);
    fail = 1;
  }
};
await check('products public-read (shop live)', async () => {
  const r = await fetch(`${url}/rest/v1/products?select=id&limit=1`, { headers: H });
  return r.status === 200;
});
await check('rpc get_my_orders_by_phone (My Orders lookup)', async () => {
  const r = await fetch(`${url}/rest/v1/rpc/get_my_orders_by_phone`, {
    method: 'POST', headers: H, body: JSON.stringify({ p_phone: '9999999999' }),
  });
  return r.status === 200;
});
await check('rpc check_utr_used (UTR guard)', async () => {
  const r = await fetch(`${url}/rest/v1/rpc/check_utr_used`, {
    method: 'POST', headers: H, body: JSON.stringify({ p_utr: '123456789012' }),
  });
  if (r.status !== 200) return false;
  return (await r.json()) === false;
});
console.log(fail ? 'RESULT: kuch fail — SQL setup / keys dobara dekho.' : 'RESULT: sab live — keys sahi hain.');
process.exit(fail);
