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

// NOTE: Demo catalog — client ke paas kul ~30 sets hai.
// Admin panel se inhe real 30 photos/price/stock se replace karna hai.
// Category count CATEGORIES note me rakha hai (12+8+6+2+2 = 30).
export const PRODUCTS: Product[] = [
  { id: 'RL-01', name: 'Mirror-Work Rainbow Chaniya Choli', hindi: 'Multicolor sheesha work', category: 'women', rent1: 899, rent3: 1499, rent9: 2999, buy: 4999, deposit: 2000, rating: 4.9, reviews: 412, sizes: ['S','M','L','XL'], colors: ['Multicolor','Red','Pink'], img: '/images/g-hero.webp', badge: 'BESTSELLER', desc: 'Original mirror work, 8m ghera, padded blouse + latkan + bandhani dupatta included.', fabric: 'Cotton + Georgette' },
  { id: 'RL-02', name: 'Royal Kediyu Dhoti + Pagdi Set', hindi: 'Men traditional', category: 'men', rent1: 599, rent3: 999, rent9: 1999, buy: 2999, deposit: 1500, rating: 4.8, reviews: 268, sizes: ['M','L','XL','XXL'], colors: ['Yellow','Red','Green'], img: '/images/g-boys1.jpg', images: ['/images/g-kediya.jpg'], badge: 'NEW', desc: 'Angrakha-style kediyu, cotton dhoti, safa/pagdi + dupatta. Perfect for both stage and street garba.', fabric: 'Cotton Silk' },
  { id: 'RL-03', name: 'Kids Princess Ghaghra (2–8 yrs)', hindi: 'Little Radha look', category: 'kids', rent1: 479, rent3: 799, rent9: 1599, buy: 2499, deposit: 1000, rating: 4.9, reviews: 531, sizes: ['2-4Y','4-6Y','6-8Y'], colors: ['Pink','Yellow','Orange'], img: '/images/g-girls1.webp', badge: 'KIDS LOVE', desc: 'Soft cotton lining, itch-free, elastic back. Hair accessory free.', fabric: 'Soft Cotton' },
  { id: 'RL-04', name: 'Couple Combo — Match & Twirl', hindi: '2 dress + dandiya free', category: 'combo', rent1: 1499, rent3: 2499, rent9: 4499, buy: 7999, deposit: 3000, rating: 5.0, reviews: 189, sizes: ['M','L','XL'], colors: ['Red-Gold','Green-Yellow'], img: '/images/g-combo1.jpg', images: ['/images/g-combo2.jpg'], badge: 'SAVE 30%', desc: 'Her chaniya choli + his kediyu, color-coordinated. Dandiya pair + jewellery FREE.', fabric: 'Mixed Festive' },
  { id: 'RL-05', name: 'Bridal Navratri Designer Lehenga', hindi: 'Heavy premium look', category: 'premium', rent1: 2099, rent3: 3499, rent9: 6499, buy: 11999, deposit: 4000, rating: 5.0, reviews: 96, sizes: ['S','M','L'], colors: ['Maroon-Gold','Wine'], img: '/images/g-koti.webp', badge: 'PREMIUM', desc: 'Designer boutique piece, hand embroidery, can-can flare. Jewellery set free*.', fabric: 'Velvet + Net' },
  { id: 'RL-06', name: 'Black-White Modern Fusion Choli', hindi: 'Day-5 white special', category: 'women', rent1: 959, rent3: 1599, rent9: 2999, buy: 5299, deposit: 2000, rating: 4.7, reviews: 203, sizes: ['S','M','L','XL'], colors: ['Black-White'], img: '/images/g-whiteblack.webp', desc: 'Koti-style fusion with oxidised latkan. Stands out most in photos.', fabric: 'Rayon + Koti' },
  { id: 'RL-07', name: 'Boys Yellow Angrakha Dhoti', hindi: 'Little kediyu', category: 'kids', rent1: 539, rent3: 899, rent9: 1699, buy: 2699, deposit: 1000, rating: 4.8, reviews: 174, sizes: ['4-6Y','6-10Y','10-14Y'], colors: ['Yellow','Orange'], img: '/images/g-angarkha.jpg', images: ['/images/g-boys3.jpg', '/images/g-boys4.webp'], desc: 'Perfect for school functions and garba nights. Pagdi included.', fabric: 'Cotton' },
  { id: 'RL-08', name: 'Navy-Magenta Gujarati Chaniya', hindi: 'Classic garba', category: 'women', rent1: 779, rent3: 1299, rent9: 2499, buy: 4299, deposit: 2000, rating: 4.8, reviews: 347, sizes: ['S','M','L','XL','XXL'], colors: ['Navy-Magenta'], img: '/images/g-chaniya1.jpg', desc: 'Authentic Gujarati border with full flair. Most comfortable for beginners.', fabric: 'Cotton' },
  { id: 'RL-09', name: 'Wine Koti-Style Lehenga', hindi: 'Koti jacket look', category: 'premium', rent1: 1499, rent3: 2499, rent9: 4699, buy: 7999, deposit: 3500, rating: 4.9, reviews: 142, sizes: ['M','L','XL'], colors: ['Wine-Multi'], img: '/images/g-pinkmulti.webp', badge: 'TRENDING', desc: 'Long koti jacket + sleeveless choli + heavy ghaghra. Stage performance hit.', fabric: 'Georgette' },
  { id: 'RL-10', name: 'Men Green Bandhej Kediyu', hindi: 'Bandhej special', category: 'men', rent1: 659, rent3: 1099, rent9: 2099, buy: 3299, deposit: 1500, rating: 4.7, reviews: 158, sizes: ['M','L','XL','XXL'], colors: ['Green','Red'], img: '/images/g-kedia-green.jpg', desc: 'Rajasthani bandhej print, mirror buttons. Dupatta + mojari option.', fabric: 'Cotton' },
  { id: 'RL-11', name: 'Mother-Daughter Same-Same Combo', hindi: 'Family goals', category: 'combo', rent1: 1799, rent3: 2999, rent9: 5499, buy: 8999, deposit: 3000, rating: 5.0, reviews: 88, sizes: ['Kids+M','Kids+L'], colors: ['Pink-Multi','Red-Yellow'], img: '/images/g-combo3.jpg', badge: 'FAMILY HIT', desc: 'Matching chaniya cholis for mother and daughter. Available in matching sizes for mother and daughter.', fabric: 'Cotton + Mirror' },
  { id: 'RL-12', name: 'Pink Multicolor Kids Lehenga', hindi: 'Twirl machine', category: 'kids', rent1: 599, rent3: 999, rent9: 1899, buy: 2999, deposit: 1000, rating: 4.8, reviews: 226, sizes: ['2-4Y','4-8Y','8-12Y'], colors: ['Pink-Multi'], img: '/images/g-kids1.webp', desc: 'Double-layer net flare that twirls on its own. Dupatta attached.', fabric: 'Net + Cotton' },
  { id: 'RL-13', name: 'Multicolor Navratri Diva Set', hindi: 'For every day', category: 'women', rent1: 1199, rent3: 1999, rent9: 3699, buy: 6499, deposit: 2500, rating: 4.9, reviews: 117, sizes: ['S','M','L'], colors: ['White-Black'], img: '/images/g-multi2.webp', desc: 'Auspicious multicolor combo — looks best with oxidised jewellery.', fabric: 'Chanderi' },
  { id: 'RL-14', name: 'Boys Group Pack (5 Kediyu)', hindi: 'Society / school', category: 'men', rent1: 2399, rent3: 3999, rent9: 7499, buy: 12999, deposit: 5000, rating: 4.9, reviews: 64, sizes: ['M','L','XL'], colors: ['Mixed'], img: '/images/g-boys2.jpg', badge: 'BULK 25% OFF', desc: 'Set of 5 same-colour kediyus. Ideal for group performances and school annual days.', fabric: 'Cotton' },
  { id: 'RL-15', name: 'Red-Yellow Traditional Ghaghra', hindi: 'Evergreen', category: 'women', rent1: 839, rent3: 1399, rent9: 2599, buy: 4499, deposit: 2000, rating: 4.8, reviews: 295, sizes: ['S','M','L','XL','XXL'], colors: ['Red-Yellow'], img: '/images/g-girls2.jpg', desc: 'Our most re-rented design. Gamthi print, full comfort.', fabric: 'Pure Cotton' },
  { id: 'RL-16', name: 'Golden Diva Premium Choli', hindi: 'Garba queen', category: 'premium', rent1: 1799, rent3: 2999, rent9: 5599, buy: 9499, deposit: 4000, rating: 5.0, reviews: 73, sizes: ['S','M','L'], colors: ['Gold-Maroon'], img: '/images/g-chaniya2.webp', badge: 'LIMITED', desc: 'Zari + sequin handwork. Steals the spotlight on entry. Dry-cleaned + steam-pressed.', fabric: 'Silk + Zari' },
];

