// Customer ke orders — isi device par website me save rehte hain (My Orders).
// Checkout confirm hote hi snapshot judta hai. WhatsApp/Email store ko jaata hai,
// My Orders customer ke paas rehta hai — order website se kabhi gayab nahi hota.

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
  /** Admin ne order kab tak ready hoga ye date di ho (YYYY-MM-DD) */
  readyDate?: string;
}

const KEY = 'raasleela-my-orders';

export function getMyOrders(): MyOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr as MyOrder[];
    }
  } catch { /* ignore */ }
  return [];
}

export function saveMyOrder(o: MyOrder) {
  try {
    const all = [o, ...getMyOrders().filter((x) => x.id !== o.id)].slice(0, 20);
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('raasleela-orders-updated'));
  } catch { /* ignore */ }
}

export function clearMyOrders() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event('raasleela-orders-updated'));
  } catch { /* ignore */ }
}
