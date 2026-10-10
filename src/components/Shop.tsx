import { AnimatePresence, motion } from 'framer-motion';
import { Gem, Heart, Search, SearchX, ShoppingBasket, SlidersHorizontal, Star, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { lookFor, type Product } from '../data/products';
import { categoriesEvent, getCategories, type ShopCategory } from '../lib/categories';
import { itemImgFor } from '../lib/items';
import { useProducts } from '../lib/ProductsContext';
import { useStore } from '../store/useStore';

export interface SingleItem {
  name: string;
  price: number;
  img: string;
  productId: string;
}

/** Bina dress ke akela rent hone wale items (addon accessories) — naam se dedupe. */
export function singlesFor(products: Product[]): SingleItem[] {
  const map = new Map<string, SingleItem>();
  products.forEach((p) => {
    lookFor(p)
      .filter((a) => a.tag === 'addon' && (a.price ?? 0) > 0)
      .forEach((a) => {
        const key = a.name.toLowerCase();
        if (!map.has(key)) map.set(key, { name: a.name, price: a.price ?? 0, img: itemImgFor(a.name, p.img), productId: p.id });
      });
  });
  return [...map.values()];
}

function ProductCard({ p, plan, index }: { p: Product; plan: '3day' | '9day'; index: number }) {
  const toggleWish = useStore((s) => s.toggleWish);
  const wishlist = useStore((s) => s.wishlist);
  const setQuickView = useStore((s) => s.setQuickView);
  const wished = wishlist.includes(p.id);
  const price = plan === '3day' ? p.rent3 : p.rent9;
  const rank = index < 3 ? `N°0${index + 1}` : null;
  const sizeChip = p.sizes.length > 1 ? `${p.sizes[0]} – ${p.sizes[p.sizes.length - 1]}` : p.sizes[0];
  const catLabel = { women: 'Women', men: 'Men', kids: 'Kids', combo: 'Combo', premium: 'Premium' }[p.category] ?? p.category;

  return (
    <div
      className="card card-hover group cursor-pointer h-full overflow-hidden flex flex-col !rounded-[18px]"
      onClick={() => setQuickView(p.id)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f1ea] img-sheen">
        <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-[2]">
          {rank && <span className="bg-gradient-to-br from-[#f0d78c] to-[#c9a44a] text-[#1a0f1e] text-[10px] font-black tracking-[0.1em] rounded-full px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">{rank}</span>}
          <span className="bg-white/95 backdrop-blur text-[#641629] text-[10px] font-bold tracking-[0.08em] uppercase rounded-full px-2.5 py-1 ring-1 ring-[#641629]/15">{catLabel}</span>
          {p.badge && (
            <span className="bg-[#641629]/90 backdrop-blur text-[#f7ead0] text-[10px] font-bold tracking-[0.1em] rounded-full px-2.5 py-1.5 ring-1 ring-white/15">{p.badge}</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggleWish(p.id); }}
          aria-label="Wishlist"
          className={`absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-white/95 backdrop-blur shadow-[0_6px_16px_-8px_rgba(0,0,0,.4)] hover:scale-110 transition z-[2] ${wished ? 'heart-pop' : ''}`}
        >
          <Heart size={15} className={wished ? 'fill-[#c9273a] text-[#c9273a]' : 'text-black'} />
        </button>
      </div>
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-[14.5px] sm:text-[15.5px] leading-snug line-clamp-2 text-black tracking-tight min-h-[42px]">{p.name}</h3>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-[10.5px] font-bold text-[#3d2b36] bg-[#faf3ea] border border-[#c9a44a]/40 rounded-full px-2.5 py-1">{sizeChip}</span>
          <span className="text-[10.5px] font-bold text-[#3d2b36] bg-[#faf3ea] border border-[#c9a44a]/40 rounded-full px-2.5 py-1 truncate max-w-full">{p.fabric}</span>
          <span className="text-[10.5px] font-semibold text-neutral-400 border border-black/10 rounded-full px-2.5 py-1">Buy: ₹{p.buy.toLocaleString('en-IN')}</span>
        </div>
        <p className="text-[12px] text-neutral-500 mt-2 leading-relaxed line-clamp-2">{p.desc}</p>
        <div className="flex items-center gap-1 text-xs font-semibold text-[#8a6d00] mt-2">
          <Star size={12} className="fill-[#c9960a] text-[#c9960a]" /> {p.rating}
          <span className="text-[#8a7584] font-normal">({p.reviews})</span>
          <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">{plan === '3day' ? '3-day' : '9-day'}</span>
        </div>
        <div className="hairline-premium my-2.5" />
        <div className="flex items-baseline gap-2 mt-auto">
          <b className="font-display text-[21px] sm:text-[22px] text-[#641629] tabular-nums leading-none">₹{price.toLocaleString('en-IN')}</b>
          <span className="text-[11.5px] font-semibold text-neutral-500">/ {plan === '3day' ? '3-day' : '9-day'} rent</span>
        </div>
        <p className="text-[12px] font-bold text-[#8a6d00] mt-1">+ ₹{p.deposit.toLocaleString('en-IN')} Deposit</p>
        <button onClick={(e) => { e.stopPropagation(); setQuickView(p.id); }}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 text-white text-[13px] font-bold rounded-full py-3 bg-gradient-to-r from-[#e8590c] to-[#c9273a] shadow-[0_12px_24px_-12px_rgba(200,60,20,.65)] hover:brightness-110 hover:-translate-y-px active:translate-y-0 transition">
          <ShoppingBasket size={14} /> Rent or Buy Outfit
        </button>
      </div>
    </div>
  );
}

function SingleCard({ item, plan }: { item: SingleItem; plan: '3day' | '9day' }) {
  const addToCart = useStore((s) => s.addToCart);
  const setQuickView = useStore((s) => s.setQuickView);

  return (
    <div className="card card-hover group h-full overflow-hidden flex flex-col !rounded-[18px]">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f1ea] img-sheen">
        <img src={item.img} alt={item.name} loading="lazy" className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
        <span className="absolute top-3 left-3 z-[2] bg-gradient-to-br from-[#f0d78c] to-[#c9a44a] text-[#1a0f1e] text-[10px] font-black tracking-[0.1em] rounded-full px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">ONLY ITEM</span>
      </div>
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-xs font-semibold text-[#8a6d00]">
          <Gem size={12} className="text-[#c9960a]" />
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">Bina dress · One-size</span>
        </div>
        <h3 className="font-display font-semibold text-[14.5px] sm:text-[15.5px] leading-snug mt-1.5 line-clamp-2 text-black tracking-tight min-h-[42px]">{item.name}</h3>
        <p className="text-[12px] text-neutral-500 mt-2 leading-relaxed line-clamp-2">Akela rent — kisi bhi look ke saath pehno, dress ki jarurat nahi.</p>
        <div className="hairline-premium my-2.5" />
        <div className="flex items-baseline gap-2 mt-auto">
          <b className="font-display text-[21px] sm:text-[22px] text-[#641629] tabular-nums leading-none">₹{item.price.toLocaleString('en-IN')}</b>
          <span className="text-[11.5px] font-semibold text-neutral-500">rent</span>
        </div>
        <button onClick={() => addToCart(item.productId, 'One-size', plan, undefined, { name: item.name, price: item.price })}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 text-white text-[13px] font-bold rounded-full py-3 bg-gradient-to-r from-[#e8590c] to-[#c9273a] shadow-[0_12px_24px_-12px_rgba(200,60,20,.65)] hover:brightness-110 hover:-translate-y-px active:translate-y-0 transition">
          <ShoppingBasket size={14} /> Rent Only This
        </button>
        <button onClick={() => setQuickView(item.productId)} className="mt-1.5 text-[12px] font-semibold text-neutral-400 hover:text-[#641629] transition">View dress →</button>
      </div>
    </div>
  );
}

export default function Shop() {
  const { products: PRODUCTS, loading, live } = useProducts();
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const sort = useStore((s) => s.sort);
  const setSort = useStore((s) => s.setSort);
  const maxPrice = useStore((s) => s.maxPrice);
  const setMaxPrice = useStore((s) => s.setMaxPrice);
  const activeCat = useStore((s) => s.activeCat);
  const setActiveCat = useStore((s) => s.setActiveCat);
  const [plan, setPlan] = useState<'3day' | '9day'>('3day');
  const [showFilters, setShowFilters] = useState(false);
  const [cats, setCats] = useState<ShopCategory[]>(() => getCategories());

  useEffect(() => {
    const refresh = () => setCats(getCategories());
    const evt = categoriesEvent();
    window.addEventListener(evt, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(evt, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const pickCat = (c: ShopCategory | null) => {
    if (!c) {
      setActiveCat(null);
      setSearch('');
      return;
    }
    setActiveCat({ id: c.id, label: c.label, kind: c.kind, query: c.query });
    setSearch('');
  };

  const isItemMode = activeCat?.kind === 'item';
  const clearCat = () => setActiveCat(null);

  const list = useMemo(() => {
    let l = [...PRODUCTS];
    if (activeCat?.kind === 'dress' && activeCat.query.trim()) {
      const words = activeCat.query.toLowerCase().split(/[,\s]+/).filter(Boolean);
      l = l.filter((p) => {
        const hay = `${p.name} ${p.hindi} ${p.id} ${p.desc} ${p.category} ${p.fabric} ${p.colors.join(' ')} ${(p.accessories ?? []).map((a) => a.name).join(' ')}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }
    l = l.filter((p) => p.rent3 <= maxPrice);
    if (search.trim()) {
      const words = search.toLowerCase().split(/\s+/).filter(Boolean);
      l = l.filter((p) => {
        const hay = `${p.name} ${p.hindi} ${p.id} ${p.desc} ${p.category} ${p.fabric} ${p.colors.join(' ')} ${(p.accessories ?? []).map((a) => a.name).join(' ')}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }
    if (sort === 'low') l = [...l].sort((a, b) => a.rent3 - b.rent3);
    if (sort === 'high') l = [...l].sort((a, b) => b.rent3 - a.rent3);
    if (sort === 'rating') l = [...l].sort((a, b) => b.rating - a.rating);
    return l;
  }, [PRODUCTS, activeCat, search, sort, maxPrice]);

  // Item mode — SIRF single-rent items (dress mix nahi)
  const itemList = useMemo(() => {
    if (!isItemMode) return [];
    const words = (activeCat?.query ?? '').toLowerCase().split(/[,\s]+/).filter(Boolean);
    let items = singlesFor(PRODUCTS).filter((it) =>
      !words.length || words.some((w) => it.name.toLowerCase().includes(w))
    );
    items = items.filter((it) => it.price <= maxPrice);
    if (sort === 'low') items = [...items].sort((a, b) => a.price - b.price);
    if (sort === 'high') items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [PRODUCTS, activeCat, maxPrice, sort, isItemMode]);

  const activeFilters = (maxPrice < 4000 ? 1 : 0) + (sort !== 'pop' ? 1 : 0);

  return (
    <section id="shop" className="bg-[#faf8f6] border-b border-[#641629]/10 scroll-mt-[100px]">
      <div className="container-x pt-5 pb-3">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <div>
            <p className="eyebrow">{isItemMode ? activeCat?.label ?? 'The festive collection' : 'The festive collection'}</p>
            <h2 className="premium-heading font-display font-black text-2xl sm:text-[30px] mt-1 text-black">
              {isItemMode ? <>{activeCat?.label} — <span className="font-display-i text-[#641629]">sirf items</span></> : <>Dress for Every <span className="font-display-i text-[#641629]">Celebration</span></>}
            </h2>
          </div>
          <p className="text-[12.5px] text-neutral-400 sm:ml-auto">
            Fitting, finishing & deposit included · {loading ? 'Updating…' : live ? 'Live availability' : 'Ready to book'}
          </p>
        </div>
      </div>

      {/* Sticky filter bar — collection scroll ho, filters haath me rahen */}
      <div className="sticky top-[100px] z-30 glass border-y border-black/[.07] shadow-[0_12px_28px_-22px_rgba(0,0,0,.45)]">
        <div className="container-x py-2.5 flex flex-col gap-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <button onClick={() => pickCat(null)}
              className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold border transition-all duration-200 ${!activeCat && !search.trim() ? 'bg-[#c9273a] text-white border-[#c9273a] shadow-[0_8px_18px_-8px_rgba(201,39,58,.7)]' : 'bg-white text-[#3d2b36] border-black/10 hover:border-[#c9273a]/50 hover:text-[#641629]'}`}>
              All Outfits
            </button>
            {cats.map((c) => (
              <button key={c.id} onClick={() => pickCat(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold border transition-all duration-200 ${activeCat?.id === c.id ? 'bg-[#c9273a] text-white border-[#c9273a] shadow-[0_8px_18px_-8px_rgba(201,39,58,.7)]' : 'bg-white text-[#3d2b36] border-black/10 hover:border-[#c9273a]/50 hover:text-[#641629]'}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-black/[.05] ring-1 ring-black/5 rounded-full p-0.5 text-[12.5px] font-semibold shrink-0">
              <button onClick={() => setPlan('3day')} className={`px-3.5 py-1.5 rounded-full transition ${plan === '3day' ? 'bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,.2)] text-black' : 'text-neutral-400'}`}>3-day</button>
              <button onClick={() => setPlan('9day')} className={`px-3.5 py-1.5 rounded-full transition ${plan === '9day' ? 'bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,.2)] text-black' : 'text-neutral-400'}`}>9-day</button>
            </div>
            <button onClick={() => setShowFilters((v) => !v)}
              className="shrink-0 relative flex items-center gap-1.5 text-[12.5px] font-semibold border border-black/10 rounded-full px-3.5 py-1.5 hover:border-black/40 bg-white transition">
              <SlidersHorizontal size={14} /> <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && <span className="w-4 h-4 rounded-full bg-[#c9273a] text-white text-[9px] font-bold grid place-items-center">{activeFilters}</span>}
            </button>
          </div>

          <div className="flex gap-2">
            <label id="shop-search" className="flex-1 flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-2.5 shadow-[0_10px_24px_-18px_rgba(100,22,41,.35)] focus-within:border-[#c9273a]/50 focus-within:shadow-[0_10px_28px_-16px_rgba(201,39,58,.45)] transition">
              <Search size={16} className="text-[#c9273a] shrink-0" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); if (e.target.value) clearCat(); }} placeholder="Search dress code…" className="bg-transparent outline-none w-full text-[13px]" />
              {search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={14} className="text-black/35" /></button>}
            </label>
          </div>
          {activeCat && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#641629] text-white text-[12px] font-semibold rounded-full pl-3.5 pr-1.5 py-1">
                {activeCat.label} · {isItemMode ? 'sirf items' : 'dresses'}
                <button onClick={clearCat} aria-label="Clear category" className="w-5 h-5 grid place-items-center rounded-full bg-white/20 hover:bg-white hover:text-black transition"><X size={12} /></button>
              </span>
            </div>
          )}

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 bg-black/[.03] ring-1 ring-black/5 rounded-2xl px-4 py-3">
              <select value={sort} onChange={(e) => setSort(e.target.value as never)} className="input-pro !w-auto !py-1.5 text-[12.5px]">
                <option value="pop">Most popular</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="rating">Top rated</option>
              </select>
              <label className="flex items-center gap-2 text-[12.5px] text-neutral-500 font-semibold">
                Max <b className="text-black">₹{maxPrice.toLocaleString('en-IN')}</b>
                <input type="range" min={799} max={4000} step={100} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-32 accent-black" aria-label="Maximum price" />
              </label>
              {activeFilters > 0 && (
                <button onClick={() => { setMaxPrice(4000); setSort('pop'); setSearch(''); clearCat(); }} className="text-[12px] font-semibold text-black underline underline-offset-2">Clear all</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container-x py-5">
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-[3/4] bg-[#f0e8e2] animate-pulse" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3.5 rounded-full bg-[#f0e8e2] animate-pulse w-3/4" />
                  <div className="h-5 rounded-full bg-[#f0e8e2] animate-pulse w-1/2" />
                  <div className="h-9 rounded-full bg-[#f0e8e2] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
        {isItemMode ? (
          <>
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <AnimatePresence mode="popLayout">
                {itemList.map((it) => (
                  <SingleCard key={it.name} item={it} plan={plan} />
                ))}
              </AnimatePresence>
            </motion.div>
            {itemList.length === 0 && !loading && (
              <div className="text-center py-14">
                <span className="mx-auto w-14 h-14 rounded-full bg-[#641629]/[.06] grid place-items-center"><Gem size={22} className="text-[#641629]" /></span>
                <p className="font-display font-semibold text-lg mt-4">Is category me abhi koi item nahi</p>
                <button onClick={() => { clearCat(); setSearch(''); setMaxPrice(4000); }} className="btn-primary mt-4 !py-2.5 !text-[13px]">Sab dikhao</button>
              </div>
            )}
          </>
        ) : (
          <>
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <AnimatePresence mode="popLayout">
                {list.map((p, i) => (
                  <ProductCard key={p.id} p={p} plan={plan} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
            {list.length === 0 && !loading && (
              <div className="text-center py-14">
                <span className="mx-auto w-14 h-14 rounded-full bg-[#641629]/[.06] grid place-items-center"><SearchX size={22} className="text-[#641629]" /></span>
                <p className="font-display font-semibold text-lg mt-4">Kuch nahi mila</p>
                <p className="text-[#6f5b6a] text-[13px] mt-1">Try another search or price.</p>
                <button onClick={() => { clearCat(); setSearch(''); setMaxPrice(4000); }} className="btn-primary mt-4 !py-2.5 !text-[13px]">Sab dikhao</button>
              </div>
            )}
          </>
        )}
        <p className="text-center text-xs text-[#8a7584] mt-6">3 or 9-day rentals · 100% refundable deposit · Codes: NAVRATRI20, GROUP25, FIRST10</p>
      </div>
    </section>
  );
}
