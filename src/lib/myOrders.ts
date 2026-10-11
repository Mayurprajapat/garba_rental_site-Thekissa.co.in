// Customer ke orders — isi device par website me save rehte hain (My Orders).
// Checkout confirm hote hi snapshot judta hai. WhatsApp/Email store ko jaata hai,
// My Orders customer ke paas rehta hai — order website se kabhi gayab nahi hota.
//
// IMPORTANT: KEY kabhi mat badalna — purane customers ka data isi key me hai.
// Backup key sirf safety ke liye (primary fail ho to restore).

export interface MyOrderItem {
  name: string;
  detail: string;
  qty: number;
  price: number;
}

export interface MyOrder {
  id: string;
  date: string;
  name: string;
  phone: string;
  event: string;
  items: MyOrderItem[];
  total: number;
  deposit: number;
  token: number;
  mode: string;
  /** Admin ka reply — order milega ya nahi + wajah */
  status?: string;
  note?: string;
  /** UPI payment verification: verified / rejected / unverified (admin panel se) */
  payStatus?: string;
  /** Payment screenshot (compressed dataURL ya cloud URL) — order confirm ke liye compulsory */
  proof?: string;
  /** Admin ne order kab tak ready hoga ye date di ho (YYYY-MM-DD) */
  readyDate?: string;
}

const KEY = 'raasleela-my-orders';
const BACKUP_KEY = 'raasleela-my-orders-backup-v1';
export const ORDERS_EVENT = 'raasleela-orders-updated';
/** Navbar se seedha My Orders kholne ke liye */
export const OPEN_ORDERS_EVENT = 'raasleela-open-orders';

function parseList(raw: string | null): MyOrder[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as MyOrder[];
  } catch { /* ignore */ }
  return [];
}

export function getMyOrders(): MyOrder[] {
  try {
    const primary = parseList(localStorage.getItem(KEY));
    if (primary.length) return primary;
    // Primary khaali ho to backup se restore (data loss se bachao)
    const backup = parseList(localStorage.getItem(BACKUP_KEY));
    if (backup.length) {
      try { localStorage.setItem(KEY, JSON.stringify(backup)); } catch { /* ignore */ }
      return backup;
    }
    return primary;
  } catch { /* ignore */ }
  return [];
}

export function saveMyOrder(o: MyOrder) {
  try {
    const all = [o, ...getMyOrders().filter((x) => x.id !== o.id)].slice(0, 20);
    const payload = JSON.stringify(all);
    localStorage.setItem(KEY, payload);
    // Backup copy — kabhi primary clear ho jaye to wapas la sakein
    try { localStorage.setItem(BACKUP_KEY, payload); } catch { /* ignore */ }
    window.dispatchEvent(new Event(ORDERS_EVENT));
  } catch { /* ignore */ }
}

/** Cloud/supabase se aaye orders ko local me merge karo (dedupe by id). Data kabhi overwrite nahi hota, sirf judta hai. */
export function mergeMyOrders(incoming: MyOrder[]) {
  try {
    if (!incoming.length) return;
    const existing = getMyOrders();
    const byId = new Map(existing.map((o) => [o.id, o]));
    for (const o of incoming) {
      if (!o || !o.id) continue;
      if (!byId.has(o.id)) byId.set(o.id, o);
      else {
        // Cloud me naya status/note ho to update kar do, items/total same rehne do
        const prev = byId.get(o.id)!;
        byId.set(o.id, {
          ...prev,
          status: o.status ?? prev.status,
          note: o.note ?? prev.note,
          readyDate: (o as MyOrder).readyDate ?? prev.readyDate,
        });
      }
    }
    const all = [...byId.values()]
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 20);
    const payload = JSON.stringify(all);
    localStorage.setItem(KEY, payload);
    try { localStorage.setItem(BACKUP_KEY, payload); } catch { /* ignore */ }
    window.dispatchEvent(new Event(ORDERS_EVENT));
  } catch { /* ignore */ }
}

/** Dusre tab/browser me change ho to ye listener pakad lega (cross-tab sync). */
export function subscribeMyOrders(cb: () => void): () => void {
  const onCustom = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key === KEY || e.key === BACKUP_KEY) cb();
  };
  window.addEventListener(ORDERS_EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(ORDERS_EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

/** Mobile number se is device par mile orders (last-10-digit match). */
export function findLocalOrdersByPhone(phone: string): MyOrder[] {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length < 10) return [];
  return getMyOrders().filter((o) =>
    String(o.phone || '').replace(/\D/g, '').slice(-10) === digits
  );
}

export function findLocalOrderById(id: string): MyOrder | null {
  const needle = String(id || '').trim().toUpperCase();
  if (!needle) return null;
  return getMyOrders().find((o) => String(o.id || '').toUpperCase() === needle) ?? null;
}

export function clearMyOrders() {
  try {
    localStorage.removeItem(KEY);
    // Backup turant mat hatao — galti se clear ho to agli baar restore ho sake.
    // Sirf explicit double-clear par backup bhi saaf karo (neeche alag fn).
    window.dispatchEvent(new Event(ORDERS_EVENT));
  } catch { /* ignore */ }
}

/** Dono copies saaf karo — sirf tab jab user khud 2 baar confirm kare. */
export function clearMyOrdersFully() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(BACKUP_KEY);
    window.dispatchEvent(new Event(ORDERS_EVENT));
  } catch { /* ignore */ }
}
