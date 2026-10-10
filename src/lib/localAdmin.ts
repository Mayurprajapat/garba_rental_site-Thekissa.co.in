import { PRODUCTS } from '../data/products';
import type { LiveProduct } from './ProductsContext';

const P_KEY = 'raasleela-admin-products';
const B_KEY = 'raasleela-admin-bookings';
const A_KEY = 'raasleela-admin-auth';

export const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string) || 'admin123';

// Default password production me active ho to console me yaad dilao (behavior same rehta hai)
if (!import.meta.env.VITE_ADMIN_PASSWORD && typeof location !== 'undefined' && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
  console.warn('[admin] VITE_ADMIN_PASSWORD is not set — default password is active. Vercel env me strong password set karo, phir Settings → Security me custom password lagao.');
}

// ---- Admin password: client khud badal sakta hai (Settings → Security) ----
// Custom password lagte hi default/env password kaam karna BAND ho jata hai,
// taaki handover ke baad purana password kahi kaam na kare. Hash me store hota hai.
const PW_KEY = 'raasleela-admin-pw';

async function sha256Hex(text: string): Promise<string> {
  const salted = `raasleela::${text}`;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salted));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch { /* fallback below */ }
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `f${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`;
}

/** Client ne apna password lagaya hai ya abhi default chal raha hai */
export function hasCustomPassword(): boolean {
  try { return !!localStorage.getItem(PW_KEY); } catch { return false; }
}

export async function verifyAdminPassword(pass: string): Promise<boolean> {
  try {
    const saved = localStorage.getItem(PW_KEY);
    if (saved) return (await sha256Hex(pass)) === saved;
  } catch { /* ignore */ }
  return pass === ADMIN_PASSWORD;
}

/** Returns error message, or null on success */
export async function setAdminPassword(current: string, next: string): Promise<string | null> {
  if (!(await verifyAdminPassword(current))) return 'Current password is incorrect.';
  if (next.length < 6) return 'New password must be at least 6 characters.';
  if (next.length > 64) return 'New password is too long (max 64 characters).';
  try {
    localStorage.setItem(PW_KEY, await sha256Hex(next));
  } catch {
    return 'Could not save — browser storage is blocked.';
  }
  return null;
}

// Secret admin URL path — /admin kabhi public nahi hota.
// Vercel me VITE_ADMIN_PATH set karo (e.g. rl-manager-2026).
export const ADMIN_PATH = (import.meta.env.VITE_ADMIN_PATH as string) || 'rl-manager-2026';

// Brute-force lockout: 5 galat attempts → 15 min lock (per browser)
const L_KEY = 'raasleela-admin-lock';
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

interface LockState { fails: number; until: number; }

function readLock(): LockState {
  try {
    const raw = localStorage.getItem(L_KEY);
    if (raw) {
      const s = JSON.parse(raw) as LockState;
      if (typeof s.fails === 'number') return { fails: s.fails, until: s.until || 0 };
    }
  } catch { /* ignore */ }
  return { fails: 0, until: 0 };
}

/** Milliseconds bache hon to lock active hai, warna 0 */
export function adminLockRemaining(): number {
  const s = readLock();
  const left = s.until - Date.now();
  return left > 0 ? left : 0;
}

export function recordAdminFail(): number {
  const s = readLock();
  const fails = s.fails + 1;
  const until = fails >= MAX_FAILS ? Date.now() + LOCK_MS : 0;
  try { localStorage.setItem(L_KEY, JSON.stringify({ fails, until })); } catch { /* ignore */ }
  return Math.max(0, until - Date.now());
}

export function clearAdminFails() {
  try { localStorage.removeItem(L_KEY); } catch { /* ignore */ }
}

