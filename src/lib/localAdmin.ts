import { PRODUCTS } from '../data/products';
import type { LiveProduct } from './ProductsContext';

const P_KEY = 'raasleela-admin-products';
const B_KEY = 'raasleela-admin-bookings';
const A_KEY = 'raasleela-admin-auth';

export const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string) || 'admin123';

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
  try {
    const raw = localStorage.getItem(P_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch { /* ignore */ }
  return PRODUCTS.map((p) => ({ ...p, stock: 5, active: true }));
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
  return localStorage.getItem(A_KEY) === '1';
}

export function setLocalAdmin(v: boolean) {
  if (v) localStorage.setItem(A_KEY, '1');
  else localStorage.removeItem(A_KEY);
}
