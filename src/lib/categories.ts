// Shop-by-category — customer bina search kiye seedha tap karke dhoondhe.
// Admin panel → Categories se label/photo/keyword kabhi bhi badal sakta hai.
// Tap karne par `query` shop search me set hota hai (desc + accessories samet match hota hai).

export interface ShopCategory {
  id: string;
  label: string;
  /** keywords (comma/space separated) — dress ya item naam me match hote hain */
  query: string;
  img: string;
  /** dress = dresses filter · item = sirf single-rent items (jewellery jaise), dress mix nahi */
  kind: 'dress' | 'item';
}

export const DEFAULT_CATEGORIES: ShopCategory[] = [
  { id: 'chaniya', label: 'Chaniya Choli', query: 'chaniya', img: '/images/g-hero.webp', kind: 'dress' },
  { id: 'choli', label: 'Choli & Blouse', query: 'choli', img: '/images/g-chaniya1.jpg', kind: 'dress' },
  { id: 'jewellery', label: 'Jewellery', query: 'jhumka, jewellery, kamarbandh, tagdi', img: '/images/g-multi2.webp', kind: 'item' },
];

// Admin panel me pehle se saved list ho to usme se bhi ye hataye jayenge
const REMOVED_IDS = ['kediyu', 'kids', 'dupatta', 'bridal', 'combo'];

const KEY = 'raasleela-admin-categories';
const EVT = 'raasleela-categories-updated';

function valid(list: any): list is ShopCategory[] {
  return Array.isArray(list) && list.every((c) => c && typeof c.label === 'string' && typeof c.query === 'string');
}

function normalize(list: ShopCategory[]): ShopCategory[] {
  // Purani saved list (bina kind) — jewellery item, baaki dress
  return list.map((c) => ({
    ...c,
    kind: c.kind === 'item' ? 'item' as const : c.id === 'jewellery' ? 'item' as const : 'dress' as const,
  }));
}

export function getCategories(): ShopCategory[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (valid(arr) && arr.length) return normalize(arr).filter((c) => !REMOVED_IDS.includes(c.id));
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
