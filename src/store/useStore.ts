import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category } from '../data/products';

export interface CartItem {
  id: string;
  size: string;
  plan: '3day' | '9day';
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
  addToCart: (id: string, size: string, plan: '3day' | '9day', addons?: string[], single?: { name: string; price: number; img?: string }) => void;
  removeFromCart: (id: string, size: string, plan: '3day' | '9day', addons?: string[], singleName?: string) => void;
  clearCart: () => void;
  toggleWish: (id: string) => void;
  pushToast: (msg: string) => void;
}

let toastId = 1;

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
      addToCart: (id, size, plan, addons, single) => {
        const { cart } = get();
        const key = (addons ?? []).join('|');
        const sName = single?.name ?? '';
        const found = cart.find((c) => c.id === id && c.size === size && c.plan === plan && (c.addons ?? []).join('|') === key && (c.single?.name ?? '') === sName);
        const next = found
          ? cart.map((c) => (c === found ? { ...c, qty: c.qty + 1 } : c))
          : [...cart, { id, size, plan, qty: 1, addons: addons?.length ? [...addons] : undefined, single: single ? { ...single } : undefined }];
        set({ cart: next, cartOpen: true });
        get().pushToast(single ? `Only ${single.name} added to the list!` : addons?.length ? 'Dress + accessories added!' : 'Added to your booking list!');
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
  const p = promo.trim().toUpperCase();
  if (p === 'NAVRATRI20') return Math.round(subtotal * 0.2);
  if (p === 'GROUP25') return Math.round(subtotal * 0.25);
  if (p === 'FIRST10') return Math.round(subtotal * 0.1);
  return 0;
}