// --- Complete look: model ne photo me kya pehna hai ---
// Har dress ke saath ye list QuickView me dikhti hai — customer ko
// scroll/search nahi karna padta. Admin kisi product ka alag list
// `accessories` me set kar sakta hai, warna category default + desc
// keywords (dandiya / jewellery / hair accessory) se auto banta hai.
const DEFAULT_LOOK: Record<Category, Accessory[]> = {
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
  const base = p.accessories?.length ? [...p.accessories] : [...(DEFAULT_LOOK[p.category] ?? [])];
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

export function hotspotsFor(p: Pick<Product, 'category' | 'desc' | 'accessories' | 'name' | 'rent3'>): Hotspot[] {
  const spots: Hotspot[] = [{ key: '__dress', name: p.name, tag: 'dress', price: p.rent3, x: 38, y: 58 }];
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

export const CATEGORIES: { id: Category | 'all'; label: string; img: string; note: string }[] = [
  { id: 'women', label: 'Women Chaniya Choli', img: '/images/g-girls2.jpg', note: 'Rent from ₹1299' },
  { id: 'men', label: 'Men Kediyu-Dhoti', img: '/images/g-kedia-green.jpg', note: 'Rent from ₹999' },
  { id: 'kids', label: 'Kids (2–14 yrs)', img: '/images/g-kids1.webp', note: 'Rent from ₹799' },
  { id: 'combo', label: 'Couple / Family Combo', img: '/images/g-combo2.jpg', note: 'Rent from ₹2499' },
  { id: 'premium', label: 'Premium Bridal', img: '/images/g-koti.webp', note: 'Rent from ₹2499' },
];

export { STORE, waLink } from './store';
// Purane imports na toote — WA_NUMBER ab store se aata hai
export { STORE as STORE_INFO } from './store';
import { STORE as _STORE } from './store';
export const WA_NUMBER = _STORE.waNumber;