export function getLocalProducts(): LiveProduct[] {
  const fresh = () => PRODUCTS.map((p) => ({ ...p, stock: 5, active: true }));
  // Hataye hue demo products (ladies-only site) — saved list me hon to saaf kar do
  const REMOVED_IDS = ['RL-02', 'RL-03', 'RL-04', 'RL-07', 'RL-10', 'RL-11', 'RL-12', 'RL-14', 'RL-18', 'RL-19', 'RL-20', 'RL-21', 'RL-22'];
  const MERGED_KEY = 'raasleela-products-merged-v1';
  const alreadyMerged = (() => { try { return localStorage.getItem(MERGED_KEY) === '1'; } catch { return true; } })();
  const markMerged = () => { try { localStorage.setItem(MERGED_KEY, '1'); } catch { /* ignore */ } };
  try {
    const raw = localStorage.getItem(P_KEY);
    if (raw) {
      let arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        if (arr.some((p: any) => REMOVED_IDS.includes(p?.id))) {
          arr = arr.filter((p: any) => !REMOVED_IDS.includes(p?.id));
          try { localStorage.setItem(P_KEY, JSON.stringify(arr)); } catch { /* ignore */ }
          if (!arr.length) { markMerged(); return fresh(); }
        }
        // Pehli baar ke baad merge band — taki admin ka hataya product wapas na aaye
        if (alreadyMerged) return arr;
        // Naye demo products jo saved list me nahi hain — upar merge kar do (admin edits safe)
        const ids = new Set(arr.map((p: any) => p.id));
        const missing = PRODUCTS.filter((p) => !ids.has(p.id)).map((p) => ({ ...p, stock: 5, active: true }));
        markMerged();
        if (missing.length) {
          const merged = [...missing, ...arr];
          try { localStorage.setItem(P_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
          return merged as LiveProduct[];
        }
        return arr;
      }
    }
  } catch { /* ignore */ }
  markMerged();
  return fresh();
}

export function saveLocalProducts(list: LiveProduct[]) {
  localStorage.setItem(P_KEY, JSON.stringify(list));
}

export interface LocalBooking {
  id: number;
  order_id?: string;
  name: string;
  phone: string;
  category: string;
  size: string;
  event_date: string | null;
  plan: string;
  note: string;
  items: any[];
  subtotal: number;
  total: number;
  token_amount?: number;
  deposit?: number;
  deposit_status?: string;
  payment_mode?: string;
  payment_id?: string;
  payment_status?: string;
  /** Admin batata hai order kis date tak ready/mil jayega (YYYY-MM-DD) */
  ready_date?: string | null;
  /** Admin ka customer ke liye message — Out of stock / Available etc. */
  admin_note?: string | null;
  /** Customer ka delivery address (checkout me bhara hua) */
  address?: string | null;
  status: string;
  created_at: string;
}

export function getLocalBookings(): LocalBooking[] {
  try {
    const raw = localStorage.getItem(B_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function addLocalBooking(b: Omit<LocalBooking, 'id' | 'created_at' | 'status'> & { status?: string }): LocalBooking {
  const all = getLocalBookings();
  const row: LocalBooking = {
    ...b,
    id: Date.now(),
    status: b.status || 'new',
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(B_KEY, JSON.stringify([row, ...all].slice(0, 200)));
  return row;
}

export function updateLocalBooking(id: number, patch: Partial<LocalBooking>) {
  const all = getLocalBookings().map((b) => (b.id === id ? { ...b, ...patch } : b));
  localStorage.setItem(B_KEY, JSON.stringify(all));
}

export function deleteLocalBooking(id: number) {
  localStorage.setItem(B_KEY, JSON.stringify(getLocalBookings().filter((b) => b.id !== id)));
}

export function isLocalAdmin(): boolean {
  // Session 12 ghante me expire — shared/device kho jaye to khula admin na mile.
  // Purana '1' format ab expired mana jata hai (ek baar dobara login hoga).
  try {
    const v = localStorage.getItem(A_KEY);
    if (!v || v === '1') return false;
    return Date.now() - Number(v) < 12 * 60 * 60 * 1000;
  } catch { return false; }
}

export function setLocalAdmin(v: boolean) {
  try {
    if (v) localStorage.setItem(A_KEY, String(Date.now()));
    else localStorage.removeItem(A_KEY);
  } catch { /* ignore */ }
}
