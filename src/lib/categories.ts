// Shop-by-category — customer bina search kiye seedha tap karke dhoondhe.
// Admin panel → Categories se label/photo/keyword kabhi bhi badal sakta hai.
// Har kapde / item ka apna tile hai taaki client alag-alag dekh paaye.
// Tap karne par collection filter hota hai (dress naam + desc + fabric + colour + accessories).
// Query me comma (,) ka matlab OR hai — `kediyu, dhoti` = dono me se koi ek mile to dikhega.
// Comma ke andar likhe shabd AND hain — `oxidised jhumka` = dono shabd ek saath hone chahiye.

import type { Category } from '../data/products';
import { isSupabaseConfigured, supabase } from './supabase';

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
  /** Name-only match = query sirf naam/tagline/ID se milao (description me "blouse"/"jewellery"
      mention wale outfits doosri tile me leak nahi honge — mixing zero) */
  nameOnly?: boolean;
}

export const DEFAULT_CATEGORIES: ShopCategory[] = [
  { id: 'ghaghra', label: 'Lehenga', query: 'lehenga, ghaghra', img: '/images/g-girls2.jpg', kind: 'dress', nameOnly: true },
  { id: 'blouse', label: 'Blouse', query: 'blouse, crop top', img: '/images/g-whiteblack.webp', kind: 'dress', nameOnly: true },
  // Jewellery dress-kind tile — choker/set jaise products card me dikhen (All Outfits me nahi).
  // Single-rent addons (jhumka etc.) QuickView me "Only this" se rent hote rahenge.
  { id: 'jewellery', label: 'Jewellery', query: 'jewellery, choker, necklace, haar, jhumka, earring, earing, ghungroo, gungroo, kamarbandh, mojari, payal, bangle, kada, nath, anklet, tikka, maang, kundan set, pearl set', img: '/images/item-jewellery-set.jpg', kind: 'dress', nameOnly: true },
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
 * Name-only tile = query sirf naam/tagline/ID se (desc-fabric wale words leak nahi karte).
 * Tags khaali + non-strict = purana keyword + dress-group behaviour.
 */
export function dressInTile(p: TileProduct, tile: Pick<ShopCategory, 'id' | 'query' | 'kind' | 'cats' | 'strict' | 'nameOnly'>): boolean {
  const tags = cleanTags(p);
  if (tags.length) return tags.includes(tile.id.toLowerCase());
  if (tile.strict) return false;
  if (tile.cats?.length && p.category && !(tile.cats as string[]).includes(p.category)) return false;
  if (tile.nameOnly) {
    const nameHay = `${p.name ?? ''} ${p.hindi ?? ''} ${p.id ?? ''}`.toLowerCase();
    return matchesCategory(nameHay, tile.query);
  }
  return matchesCategory(tileHay(p), tile.query);
}

/**
 * Single-rent item (bina dress) kisi item-tile me dikhega ya nahi.
 * Parent par ye tile tick hai to HAMESHA dikhega (chahe naam match na ho).
 * Tile Strict hai to BINA tick wala item kabhi nahi.
 * Warna item naam se keyword match — parent ke dress-tags items ko nahi rokte
 * (taaki ghaghra-tagged dress ka jhumka/earring bhi Jewellery tile me aaye).
 */
export function itemInTile(itemName: string, parent: TileProduct, tile: Pick<ShopCategory, 'id' | 'query' | 'kind' | 'cats' | 'strict'>): boolean {
  const tags = cleanTags(parent);
  if (tags.includes(tile.id.toLowerCase())) return true;
  if (tile.strict) return false;
  const q = tile.query.trim();
  return !q || matchesCategory(itemName.toLowerCase(), q);
}

/**
 * All Outfits me sirf outfits — Jewellery naam wale products bahar (wo Jewellery tile me dikhenge),
 * chahe unpar koi bhi tag tick ho (galt tick se bhi All saaf rahe).
 * Blouse exclusion tag-based hai (naam me "crop top" wale sets All me rehte hain).
 */
const NON_OUTFIT_TAGS = ['jewellery', 'blouse'];
const JEWELLERY_NAME_Q = 'jewellery, choker, necklace, haar, jhumka, earring, earing, ghungroo, gungroo, kamarbandh, mojari, brooch, bali, payal, bangle, kada, nath, anklet, tikka, maang, kundan set, pearl set';
const BLOUSE_NAME_Q = 'blouse';
export function isOutfit(p: TileProduct): boolean {
  const tags = cleanTags(p);
  const name = `${p.name ?? ''} ${p.hindi ?? ''}`.toLowerCase();
  // Naam se jewellery lage to All me kabhi nahi — chahe koi bhi tag tick ho
  if (name.trim() && matchesCategory(name, JEWELLERY_NAME_Q)) return false;
  if (tags.length) return !tags.some((t) => NON_OUTFIT_TAGS.includes(t));
  if (!name.trim()) return true;
  if (matchesCategory(name, BLOUSE_NAME_Q)) return false;
  return true;
}

const KEY = 'raasleela-admin-categories';
const EVT = 'raasleela-categories-updated';
// Purani default lists — inhe nayi list se auto-upgrade kar do.
// gen-1: chaniya|choli|jewellery · gen-2: blouse|ghaghra|jewellery (jewellery item-kind thi, ab dress-kind hai)
const OLD_ID_SETS = [
  ['chaniya', 'choli', 'jewellery'].sort().join('|'),
  ['blouse', 'ghaghra', 'jewellery'].sort().join('|'),
];
// Hatayi hui tiles — saved list me hon to auto-saaf kar do
const REMOVED_CAT_IDS = ['kids-girls', 'kids-boys', 'kids-jhumka', 'family', 'kediyu', 'dhoti', 'pagdi', 'mojari', 'brooch', 'couple', 'choli', 'koti', 'dupatta', 'dandiya', 'bridal', 'jhumka', 'kamarbandh'];

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
    nameOnly: (c as any).nameOnly === true,
  }));
}

