// Shop-by-category — customer bina search kiye seedha tap karke dhoondhe.
// Admin panel → Categories se label/photo/keyword kabhi bhi badal sakta hai.
// Har kapde / item ka apna tile hai taaki client alag-alag dekh paaye.
// Tap karne par collection filter hota hai (dress naam + desc + fabric + colour + accessories).
// Query me comma (,) ka matlab OR hai — `kediyu, dhoti` = dono me se koi ek mile to dikhega.
// Comma ke andar likhe shabd AND hain — `oxidised jhumka` = dono shabd ek saath hone chahiye.

import type { Category } from '../data/products';

export interface ShopCategory {
  id: string;
  label: string;
  /** keywords (comma separated = OR) — dress ya item naam me match hote hain. Khaali = sab dikhega. */
  query: string;
  img: string;
  /** dress = dresses filter · item = sirf single-rent items (jewellery jaise), dress mix nahi */
  kind: 'dress' | 'item';
  /** dress group filter — khaali/undefined = sab groups. Eg. ['women'] = sirf women dresses */
  cats?: Category[];
}

export const DEFAULT_CATEGORIES: ShopCategory[] = [
  // ---- Dresses: har kapda alag ----
  { id: 'chaniya', label: 'Chaniya Choli', query: 'chaniya, choli, ghaghra, diva', img: '/images/g-hero.webp', kind: 'dress' },
  { id: 'choli', label: 'Choli', query: 'choli', img: '/images/g-chaniya1.jpg', kind: 'dress' },
  { id: 'blouse', label: 'Blouse', query: 'blouse', img: '/images/g-whiteblack.webp', kind: 'dress' },
  { id: 'ghaghra', label: 'Ghaghra & Lehenga', query: 'ghaghra, lehenga', img: '/images/g-girls2.jpg', kind: 'dress' },
  { id: 'koti', label: 'Koti Jacket', query: 'koti', img: '/images/g-pinkmulti.webp', kind: 'dress' },
  { id: 'dupatta', label: 'Dupatta', query: 'dupatta, bandhani', img: '/images/g-multi2.webp', kind: 'dress' },
  { id: 'dandiya', label: 'Dandiya (Free)', query: 'dandiya', img: '/images/g-combo2.jpg', kind: 'dress' },
  { id: 'bridal', label: 'Premium Bridal', query: '', img: '/images/g-koti.webp', kind: 'dress', cats: ['premium'] },
  // ---- Single-rent items: har item alag (bina dress ke) ----
  { id: 'jewellery', label: 'Jewellery Set', query: 'jewellery set, necklace, haar', img: '/images/item-jewellery-set.jpg', kind: 'item' },
  { id: 'jhumka', label: 'Oxidised Jhumka', query: 'oxidised jhumka', img: '/images/item-jhumka.jpg', kind: 'item' },
  { id: 'kamarbandh', label: 'Kamarbandh (Tagdi)', query: 'kamarbandh, tagdi', img: '/images/item-kamarbandh.jpg', kind: 'item' },
];

/** Category query matcher — comma = OR, comma ke andar space = AND (poora part milna chahiye). */
export function matchesCategory(hayLower: string, query: string): boolean {
  const parts = query.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return true;
  return parts.some((part) => part.split(/\s+/).filter(Boolean).every((w) => hayLower.includes(w)));
}

const KEY = 'raasleela-admin-categories';
const EVT = 'raasleela-categories-updated';
// Purani 3-tile wali list — isko nayi granular list se auto-upgrade kar do
const OLD_IDS = ['chaniya', 'choli', 'jewellery'];
// Hatayi hui tiles — saved list me hon to auto-saaf kar do (ladies-only site)
const REMOVED_CAT_IDS = ['kids-girls', 'kids-boys', 'kids-jhumka', 'family', 'kediyu', 'dhoti', 'pagdi', 'mojari', 'brooch', 'couple'];

function valid(list: any): list is ShopCategory[] {
  return Array.isArray(list) && list.every((c) => c && typeof c.label === 'string' && typeof c.query === 'string');
}

function normalize(list: ShopCategory[]): ShopCategory[] {
  // Purani saved list (bina kind) — jewellery item, baaki dress
  return list.map((c) => ({
    ...c,
    kind: c.kind === 'item' ? 'item' as const : 'dress' as const,
    cats: Array.isArray((c as any).cats) ? (c as any).cats : undefined,
  }));
}

export function getCategories(): ShopCategory[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (valid(arr) && arr.length) {
        // Purani default 3-tile list ho to nayi list se upgrade karo
        const ids = arr.map((c) => c.id).sort().join('|');
        if (ids === [...OLD_IDS].sort().join('|')) {
          const d = [...DEFAULT_CATEGORIES];
          try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ }
          return d;
        }
        // Hatayi hui tiles saved list me hon to saaf kar do
        if (arr.some((c) => REMOVED_CAT_IDS.includes(c.id))) {
          const purged = arr.filter((c) => !REMOVED_CAT_IDS.includes(c.id));
          try { localStorage.setItem(KEY, JSON.stringify(purged)); } catch { /* ignore */ }
          return normalize(purged);
        }
        return normalize(arr);
      }
    }
  } catch { /* ignore */ }
  return [...DEFAULT_CATEGORIES];
}

export function saveCategories(list: ShopCategory[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVT));
  } catch { /* ignore */ }
}

export function resetCategories(): ShopCategory[] {
  const d = [...DEFAULT_CATEGORIES];
  saveCategories(d);
  return d;
}

export function categoriesEvent(): string {
  return EVT;
}
