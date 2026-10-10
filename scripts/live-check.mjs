const base = 'https://garba-rental-website-phi.vercel.app';
const html = await (await fetch(base)).text();
const m = html.match(/assets\/index-[^"]+\.js/);
console.log('bundle:', m && m[0]);
if (!m) process.exit(2);
const js = await (await fetch(base + '/' + m[0])).text();
console.log('bundle bytes:', js.length);
const checks = [
  'shop-search', 'Search dress code', 'Browse collection',
  'Wishlist is empty', 'Drag to rotate', 'Kids dress',
  'Kediyu-Dhoti', 'kids jhumka', 'Mother-Daughter',
];
for (const s of checks) console.log(JSON.stringify(s), '=>', js.includes(s));
