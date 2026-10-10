// Temporary check: har category tile me kam se kam 1 result aana chahiye (ladies-only catalog).
function matchesCategory(hayLower, query) {
  const parts = query.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return true;
  return parts.some((part) => part.split(/\s+/).filter(Boolean).every((w) => hayLower.includes(w)));
}

const W = ['bandhani dupatta', 'latkan + dori', 'oxidised jhumka', 'kamarbandh (tagdi)', 'dandiya pair'];
const P = ['designer dupatta + latkan', 'jewellery set', 'kamarbandh (tagdi)', 'dandiya pair'];

const PRODUCTS = [
  ['RL-01', 'Mirror-Work Rainbow Chaniya Choli', 'Multicolor mirror work', 'women', 'Original mirror work, 8m flare, padded blouse + latkan + bandhani dupatta included.', 'Cotton + Georgette', 'Multicolor Red Pink', W],
  ['RL-05', 'Bridal Navratri Designer Lehenga', 'Heavy premium look', 'premium', 'Designer boutique piece, hand embroidery, can-can flare. Jewellery set free*.', 'Velvet + Net', 'Maroon-Gold Wine', P],
  ['RL-06', 'Black-White Modern Fusion Choli', 'Day-5 white special', 'women', 'Koti-style fusion with oxidised latkan. Stands out most in photos.', 'Rayon + Koti', 'Black-White', W],
  ['RL-08', 'Navy-Magenta Gujarati Chaniya', 'Classic garba', 'women', 'Authentic Gujarati border with full flair. Most comfortable for beginners.', 'Cotton', 'Navy-Magenta', W],
  ['RL-09', 'Wine Koti-Style Lehenga', 'Koti jacket look', 'premium', 'Long koti jacket + sleeveless choli + heavy ghaghra. Stage performance hit.', 'Georgette', 'Wine-Multi', P],
  ['RL-13', 'Multicolor Navratri Diva Set', 'For every day', 'women', 'Auspicious multicolor combo - looks best with oxidised jewellery.', 'Chanderi', 'White-Black', [...W, 'Jewellery set']],
  ['RL-15', 'Red-Yellow Traditional Ghaghra', 'Evergreen', 'women', 'Our most re-rented design. Gamthi print, full comfort.', 'Pure Cotton', 'Red-Yellow', W],
  ['RL-16', 'Golden Diva Premium Choli', 'Garba queen', 'premium', 'Zari + sequin handwork. Steals the spotlight on entry. Dry-cleaned + steam-pressed.', 'Silk + Zari', 'Gold-Maroon', P],
  ['RL-17', 'Red Embroidered Padded Blouse', 'Solo blouse', 'women', 'Padded designer blouse with back dori and latkan. Pairs with any chaniya.', 'Cotton Silk', 'Red Gold', ['Back dori + latkan', 'Oxidised Jhumka - Pearl Drop']],
  ['RL-23', 'Teal Mirror Koti Jacket Set', 'Jacket style', 'women', 'Long mirror-work koti jacket with inner and flared skirt. Stage-ready look.', 'Georgette + Koti', 'Teal-Gold', ['Koti jacket + inner', 'Designer dupatta', 'Dandiya pair']],
  ['RL-24', 'Maroon Velvet Bridal Lehenga', 'Bridal special', 'premium', 'Heavy velvet bridal lehenga with zari border and can-can flare. Kundan jewellery set available as add-on.', 'Velvet + Zari', 'Maroon-Gold', ['Designer dupatta + latkan', 'Gold Kamarbandh', 'Kundan Jewellery Set']],
];

const CATS = [
  ['chaniya', 'dress', 'chaniya, choli, ghaghra, diva', null],
  ['choli', 'dress', 'choli', null],
  ['blouse', 'dress', 'blouse', null],
  ['ghaghra', 'dress', 'ghaghra, lehenga', null],
  ['koti', 'dress', 'koti', null],
  ['dupatta', 'dress', 'dupatta, bandhani', null],
  ['dandiya', 'dress', 'dandiya', null],
  ['bridal', 'dress', '', ['premium']],
  ['jewellery', 'item', 'jewellery set, necklace, haar', null],
  ['jhumka', 'item', 'oxidised jhumka', null],
  ['kamarbandh', 'item', 'kamarbandh, tagdi', null],
];

const SINGLES = ['oxidised jhumka', 'kamarbandh (tagdi)', 'oxidised jhumka - pearl drop', 'gold kamarbandh', 'kundan jewellery set'];

// No mens/kids content should remain
const BANNED = [/kediyu/i, /dhoti/i, /pagdi/i, /safa/i, /mojari/i, /brooch/i, /boys/i, /\bkids?\b/i, /couple/i, /groom/i, /dulha/i, /\bmen\b/i, /mother/i, /daughter/i, /family/i];
const hayOne = (p) => [p[1], p[2], p[0], p[4], p[5], p[6], p[7].join(' ')].join(' ').toLowerCase();
let bannedHits = [];
for (const re of BANNED) {
  const idx = PRODUCTS.map((p) => re.test(hayOne(p)) ? p[0] : null).filter(Boolean);
  if (idx.length) bannedHits.push(`${re} in ${idx.join(',')}`);
}
const catIds = CATS.map((c) => c[0]);
for (const bad of ['kediyu', 'dhoti', 'pagdi', 'mojari', 'brooch', 'couple', 'family', 'kids-girls', 'kids-boys', 'kids-jhumka']) {
  if (catIds.includes(bad)) bannedHits.push(`tile still present: ${bad}`);
}

let fail = 0;
for (const [id, kind, q, cats] of CATS) {
  let hits;
  if (kind === 'dress') {
    hits = PRODUCTS.filter((p) => {
      if (cats && !cats.includes(p[3])) return false;
      const hay = [p[1], p[2], p[0], p[4], p[3], p[5], p[6], p[7].join(' ')].join(' ').toLowerCase();
      return matchesCategory(hay, q);
    }).map((p) => p[0]);
  } else {
    hits = SINGLES.filter((n) => !q.trim() || matchesCategory(n.toLowerCase(), q));
  }
  const ok = hits.length > 0 ? 'OK  ' : 'EMPTY';
  if (!hits.length) fail++;
  console.log(`${ok} ${id} (${hits.length}): ${hits.join(', ')}`);
}
if (bannedHits.length) {
  fail += bannedHits.length;
  console.log('BANNED CONTENT FOUND:');
  bannedHits.forEach((h) => console.log(`  XX ${h}`));
}
console.log(fail === 0 ? 'ALL CLEAR: ladies-only, all tiles non-empty' : `${fail} PROBLEMS`);
process.exit(fail === 0 ? 0 : 1);
