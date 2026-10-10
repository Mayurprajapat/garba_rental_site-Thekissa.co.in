import { AnimatePresence, motion } from 'framer-motion';
import { Gem, Heart, SearchX, ShoppingBasket, SlidersHorizontal, Star, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { lookFor, spinFramesFor, type Product } from '../data/products';
import type { LiveProduct } from '../lib/ProductsContext';
import { categoriesEvent, getCategories, matchesCategory, type ShopCategory } from '../lib/categories';
import { itemImgFor } from '../lib/items';
import { useProducts } from '../lib/ProductsContext';
import { getSiteContent, useSiteVersion } from '../lib/siteContent';
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

function ProductCard({ p, index }: { p: LiveProduct; index: number }) {
  const toggleWish = useStore((s) => s.toggleWish);
  const wishlist = useStore((s) => s.wishlist);
  const setQuickView = useStore((s) => s.setQuickView);
  const wished = wishlist.includes(p.id);
  const price = p.rent1;
  const rank = index < 3 ? `N°0${index + 1}` : null;
  const savePct = p.buy > price ? Math.round((1 - price / p.buy) * 100) : 0;
  const freeDandiya = lookFor(p).some((a) => a.tag === 'free' && /dandiya/i.test(a.name));
  const frames = spinFramesFor(p);
  const soldOut = (p.stock ?? 1) <= 0;
  const catLabel = { women: 'Women', men: 'Men', kids: 'Kids', combo: 'Combo', premium: 'Premium' }[p.category] ?? p.category;

  return (
    <div
      className="card card-hover group cursor-pointer h-full overflow-hidden flex flex-col !rounded-[18px]"
      onClick={() => setQuickView(p.id)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f1ea] img-sheen">
        <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
        {soldOut && <span className="absolute inset-0 grid place-items-center bg-black/45 z-[1]"><span className="bg-white text-black text-[11px] font-black tracking-[0.14em] rounded-full px-3.5 py-1.5">OUT OF STOCK</span></span>}
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
          <Heart size={15} className={wished ? 'fill-[#641629] text-[#641629]' : 'text-black'} />
        </button>
        {frames.length > 1 && (
          <span className="absolute bottom-3 left-3 z-[2] bg-black/65 backdrop-blur text-white text-[10px] font-bold tracking-wide rounded-full px-2.5 py-1">⟳ 360°</span>
        )}
      </div>
      <div className="p-3 sm:p-3.5 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-[14.5px] sm:text-[15.5px] leading-snug line-clamp-2 text-black tracking-tight min-h-[42px]">{p.name}</h3>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-[10.5px] font-bold text-[#3d2b36] bg-[#faf3ea] border border-[#c9a44a]/40 rounded-full px-2.5 py-1 truncate max-w-full">{p.fabric}</span>
          {savePct > 0 && <span className="text-[10.5px] font-black text-white bg-emerald-600 rounded-full px-2.5 py-1">SAVE {savePct}%</span>}
        </div>
        <p className="text-[12px] text-neutral-500 mt-2 leading-relaxed line-clamp-2">{p.desc}</p>
        <div className="flex items-center gap-1 text-xs font-semibold text-[#8a6d00] mt-2">
          <Star size={12} className="fill-[#c9960a] text-[#c9960a]" /> {p.rating}
          <span className="text-[#8a7584] font-normal">({p.reviews})</span>
          <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">1-day</span>
        </div>
        <div className="hairline-premium my-2" />
        <div className="flex items-baseline gap-2 mt-auto">
          <b className="font-display text-[19px] sm:text-[20px] text-[#641629] tabular-nums leading-none">₹{price.toLocaleString('en-IN')}</b>
          <span className="text-[11.5px] font-semibold text-neutral-500">/ 1-day rent</span>
        </div>
        <p className="text-[12px] font-bold text-[#8a6d00] mt-1">+ ₹{p.deposit.toLocaleString('en-IN')} Deposit</p>
        {freeDandiya && <p className="text-[11.5px] font-black text-emerald-700 mt-0.5">✓ FREE Dandiya pair included</p>}
        <button onClick={(e) => { e.stopPropagation(); if (!soldOut) setQuickView(p.id); }}
          disabled={soldOut}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 text-white text-[13px] font-bold rounded-full py-2.5 bg-[#221114] shadow-[0_12px_22px_-12px_rgba(34,17,20,.55)] hover:brightness-125 hover:-translate-y-px active:translate-y-0 transition disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:translate-y-0">
          <ShoppingBasket size={14} /> {soldOut ? 'Out of Stock' : 'Rent or Buy Outfit'}
        </button>
      </div>
    </div>
  );
}

function SingleCard({ item }: { item: SingleItem }) {
  const addToCart = useStore((s) => s.addToCart);
  const setQuickView = useStore((s) => s.setQuickView);

  return (
    <div className="card card-hover group h-full overflow-hidden flex flex-col !rounded-[18px]">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f1ea] img-sheen">
        <img src={item.img} alt={item.name} loading="lazy" className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
        <span className="absolute top-3 left-3 z-[2] bg-gradient-to-br from-[#f0d78c] to-[#c9a44a] text-[#1a0f1e] text-[10px] font-black tracking-[0.1em] rounded-full px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">ONLY ITEM</span>
      </div>
      <div className="p-3 sm:p-3.5 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-xs font-semibold text-[#8a6d00]">
          <Gem size={12} className="text-[#c9960a]" />
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">Without dress · One-size</span>
        </div>
        <h3 className="font-display font-semibold text-[14.5px] sm:text-[15.5px] leading-snug mt-1.5 line-clamp-2 text-black tracking-tight min-h-[42px]">{item.name}</h3>
        <p className="text-[12px] text-neutral-500 mt-2 leading-relaxed line-clamp-2">Rent alone — wear with any look, no dress needed.</p>
        <div className="hairline-premium my-2" />
        <div className="flex items-baseline gap-2 mt-auto">
          <b className="font-display text-[19px] sm:text-[20px] text-[#641629] tabular-nums leading-none">₹{item.price.toLocaleString('en-IN')}</b>
          <span className="text-[11.5px] font-semibold text-neutral-500">rent</span>
        </div>
        <button onClick={() => addToCart(item.productId, 'One-size', '1day', undefined, { name: item.name, price: item.price })}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 text-white text-[13px] font-bold rounded-full py-2.5 bg-[#221114] shadow-[0_12px_22px_-12px_rgba(34,17,20,.55)] hover:brightness-125 hover:-translate-y-px active:translate-y-0 transition">
          <ShoppingBasket size={14} /> Rent Only This
        </button>
        <button onClick={() => setQuickView(item.productId)} className="mt-1.5 text-[12px] font-semibold text-neutral-400 hover:text-[#641629] transition">View dress →</button>
      </div>
    </div>
  );
}

export default function Shop() {
  const { products: PRODUCTS, loading, live } = useProducts();
  useSiteVersion();
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  const sort = useStore((s) => s.sort);
  const setSort = useStore((s) => s.setSort);
  const maxPrice = useStore((s) => s.maxPrice);
  const setMaxPrice = useStore((s) => s.setMaxPrice);
  const activeCat = useStore((s) => s.activeCat);
  const setActiveCat = useStore((s) => s.setActiveCat);
  const wishOnly = useStore((s) => s.wishOnly);
  const setWishOnly = useStore((s) => s.setWishOnly);
  const wishlist = useStore((s) => s.wishlist);
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
      setWishOnly(false);
      return;
    }
    setActiveCat({ id: c.id, label: c.label, kind: c.kind, query: c.query, cats: c.cats });
    setSearch('');
  };

  const isItemMode = activeCat?.kind === 'item';
  const clearCat = () => setActiveCat(null);

  const list = useMemo(() => {
    let l = [...PRODUCTS];
    if (activeCat?.kind === 'dress') {
      // Dress group filter (women/men/kids/…) — phir keyword (comma = OR)
      if (activeCat.cats?.length) l = l.filter((p) => activeCat.cats!.includes(p.category));
      if (activeCat.query.trim()) {
        l = l.filter((p) => {
          const hay = `${p.name} ${p.hindi} ${p.id} ${p.desc} ${p.category} ${p.fabric} ${p.colors.join(' ')} ${(p.accessories ?? []).map((a) => a.name).join(' ')}`.toLowerCase();
          return matchesCategory(hay, activeCat.query);
        });
      }
    }
    l = l.filter((p) => p.rent1 <= maxPrice);
    if (search.trim()) {
      const words = search.toLowerCase().split(/\s+/).filter(Boolean);
      l = l.filter((p) => {
        const hay = `${p.name} ${p.hindi} ${p.id} ${p.desc} ${p.category} ${p.fabric} ${p.colors.join(' ')} ${(p.accessories ?? []).map((a) => a.name).join(' ')}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      });
    }
    if (sort === 'low') l = [...l].sort((a, b) => a.rent1 - b.rent1);
    if (sort === 'high') l = [...l].sort((a, b) => b.rent1 - a.rent1);
    if (sort === 'rating') l = [...l].sort((a, b) => b.rating - a.rating);
    if (wishOnly) l = l.filter((p) => wishlist.includes(p.id));
    return l;
  }, [PRODUCTS, activeCat, search, sort, maxPrice, wishOnly, wishlist]);

  // Item mode — SIRF single-rent items (dress mix nahi). Comma = OR, space = AND.
  const itemList = useMemo(() => {
    if (!isItemMode) return [];
    const q = (activeCat?.query ?? '').trim();
    let items = singlesFor(PRODUCTS).filter((it) =>
      !q || matchesCategory(it.name.toLowerCase(), q)
    );
    items = items.filter((it) => it.price <= maxPrice);
    if (wishOnly) items = items.filter((it) => wishlist.includes(it.productId));
    if (sort === 'low') items = [...items].sort((a, b) => a.price - b.price);
    if (sort === 'high') items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [PRODUCTS, activeCat, maxPrice, sort, isItemMode, wishOnly, wishlist]);

  const activeFilters = (maxPrice < 4000 ? 1 : 0) + (sort !== 'pop' ? 1 : 0) + (wishOnly ? 1 : 0);

  return (
    <section id="shop" className="bg-[#faf8f6] border-b border-[#641629]/10 scroll-mt-[100px]">
      <div className="container-x pt-4 pb-2">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <div>
            <p className="eyebrow">{isItemMode ? activeCat?.label ?? 'The festive collection' : 'The festive collection'}</p>
            <h2 className="premium-heading font-display font-black text-xl sm:text-2xl mt-1 text-black">
              {isItemMode ? <>{activeCat?.label} — <span className="font-display-i text-[#641629]">items only</span></> : <>Dress for Every <span className="font-display-i text-[#641629]">Celebration</span></>}
            </h2>
          </div>
          <p className="text-[12.5px] text-neutral-400 sm:ml-auto">
            Finishing & deposit included · {loading ? 'Updating…' : live ? 'Live availability' : 'Ready to book'}
          </p>
        </div>
      </div>

      {/* Photo category strip — har kapda/item alag tile, tap = filter */}
      {cats.length > 0 && (
        <div className="container-x pb-2">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {cats.map((c) => {
              const on = activeCat?.id === c.id;
              return (
                <button key={c.id} onClick={() => pickCat(on ? null : c)}
                  className={`relative shrink-0 w-[132px] sm:w-[148px] h-[88px] sm:h-[98px] rounded-2xl overflow-hidden text-left transition-all duration-200 ${on ? 'ring-[3px] ring-[#221114] ring-offset-2 ring-offset-[#faf8f6]' : 'ring-1 ring-black/10 hover:ring-black/30'}`}>
                  {c.img
                    ? <img src={c.img} alt={c.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    : <div className="absolute inset-0 grid place-items-center text-[10px] text-neutral-400 bg-[#f4f1ea]">No photo</div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <span className="absolute top-1.5 right-1.5 text-[8.5px] font-bold tracking-wider uppercase bg-white/85 backdrop-blur rounded-full px-1.5 py-0.5">{c.kind === 'item' ? 'Item' : 'Dresses'}</span>
                  <span className="absolute bottom-1.5 left-2 right-2 text-[11.5px] font-bold text-white leading-tight line-clamp-2 drop-shadow">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky filter bar — collection scroll ho, filters haath me rahen */}
      <div className="sticky top-[100px] z-30 glass border-y border-black/[.07] shadow-[0_12px_28px_-22px_rgba(0,0,0,.45)]">
        <div className="container-x py-2 flex flex-col gap-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <button onClick={() => pickCat(null)}
              className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold border transition-all duration-200 ${!activeCat && !search.trim() && !wishOnly ? 'bg-[#641629] text-white border-[#641629] shadow-[0_8px_18px_-8px_rgba(77,15,31,.7)]' : 'bg-white text-[#3d2b36] border-black/10 hover:border-[#641629]/50 hover:text-[#641629]'}`}>
              All Outfits
            </button>
            {cats.map((c) => (
              <button key={c.id} onClick={() => pickCat(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold border transition-all duration-200 ${activeCat?.id === c.id ? 'bg-[#641629] text-white border-[#641629] shadow-[0_8px_18px_-8px_rgba(77,15,31,.7)]' : 'bg-white text-[#3d2b36] border-black/10 hover:border-[#641629]/50 hover:text-[#641629]'}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-black/[.05] ring-1 ring-black/5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-black shrink-0">1-day rental</div>
            <button onClick={() => setShowFilters((v) => !v)}
              className="shrink-0 relative flex items-center gap-1.5 text-[12.5px] font-semibold border border-black/10 rounded-full px-3.5 py-1.5 hover:border-black/40 bg-white transition">
              <SlidersHorizontal size={14} /> <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && <span className="w-4 h-4 rounded-full bg-[#641629] text-white text-[9px] font-bold grid place-items-center">{activeFilters}</span>}
            </button>
          </div>

          {search.trim() && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-black text-white text-[12px] font-semibold rounded-full pl-3.5 pr-1.5 py-1">
                “{search.trim()}”
                <button onClick={() => setSearch('')} aria-label="Clear search" className="w-5 h-5 grid place-items-center rounded-full bg-white/20 hover:bg-white hover:text-black transition"><X size={12} /></button>
              </span>
            </div>
          )}
          {activeCat && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#641629] text-white text-[12px] font-semibold rounded-full pl-3.5 pr-1.5 py-1">
                {activeCat.label} · {isItemMode ? 'items only' : 'dresses'}
                <button onClick={clearCat} aria-label="Clear category" className="w-5 h-5 grid place-items-center rounded-full bg-white/20 hover:bg-white hover:text-black transition"><X size={12} /></button>
              </span>
            </div>
          )}
          {wishOnly && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-black text-white text-[12px] font-semibold rounded-full pl-3.5 pr-1.5 py-1">
                ♥ Wishlist only
                <button onClick={() => setWishOnly(false)} aria-label="Show all" className="w-5 h-5 grid place-items-center rounded-full bg-white/20 hover:bg-white hover:text-black transition"><X size={12} /></button>
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
                <input type="range" min={299} max={4000} step={100} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-32 accent-black" aria-label="Maximum price" />
              </label>
              {activeFilters > 0 && (
                <button onClick={() => { setMaxPrice(4000); setSort('pop'); setSearch(''); clearCat(); setWishOnly(false); }} className="text-[12px] font-semibold text-black underline underline-offset-2">Clear all</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container-x py-4">
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3" aria-hidden>
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
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <AnimatePresence mode="popLayout">
                {itemList.map((it) => (
                  <SingleCard key={it.name} item={it} />
                ))}
              </AnimatePresence>
            </motion.div>
            {itemList.length === 0 && !loading && (
              <div className="text-center py-10">
                <span className="mx-auto w-14 h-14 rounded-full bg-[#641629]/[.06] grid place-items-center"><Gem size={22} className="text-[#641629]" /></span>
                <p className="font-display font-semibold text-lg mt-4">No items in this category yet</p>
                <button onClick={() => { clearCat(); setSearch(''); setMaxPrice(4000); setWishOnly(false); }} className="btn-primary mt-4 !py-2.5 !text-[13px]">Show all</button>
              </div>
            )}
          </>
        ) : (
          <>
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <AnimatePresence mode="popLayout">
                {list.map((p, i) => (
                  <ProductCard key={p.id} p={p} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
            {list.length === 0 && !loading && (
              <div className="text-center py-10">
                <span className="mx-auto w-14 h-14 rounded-full bg-[#641629]/[.06] grid place-items-center"><SearchX size={22} className="text-[#641629]" /></span>
                <p className="font-display font-semibold text-lg mt-4">Nothing found</p>
                <p className="text-[#6f5b6a] text-[13px] mt-1">Try another search or price.</p>
                <button onClick={() => { clearCat(); setSearch(''); setMaxPrice(4000); setWishOnly(false); }} className="btn-primary mt-4 !py-2.5 !text-[13px]">Show all</button>
              </div>
            )}
          </>
        )}
        <p className="text-center text-xs text-[#8a7584] mt-4">{getSiteContent().shopNote}</p>
      </div>
    </section>
  );
}
