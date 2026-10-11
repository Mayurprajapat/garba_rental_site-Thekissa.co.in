export type Category = 'women' | 'men' | 'kids' | 'combo' | 'premium';

export interface Accessory {
  name: string;
  tag: 'included' | 'free' | 'addon';
  price?: number;
  // Photo hotspot (% me) — khaali ho to naam se auto position lagti hai
  x?: number;
  y?: number;
}

export interface Product {
  id: string;
  name: string;
  hindi: string;
  category: Category;
  rent1: number;
  rent3: number;
  rent9: number;
  buy: number;
  deposit: number;
  rating: number;
  reviews: number;
  sizes: string[];
  colors: string[];
  img: string;
  // Extra angle photos (gallery) — khaali ho to sirf img dikhega
  images?: string[];
  badge?: string;
  desc: string;
  fabric: string;
  // Admin override — khaali ho to category default look use hota hai (lookFor)
  accessories?: Accessory[];
}

// NOTE: Demo catalog — 11 ladies demo products, har category tile ke liye alag stock.
// Admin panel se inhe real photos/price/stock se replace karna hai.
export const PRODUCTS: Product[] = [
  { id: 'RL-01', name: 'Mirror-Work Rainbow Chaniya Choli', hindi: 'Multicolor mirror work', category: 'women', rent1: 899, rent3: 1499, rent9: 2999, buy: 4999, deposit: 2000, rating: 4.9, reviews: 412, sizes: ['S','M','L','XL'], colors: ['Multicolor','Red','Pink'], img: '/images/g-hero.webp', badge: 'BESTSELLER', desc: 'Original mirror work, 8m flare, padded blouse + latkan + bandhani dupatta included.', fabric: 'Cotton + Georgette' },
  { id: 'RL-05', name: 'Bridal Navratri Designer Lehenga', hindi: 'Heavy premium look', category: 'premium', rent1: 2099, rent3: 3499, rent9: 6499, buy: 11999, deposit: 4000, rating: 5.0, reviews: 96, sizes: ['S','M','L'], colors: ['Maroon-Gold','Wine'], img: '/images/g-koti.webp', badge: 'PREMIUM', desc: 'Designer boutique piece, hand embroidery, can-can flare. Jewellery set free*.', fabric: 'Velvet + Net' },
  { id: 'RL-06', name: 'Black-White Modern Fusion Choli', hindi: 'Day-5 white special', category: 'women', rent1: 959, rent3: 1599, rent9: 2999, buy: 5299, deposit: 2000, rating: 4.7, reviews: 203, sizes: ['S','M','L','XL'], colors: ['Black-White'], img: '/images/g-whiteblack.webp', desc: 'Koti-style fusion with oxidised latkan. Stands out most in photos.', fabric: 'Rayon + Koti' },
  { id: 'RL-08', name: 'Navy-Magenta Gujarati Chaniya', hindi: 'Classic garba', category: 'women', rent1: 779, rent3: 1299, rent9: 2499, buy: 4299, deposit: 2000, rating: 4.8, reviews: 347, sizes: ['S','M','L','XL','XXL'], colors: ['Navy-Magenta'], img: '/images/g-chaniya1.jpg', desc: 'Authentic Gujarati border with full flair. Most comfortable for beginners.', fabric: 'Cotton' },
  { id: 'RL-09', name: 'Wine Koti-Style Lehenga', hindi: 'Koti jacket look', category: 'premium', rent1: 1499, rent3: 2499, rent9: 4699, buy: 7999, deposit: 3500, rating: 4.9, reviews: 142, sizes: ['M','L','XL'], colors: ['Wine-Multi'], img: '/images/g-pinkmulti.webp', badge: 'TRENDING', desc: 'Long koti jacket + sleeveless choli + heavy ghaghra. Stage performance hit.', fabric: 'Georgette' },
  { id: 'RL-13', name: 'Multicolor Navratri Diva Set', hindi: 'For every day', category: 'women', rent1: 1199, rent3: 1999, rent9: 3699, buy: 6499, deposit: 2500, rating: 4.9, reviews: 117, sizes: ['S','M','L'], colors: ['White-Black'], img: '/images/g-multi2.webp', desc: 'Auspicious multicolor combo — looks best with oxidised jewellery.', fabric: 'Chanderi' },
  { id: 'RL-15', name: 'Red-Yellow Traditional Ghaghra', hindi: 'Evergreen', category: 'women', rent1: 839, rent3: 1399, rent9: 2599, buy: 4499, deposit: 2000, rating: 4.8, reviews: 295, sizes: ['S','M','L','XL','XXL'], colors: ['Red-Yellow'], img: '/images/g-girls2.jpg', desc: 'Our most re-rented design. Gamthi print, full comfort.', fabric: 'Pure Cotton' },
  { id: 'RL-16', name: 'Golden Diva Premium Choli', hindi: 'Garba queen', category: 'premium', rent1: 1799, rent3: 2999, rent9: 5599, buy: 9499, deposit: 4000, rating: 5.0, reviews: 73, sizes: ['S','M','L'], colors: ['Gold-Maroon'], img: '/images/g-chaniya2.webp', badge: 'LIMITED', desc: 'Zari + sequin handwork. Steals the spotlight on entry. Dry-cleaned + steam-pressed.', fabric: 'Silk + Zari' },
  // ---- Demo stock: har category tile ke liye alag product ----
  { id: 'RL-17', name: 'Red Embroidered Padded Blouse', hindi: 'Solo blouse', category: 'women', rent1: 299, rent3: 499, rent9: 999, buy: 1499, deposit: 500, rating: 4.7, reviews: 58, sizes: ['S','M','L','XL'], colors: ['Red','Gold'], img: '/images/g-chaniya2.webp', badge: 'NEW', desc: 'Padded designer blouse with back dori and latkan. Pairs with any chaniya.', fabric: 'Cotton Silk', accessories: [{ name: 'Back dori + latkan', tag: 'included' }, { name: 'Oxidised Jhumka - Pearl Drop', tag: 'addon', price: 129 }] },
  { id: 'RL-23', name: 'Teal Mirror Koti Jacket Set', hindi: 'Jacket style', category: 'women', rent1: 899, rent3: 1499, rent9: 2799, buy: 4799, deposit: 2000, rating: 4.8, reviews: 89, sizes: ['S','M','L'], colors: ['Teal-Gold'], img: '/images/g-whiteblack.webp', badge: 'TRENDING', desc: 'Long mirror-work koti jacket with inner and flared skirt. Stage-ready look.', fabric: 'Georgette + Koti', accessories: [{ name: 'Koti jacket + inner', tag: 'included' }, { name: 'Designer dupatta', tag: 'included' }, { name: 'Dandiya pair', tag: 'free' }] },
  { id: 'RL-24', name: 'Maroon Velvet Bridal Lehenga', hindi: 'Bridal special', category: 'premium', rent1: 1899, rent3: 3199, rent9: 5999, buy: 10999, deposit: 4000, rating: 5.0, reviews: 45, sizes: ['S','M','L'], colors: ['Maroon-Gold'], img: '/images/g-hero.webp', badge: 'PREMIUM', desc: 'Heavy velvet bridal lehenga with zari border and can-can flare. Kundan jewellery set available as add-on.', fabric: 'Velvet + Zari', accessories: [{ name: 'Designer dupatta + latkan', tag: 'included' }, { name: 'Gold Kamarbandh', tag: 'addon', price: 199 }, { name: 'Kundan Jewellery Set', tag: 'addon', price: 299 }] },
];

