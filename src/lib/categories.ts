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
  /** Strict ON = tile me SIRF tick kiye (tagged) products — keyword match band, mixing zero */
  strict?: boolean;
}

export const DEFAULT_CATEGORIES: ShopCategory[] = [
  { id: 'ghaghra', label: 'Lehenga', query: 'lehenga, ghaghra', img: '/images/g-girls2.jpg', kind: 'dress' },
  { id: 'blouse', label: 'Blouse', query: 'blouse', img: '/images/g-whiteblack.webp', kind: 'dress' },
  // ---- Single-rent items: har item alag (bina dress ke) ----
  { id: 'jewellery', label: 'Jewellery Set', query: 'jewellery set, necklace, haar', img: '/images/item-jewellery-set.jpg', kind: 'item' },
];

/** Category query matcher — comma = OR, comma ke andar space = AND (poora part milna chahiye). */
export function matchesCategory(hayLower: string, query: string): boolean {
  const parts = query.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return true;
  return parts.some((part) => part.split(/\s+/).filter(Boolean).every((w) => hayLower.includes(w)));
}

export interface TileProduct {
  id?: string;
  name?: string;
  hindi?: string;
  category?: string;
  desc?: string;
  fabric?: string;
  colors?: string[];
  accessories?: { name: string }[];
  tags?: unknown;
}

function cleanTags(p: TileProduct): string[] {
  const t = (p as any)?.tags;
  if (!Array.isArray(t)) return [];
  return [...new Set(
    t.map((x) => String(x ?? '').trim().toLowerCase()).filter(Boolean)
  )].slice(0, 10);
}

/** Dress search text — naam + desc + fabric + colour + accessories (website filter jaisa). */
export function tileHay(p: TileProduct): string {
  return [
    p.name ?? '', p.hindi ?? '', p.id ?? '', p.desc ?? '',
    p.category ?? '', p.fabric ?? '',
    (p.colors ?? []).join(' '),
    (p.accessories ?? []).map((a) => a?.name ?? '').join(' '),
  ].join(' ').toLowerCase();
}

/**
 * Dress kisi tile me dikhega ya nahi.
 * Tags tick hain to WAHI final hain (sirf ticked tiles) — keyword ignore.
 * Tile Strict hai to BINA tags wala dress kabhi nahi dikhega (mixing zero).
 * Tags khaali + non-strict = purana keyword + dress-group behaviour.
 */
export function dressInTile(p: TileProduct, tile: Pick<ShopCategory, 'id' | 'query' | 'kind' | 'cats' | 'strict'>): boolean {
  const tags = cleanTags(p);
  if (tags.length) return tags.includes(tile.id.toLowerCase());
  if (tile.strict) return false;
  if (tile.cats?.length && p.category && !(tile.cats as string[]).includes(p.category)) return false;
  return matchesCategory(tileHay(p), tile.query);
}

/**
 * Single-rent item (bina dress) kisi item-tile me dikhega ya nahi.
 * Parent dress par tags tick hain to wahi final — tile Strict hai to bina-tags item kabhi nahi.
 * Warna item naam se keyword match.
 */
export function itemInTile(itemName: string, parent: TileProduct, tile: Pick<ShopCategory, 'id' | 'query' | 'kind' | 'cats' | 'strict'>): boolean {
  const tags = cleanTags(parent);
  if (tags.length) return tags.includes(tile.id.toLowerCase());
  if (tile.strict) return false;
  const q = tile.query.trim();
  return !q || matchesCategory(itemName.toLowerCase(), q);
}

const KEY = 'raasleela-admin-categories';
const EVT = 'raasleela-categories-updated';
// Purani 3-tile wali list — isko nayi granular list se auto-upgrade kar do
const OLD_IDS = ['chaniya', 'choli', 'jewellery'];
// Hatayi hui tiles — saved list me hon to auto-saaf kar do (sirf Lehenga, Blouse, Jewellery Set rehte hain)
const REMOVED_CAT_IDS = ['kids-girls', 'kids-boys', 'kids-jhumka', 'family', 'kediyu', 'dhoti', 'pagdi', 'mojari', 'brooch', 'couple', 'chaniya', 'choli', 'koti', 'dupatta', 'dandiya', 'bridal', 'jhumka', 'kamarbandh'];

function valid(list: any): list is ShopCategory[] {
  return Array.isArray(list) && list.every((c) => c && typeof c.label === 'string' && typeof c.query === 'string');
}

function normalize(list: ShopCategory[]): ShopCategory[] {
  // Purani saved list (bina kind) — jewellery item, baaki dress
  return list.map((c) => ({
    ...c,
    kind: c.kind === 'item' ? 'item' as const : 'dress' as const,
    cats: Array.isArray((c as any).cats) ? (c as any).cats : undefined,
    strict: (c as any).strict === true,
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
