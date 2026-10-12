import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { PRODUCTS, normalizeSizes, type Product } from '../data/products';
import { getLocalProducts } from './localAdmin';
import { isSupabaseConfigured, supabase } from './supabase';

export interface LiveProduct extends Product {
  stock: number;
  active: boolean;
}

const fallback: LiveProduct[] = PRODUCTS.map((p) => ({ ...p, stock: 5, active: true }));

interface Ctx {
  products: LiveProduct[];
  loading: boolean;
  live: boolean;
  refresh: () => Promise<void>;
}

const ProductsCtx = createContext<Ctx>({ products: fallback, loading: false, live: false, refresh: async () => {} });

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<LiveProduct[]>(() => {
    if (isSupabaseConfigured) return fallback;
    const local = getLocalProducts();
    return local.filter((p) => p.active);
  });
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(!isSupabaseConfigured);

  const refresh = async () => {
    // Supabase laga ho to wahi source of truth
    if (isSupabaseConfigured && supabase) {
      setLoading(true);
      const { data } = await supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false });
      if (data) {
        setProducts(
          data.map((r: any) => ({
            id: r.id, name: r.name, hindi: r.hindi ?? '', category: r.category,
            rent1: r.rent1 ?? Math.round((r.rent3 ?? 999) * 0.6), rent3: r.rent3, rent9: r.rent9, buy: r.buy, deposit: r.deposit,
            rating: Number(r.rating ?? 4.8), reviews: r.reviews ?? 0,
            sizes: normalizeSizes(r.sizes), colors: r.colors ?? [], img: r.img ?? '',
            badge: r.badge ?? undefined, desc: r.desc ?? '', fabric: r.fabric ?? '',
            accessories: Array.isArray(r.accessories) ? r.accessories : undefined,
            images: Array.isArray(r.images) ? r.images : undefined,
            stock: r.stock ?? 5, active: r.active ?? true,
          }))
        );
        setLive(true);
      }
      setLoading(false);
      return;
    }
    // Bina backend ke: localStorage wala admin data hi live hai
    setProducts(getLocalProducts().filter((p) => p.active));
    setLive(true);
  };

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('raasleela-products-updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    // Cloud mode: Supabase Realtime — admin kahi se bhi badle, website live update
    let cleanupRealtime: (() => void) | undefined;
    const sb = supabase;
    if (isSupabaseConfigured && sb) {
      try {
        const ch = sb
          .channel('products-live')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => refresh())
          .subscribe();
        cleanupRealtime = () => {
          try { sb.removeChannel(ch); } catch { /* ignore */ }
        };
      } catch { /* realtime na mile to focus/storage fallback kaafi */ }
    }
    return () => {
      window.removeEventListener('raasleela-products-updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      cleanupRealtime?.();
    };
  }, []);

  return <ProductsCtx.Provider value={{ products, loading, live, refresh }}>{children}</ProductsCtx.Provider>;
}

export const useProducts = () => useContext(ProductsCtx);

export function findProduct(products: LiveProduct[], id: string | null) {
  if (!id) return null;
  return products.find((p) => p.id === id) ?? fallback.find((p) => p.id === id) ?? null;
}