// --- Complete look: model ne photo me kya pehna hai ---
// Har dress ke saath ye list QuickView me dikhti hai — customer ko
// scroll/search nahi karna padta. Admin kisi product ka alag list
// `accessories` me set kar sakta hai, warna Website → Complete look
// wale category defaults + desc keywords (dandiya / jewellery / hair
// accessory) se auto banta hai.
export const DEFAULT_LOOK: Record<Category, Accessory[]> = {
  women: [
    { name: 'Bandhani dupatta', tag: 'included' },
    { name: 'Latkan + dori', tag: 'included' },
    { name: 'Oxidised jhumka', tag: 'addon', price: 99 },
    { name: 'Kamarbandh (tagdi)', tag: 'addon', price: 149 },
    { name: 'Dandiya pair', tag: 'free' },
  ],
  men: [
    { name: 'Pagdi / safa', tag: 'included' },
    { name: 'Dupatta', tag: 'included' },
    { name: 'Mojari', tag: 'addon', price: 149 },
    { name: 'Brooch set', tag: 'addon', price: 49 },
    { name: 'Dandiya pair', tag: 'free' },
  ],
  kids: [
    { name: 'Dupatta + hair accessory', tag: 'included' },
    { name: 'Latkan', tag: 'included' },
    { name: 'Kids jhumka', tag: 'addon', price: 79 },
    { name: 'Dandiya (small)', tag: 'free' },
  ],
  combo: [
    { name: 'Her dupatta + his pagdi', tag: 'included' },
    { name: 'Couple dandiya set', tag: 'free' },
    { name: 'Jewellery set', tag: 'addon', price: 199 },
  ],
  premium: [
    { name: 'Designer dupatta + latkan', tag: 'included' },
    { name: 'Jewellery set', tag: 'included' },
    { name: 'Kamarbandh (tagdi)', tag: 'addon', price: 149 },
    { name: 'Dandiya pair', tag: 'free' },
  ],
};

