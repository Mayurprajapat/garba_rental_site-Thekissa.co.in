import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category } from '../data/products';
import { getSiteContent } from '../lib/siteContent';

export interface CartItem {
  id: string;
  size: string;
  plan: '1day';
  qty: number;
  addons?: string[];
  // Bina dress ke sirf accessory rent ho to ye set hota hai (price snapshot)
  single?: { name: string; price: number; img?: string };
}

export interface ActiveCat {
  id: string;
  label: string;
  kind: 'dress' | 'item';
  query: string;
  cats?: Category[];
}

interface Toast { id: number; msg: string; }

interface Store {
  cart: CartItem[];
  wishlist: string[];
  category: Category | 'all';
  search: string;
  sort: 'pop' | 'low' | 'high' | 'rating';
  maxPrice: number;
  quickView: string | null;
  cartOpen: boolean;
  activeCat: ActiveCat | null;
  setActiveCat: (c: ActiveCat | null) => void;
  wishOnly: boolean;
  setWishOnly: (b: boolean) => void;
  eventDate: string;
  promo: string;
  toasts: Toast[];
  setCategory: (c: Category | 'all') => void;
  setSearch: (s: string) => void;
  setSort: (s: Store['sort']) => void;
  setMaxPrice: (n: number) => void;
  setQuickView: (id: string | null) => void;
  setCartOpen: (b: boolean) => void;
  setEventDate: (d: string) => void;
  setPromo: (p: string) => void;
  addToCart: (id: string, size: string, plan: '1day', addons?: string[], single?: { name: string; price: number; img?: string }, qty?: number) => void;
  removeFromCart: (id: string, size: string, plan: '1day', addons?: string[], singleName?: string) => void;
  setQty: (id: string, size: string, plan: '1day', addons: string[] | undefined, singleName: string | undefined, qty: number) => void;
  clearCart: () => void;
  toggleWish: (id: string) => void;
  pushToast: (msg: string) => void;
}

let toastId = 1;
// Mistap guard — same item par double-tap ho to dusri tap ignore (800ms window)
let lastAddKey = '';
let lastAddAt = 0;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      category: 'all',
      search: '',
      sort: 'pop',
      maxPrice: 4000,
      quickView: null,
      cartOpen: false,
      activeCat: null,
      setActiveCat: (activeCat) => set({ activeCat }),
      wishOnly: false,
      setWishOnly: (wishOnly) => set({ wishOnly }),
      eventDate: '',
      promo: '',
      toasts: [],
      setCategory: (category) => set({ category }),
      setSearch: (search) => set({ search }),
      setSort: (sort) => set({ sort }),
      setMaxPrice: (maxPrice) => set({ maxPrice }),
      setQuickView: (quickView) => set({ quickView }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setEventDate: (eventDate) => set({ eventDate }),
      setPromo: (promo) => set({ promo }),
      addToCart: (id, size, plan, addons, single, qty = 1) => {
        const { cart } = get();
        const key = (addons ?? []).join('|');
        const sName = single?.name ?? '';
        const dedupeKey = `${id}|${size}|${plan}|${key}|${sName}`;
        const now = Date.now();
        if (dedupeKey === lastAddKey && now - lastAddAt < 800) return;
        lastAddKey = dedupeKey;
        lastAddAt = now;
        const want = Math.max(1, Math.min(10, Math.round(qty) || 1));
        const found = cart.find((c) => c.id === id && c.size === size && c.plan === plan && (c.addons ?? []).join('|') === key && (c.single?.name ?? '') === sName);
        const next = found
          ? cart.map((c) => (c === found ? { ...c, qty: Math.min(10, c.qty + want) } : c))
          : [...cart, { id, size, plan, qty: want, addons: addons?.length ? [...addons] : undefined, single: single ? { ...single } : undefined }];
        set({ cart: next, cartOpen: true });
        get().pushToast(single ? `Only ${single.name} added to the list!` : addons?.length ? 'Dress + accessories added!' : 'Added to your booking list!');
      },
      setQty: (id, size, plan, addons, singleName, qty) => {
        const q = Math.max(1, Math.min(10, Math.round(qty) || 1));
        const key = (addons ?? []).join('|');
        set({
          cart: get().cart.map((c) =>
            c.id === id && c.size === size && c.plan === plan
            && (c.addons ?? []).join('|') === key
            && (c.single?.name ?? '') === (singleName ?? '')
              ? { ...c, qty: q }
              : c
          ),
        });
      },
      removeFromCart: (id, size, plan, addons, singleName) =>
        set({
          cart: get().cart.filter((c) => !(c.id === id && c.size === size && c.plan === plan
            && (singleName !== undefined
              ? (c.single?.name ?? '') === singleName
              : (!c.single && (addons === undefined || (c.addons ?? []).join('|') === addons.join('|')))))),
        }),
      clearCart: () => set({ cart: [] }),
      toggleWish: (id) => {
        const w = get().wishlist;
        set({ wishlist: w.includes(id) ? w.filter((x) => x !== id) : [...w, id] });
        get().pushToast(w.includes(id) ? 'Removed from wishlist' : 'Saved to wishlist!');
      },
      pushToast: (msg) => {
        const id = toastId++;
        set({ toasts: [...get().toasts, { id, msg }] });
        setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 2600);
      },
    }),
    { name: 'raasleela-store', partialize: (s) => ({ cart: s.cart, wishlist: s.wishlist, eventDate: s.eventDate }) as Store }
  )
);

export function promoDiscount(subtotal: number, promo: string): number {
  // Promo codes Admin panel → Website se aate hain (NAVRATRI20 jaise fixed nahi)
  const p = promo.trim().toUpperCase();
  if (!p) return 0;
  const found = getSiteContent().promos.find((x) => (x.code || '').toUpperCase() === p);
  if (!found || !(found.percent > 0)) return 0;
  return Math.round((subtotal * Math.min(90, found.percent)) / 100);
}
