const base = 'https://garba-rental-website-phi.vercel.app';
const html = await (await fetch(base)).text();
const first = [...html.matchAll(/assets\/[a-zA-Z0-9_-]+\.js/g)].map((m) => m[0]);
const all = new Set(first);
for (const a of first) {
  const js = await (await fetch(base + '/' + a)).text();
  for (const m of js.matchAll(/assets\/[a-zA-Z0-9_-]+\.js/g)) all.add(m[0]);
}
console.log('total chunks:', all.size);
const found = {};
for (const a of all) {
  const js = await (await fetch(base + '/' + a)).text();
  for (const s of ['Load demo delivery', 'Start live location', 'Run demo trip', 'Live delivery', 'Delivery agent', 'agent link']) {
    if (js.includes(s)) { (found[s] = found[s] || []).push(a.split('/').pop()); }
  }
}
for (const [k, v] of Object.entries(found)) console.log(JSON.stringify(k), '=> LIVE in', v.join(','));
const want = ['Load demo delivery', 'Start live location', 'Run demo trip', 'Live delivery'];
const missing = want.filter((w) => !found[w]);
console.log(missing.length ? 'MISSING: ' + missing.join(', ') : 'ALL TRACKING STRINGS LIVE');
process.exit(missing.length ? 1 : 0);