export function getCategories(): ShopCategory[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (valid(arr) && arr.length) {
        // Purani default list ho to nayi list se upgrade karo (kind/nameOnly badle hain)
        const ids = arr.map((c) => c.id).sort().join('|');
        if (OLD_ID_SETS.includes(ids)) {
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

const CLOUD_SAVED_AT = 'raasleela-cats-saved-at';

function getCatsSavedAt(): number {
  try {
    return Number(localStorage.getItem(CLOUD_SAVED_AT) || 0) || 0;
  } catch {
    return 0;
  }
}

export function saveCategories(list: ShopCategory[]): { ok: boolean; error?: string } {
  let json = '';
  try {
    json = JSON.stringify(list);
  } catch {
    return { ok: false, error: 'Data ready nahi hua.' };
  }
  try {
    localStorage.setItem(KEY, json);
  } catch (e: any) {
    const m = `${e?.name || ''} ${e?.message || ''} ${e?.code ?? ''}`;
    if (/quota|QUOTA|22/.test(m)) {
      return { ok: false, error: 'Phone storage FULL — photo save nahi hui. Badi photos hatao ya live admin (cloud) use karo, wahan storage ki dikkat nahi.' };
    }
    return { ok: false, error: 'Save fail: browser storage blocked hai.' };
  }
  try {
    localStorage.setItem(CLOUD_SAVED_AT, String(Date.now()));
  } catch { /* ignore */ }
  try {
    window.dispatchEvent(new Event(EVT));
  } catch { /* ignore */ }
  return { ok: true };
}

/** Category tiles cloud (Supabase categories table, id=1) me push — sab devices par live tiles. */
export async function pushCategoriesToCloud(list: ShopCategory[]): Promise<{ ok: boolean; error?: string; missingTable?: boolean }> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, error: 'Cloud connected nahi hai (local mode).' };
  try {
    const { error } = await supabase
      .from('categories')
      .upsert({ id: 1, data: list as any, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) {
      const m = `${error.message || ''} ${(error as any)?.code || ''}`;
      if (/categories/i.test(m) && /does not exist|schema cache|relation|PGRST/i.test(m)) {
        return {
          ok: false,
          missingTable: true,
          error: 'Cloud table bani nahi hai — Supabase > SQL Editor me supabase/migration_categories.sql ek baar Run karo, phir dobara try karo.',
        };
      }
      return { ok: false, error: `Cloud save fail: ${error.message}` };
    }
    try {
      localStorage.setItem(CLOUD_SAVED_AT, String(Date.now()));
    } catch { /* ignore */ }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: `Cloud save fail: ${e?.message || 'network error'}` };
  }
}

/** Cloud se tiles kheecho — nayi copy mile to local me lagao + shop ko batao. Last-write-wins. */
export async function pullCategoriesFromCloud(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { data, error } = await supabase.from('categories').select('data,updated_at').eq('id', 1).maybeSingle();
    if (error || !data?.data || !valid(data.data)) return false;
    const cloudTime = data.updated_at ? new Date(data.updated_at).getTime() : 0;
    if (cloudTime && cloudTime <= getCatsSavedAt()) return false;
    const incoming = normalize(data.data as ShopCategory[]);
    let current = '';
    try {
      current = JSON.stringify(normalize(getCategories()));
    } catch { /* ignore */ }
    if (JSON.stringify(incoming) === current) {
      try {
        localStorage.setItem(CLOUD_SAVED_AT, String(cloudTime || Date.now()));
      } catch { /* ignore */ }
      return false;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(incoming));
      localStorage.setItem(CLOUD_SAVED_AT, String(cloudTime || Date.now()));
    } catch {
      return false;
    }
    try {
      window.dispatchEvent(new Event(EVT));
    } catch { /* ignore */ }
    return true;
  } catch {
    return false;
  }
}

let catsSyncStarted = false;

/** App start par ek baar chalao — cloud pull + Realtime subscribe + focus refresh. */
export function initCategoriesSync(): void {
  if (catsSyncStarted) return;
  catsSyncStarted = true;
  if (!isSupabaseConfigured || !supabase) return;
  pullCategoriesFromCloud();
  try {
    const sb = supabase;
    sb.channel('categories-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        pullCategoriesFromCloud();
      })
      .subscribe();
  } catch { /* realtime na mile to focus/pull fallback kaafi */ }
  const onFocus = () => {
    pullCategoriesFromCloud();
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') pullCategoriesFromCloud();
  };
  try {
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
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