export function lookFor(p: Pick<Product, 'category' | 'desc' | 'accessories'>): Accessory[] {
  let base: Accessory[];
  if (p.accessories?.length) {
    base = [...p.accessories];
  } else {
    // Admin → Website → Complete look me badle hue defaults (same browser me live).
    // Khaali/missing ho to code wale DEFAULT_LOOK fallback.
    let global: Accessory[] | null = null;
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('raasleela-site-content') : null;
      if (raw) {
        const d = (JSON.parse(raw) as any)?.completeLook?.defaults?.[p.category];
        if (Array.isArray(d)) {
          const clean = (d as any[])
            .filter((a) => a && typeof a.name === 'string' && a.name.trim())
            .map((a) => ({
              name: String(a.name).trim().slice(0, 80),
              tag: (a.tag === 'free' ? 'free' : a.tag === 'addon' ? 'addon' : 'included') as Accessory['tag'],
              ...(a.tag === 'addon' ? { price: Math.max(0, Math.round(Number(a.price) || 0)) } : {}),
              ...(typeof a.x === 'number' && typeof a.y === 'number' ? { x: a.x, y: a.y } : {}),
            }));
          global = clean;
        }
      }
    } catch { /* localStorage na mile to fallback */ }
    base = global ? [...global] : [...(DEFAULT_LOOK[p.category] ?? [])];
  }
  const has = (kw: string) => base.some((a) => a.name.toLowerCase().includes(kw));
  const d = (p.desc || '').toLowerCase();
  if (/dandiya/.test(d) && !has('dandiya')) base.push({ name: 'Dandiya pair', tag: 'free' });
  if (/jewellery|jewelry/.test(d) && !has('jewell')) base.push({ name: 'Jewellery set', tag: 'included' });
  if (/hair accessory/.test(d) && !has('hair')) base.push({ name: 'Hair accessory', tag: 'included' });
  if (/pagdi|safa/.test(d) && !has('pagdi') && !has('safa')) base.push({ name: 'Pagdi / safa', tag: 'included' });
  if (/mojari/.test(d) && !has('mojari')) base.push({ name: 'Mojari', tag: 'included' });
  return base;
}

export function addonTotal(p: Pick<Product, 'category' | 'desc' | 'accessories'>, addons: string[] = []): number {
  const look = lookFor(p);
  return addons.reduce((sum, name) => {
    const a = look.find((x) => x.name === name && x.tag === 'addon');
    return sum + (a?.price ?? 0);
  }, 0);
}

// --- Admin text format: "name | included / free / price @ x,y" ---
// Dono jagah same format — Product edit + Website → Complete look defaults.
export function formatAccessories(list: Accessory[] = []): string {
  return list
    .map((a) => `${a.name} | ${a.tag === 'addon' ? (a.price ?? 0) : a.tag}${a.x != null && a.y != null ? ` @ ${a.x},${a.y}` : ''}`)
    .join('\n');
}

