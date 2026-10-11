const base = 'https://thekissa.co.in';
const html = await (await fetch(base)).text();
const first = [...html.matchAll(/assets\/[a-zA-Z0-9_-]+\.js/g)].map((m) => m[0]);
const all = new Set(first);
for (const a of first) {
  const js = await (await fetch(base + '/' + a)).text();
  for (const m of js.matchAll(/assets\/[a-zA-Z0-9_-]+\.js/g)) all.add(m[0]);
}
const found = {};
for (const a of all) {
  const js = await (await fetch(base + '/' + a)).text();
  for (const s of ['thekissa/garba', 'broker.hivemq', 'Load demo delivery', 'Run demo trip']) {
    if (js.includes(s)) { (found[s] = found[s] || []).push(a.split('/').pop()); }
  }
}
for (const [k, v] of Object.entries(found)) console.log(JSON.stringify(k), '=> LIVE in', v.join(','));
const missing = ['thekissa/garba', 'Load demo delivery', 'Run demo trip'].filter((w) => !found[w]);
console.log(missing.length ? 'MISSING: ' + missing.join(', ') : 'LIVE TRACKING LAYER CONFIRMED LIVE');
process.exit(missing.length ? 1 : 0);
