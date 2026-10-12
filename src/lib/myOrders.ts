// Customer orders — saved on this device in the website (My Orders).
// A snapshot is added as soon as checkout is confirmed. WhatsApp/Email goes to the store,
// My Orders stays with the customer — an order never disappears from the website.
//
// IMPORTANT: NEVER change the KEY — existing customers' data lives under this key.
// The backup key is only for safety (restore if the primary fails).

export interface MyOrderItem {
  name: string;
  detail: string;
  qty: number;
  price: number;
  /** Dress / accessory photo (catalog img URL) — thumbnail in the booking list + full view */
  img?: string;
  /** Catalog product id (helps match a photo fallback for old orders) */
  pid?: string;
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
  /** Order status — a new order is 'new' (pending). Whatever the admin sets
   *  (confirm/cancel/onway/delivered) is what the customer sees (with a downgrade guard). */
  status?: string;
  note?: string;
  /** UPI payment verification: verified / rejected / unverified (admin panel se) */
  payStatus?: string;
  /** Payment screenshot (compressed dataURL or cloud URL) — required to confirm the order */
  proof?: string;
  /** Date by which the admin says the order will be ready (YYYY-MM-DD) */
  readyDate?: string;
}

const KEY = 'raasleela-my-orders';
const BACKUP_KEY = 'raasleela-my-orders-backup-v1';
export const ORDERS_EVENT = 'raasleela-orders-updated';
/** Open My Orders directly from the navbar */
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
    // If the primary is empty, restore from backup (prevent data loss)
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
    // Backup copy — so we can bring it back if the primary ever gets cleared
    try { localStorage.setItem(BACKUP_KEY, payload); } catch { /* ignore */ }
    window.dispatchEvent(new Event(ORDERS_EVENT));
  } catch { /* ignore */ }
}

/** Merge orders from cloud/supabase into local storage (dedupe by id). Data is never overwritten, only added. */
export function mergeMyOrders(incoming: MyOrder[]) {
  try {
    if (!incoming.length) return;
    const existing = getMyOrders();
    const byId = new Map(existing.map((o) => [o.id, o]));
    for (const o of incoming) {
      if (!o || !o.id) continue;
      if (!byId.has(o.id)) byId.set(o.id, o);
      else {
        // If cloud has a newer status/note/payment, apply it; keep items/total as-is
        const prev = byId.get(o.id)!;
        // Photo merge — if the old snapshot lacks an img, attach the cloud img (same name/position match)
        let items = prev.items;
        try {
          const incomingItems = Array.isArray((o as MyOrder).items) ? (o as MyOrder).items : [];
          if (Array.isArray(items) && incomingItems.length === items.length) {
            const needsPhoto = items.some((it) => !it.img);
            if (needsPhoto && incomingItems.some((it) => it.img)) {
              items = items.map((it, i) => ({
                ...it,
                img: it.img || incomingItems[i]?.img || undefined,
                pid: (it as MyOrderItem).pid || incomingItems[i]?.pid || undefined,
              }));
            }
          } else if ((!items || !items.length) && incomingItems.length) {
            items = incomingItems;
          }
        } catch { /* ignore */ }
        byId.set(o.id, {
          ...prev,
          items,
          // Downgrade guard: a stale cloud 'new' must not overwrite a local confirmed/onway/delivered/
          // returned/cancelled. The admin's latest decision always wins.
          status: (() => {
            const incoming = o.status;
            const prevS = prev.status;
            if (incoming === 'new' && prevS && prevS !== 'new') return prevS;
            return incoming ?? prevS;
          })(),
          note: o.note ?? prev.note,
          readyDate: (o as MyOrder).readyDate ?? prev.readyDate,
          payStatus: (o as MyOrder).payStatus ?? prev.payStatus,
          proof: (o as MyOrder).proof ?? prev.proof,
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

/** This listener catches changes from another tab/browser (cross-tab sync). */
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

/** Orders on this device for a mobile number (last-10-digit match). */
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
    // Do not remove the backup right away — so an accidental clear can be restored next time.
    // Only an explicit double-clear wipes the backup too (separate fn below).
    window.dispatchEvent(new Event(ORDERS_EVENT));
  } catch { /* ignore */ }
}

/** Clear both copies — only when the user confirms twice themselves. */
export function clearMyOrdersFully() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(BACKUP_KEY);
    window.dispatchEvent(new Event(ORDERS_EVENT));
  } catch { /* ignore */ }
}