export function parseAccessories(text: string): Accessory[] {
  const out: Accessory[] = [];
  for (const line of text.split('\n')) {
    const l = line.trim();
    if (!l) continue;
    const parts = l.split('@').map((s) => s.trim());
    const left = parts[0] ?? '';
    const coord = parts[1] ?? '';
    const lp = left.split('|').map((s) => s.trim());
    const name = (lp[0] ?? '').slice(0, 80);
    const raw = (lp[1] ?? '').toLowerCase();
    if (!name) continue;
    const m = coord.match(/(\d+)\s*,\s*(\d+)/);
    const acc: Accessory = /^\d+$/.test(raw)
      ? { name, tag: 'addon', price: Math.max(0, Math.round(Number(raw))) }
      : raw === 'free'
        ? { name, tag: 'free' }
        : { name, tag: 'included' };
    if (m) {
      acc.x = Math.min(95, Number(m[1]));
      acc.y = Math.min(95, Number(m[2]));
    }
    out.push(acc);
    if (out.length >= 20) break;
  }
  return out;
}

// --- Photo hotspots: model photo par tap karne wale dots ---
// Har accessory naam se photo zone (% coords) milta hai.
// Admin `name | price @ x,y` likhke exact position override kar sakta hai.
export interface Hotspot {
  key: string;
  name: string;
  tag: 'included' | 'free' | 'addon' | 'dress';
  price?: number;
  x: number;
  y: number;
}

const SPOT: [RegExp, number, number][] = [
  [/pagdi|safa/, 50, 9],
  [/hair/, 50, 10],
  [/jhumka|earring|bali/, 67, 24],
  [/dandiya/, 80, 58],
  [/mojari|jutti|shoe/, 50, 90],
  [/dupatta/, 30, 42],
  [/latkan|dori/, 58, 48],
  [/brooch/, 60, 38],
  [/jewell|necklace|haar/, 50, 33],
  [/kamar|tagdi/, 50, 64],
  [/choli|blouse|chaniya|kediyu|lehenga|ghaghra|dhoti|kurta|angrakha/, 38, 60],
];

export function hotspotsFor(p: Pick<Product, 'category' | 'desc' | 'accessories' | 'name' | 'rent1'>): Hotspot[] {
  const spots: Hotspot[] = [{ key: '__dress', name: p.name, tag: 'dress', price: p.rent1, x: 38, y: 58 }];
  const used = ['38,58'];
  lookFor(p).forEach((a, i) => {
    let x = a.x;
    let y = a.y;
    if (x == null || y == null) {
      const rule = SPOT.find(([re]) => re.test(a.name.toLowerCase()));
      if (rule) { x = rule[1]; y = rule[2]; }
      else { x = 30 + (i % 3) * 20; y = 74; }
      let n = 0;
      while (used.includes(`${x},${y}`) && n < 5) { x += 6; if (x > 88) x = 24; n++; }
    }
    used.push(`${x},${y}`);
    spots.push({ key: a.name, name: a.name, tag: a.tag, price: a.price, x, y });
  });
  return spots;
}

export function photosFor(p: Pick<Product, 'img' | 'images'>): string[] {
  const extra = (p.images ?? []).filter(Boolean);
  return [p.img, ...extra.filter((x) => x !== p.img)].slice(0, 5);
}

/** 360° spin frames — main + saare angles (thumbs se zyada, smooth rotation ke liye) */
export function spinFramesFor(p: Pick<Product, 'img' | 'images'>): string[] {
  const extra = (p.images ?? []).filter(Boolean);
  return [p.img, ...extra.filter((x) => x !== p.img)].slice(0, 24);
}

export { STORE, waLink } from './store';
// Purane imports na toote — WA_NUMBER ab store se aata hai
export { STORE as STORE_INFO } from './store';
import { STORE as _STORE } from './store';
export const WA_NUMBER = _STORE.waNumber;
