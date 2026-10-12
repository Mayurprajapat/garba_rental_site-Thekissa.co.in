import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Check, CheckCircle2, CreditCard, Download, Heart, Mail, MapPin, MessageCircle, Minus, Plus, ReceiptText, ShieldCheck, ShoppingBasket, Sparkles, Star, Trash2, Truck, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { addonTotal, lookFor, normalizeSizes, photosFor, spinFramesFor, STORE, waLink, type Accessory, type Category } from '../data/products';
import { itemImgFor } from '../lib/items';
import { fetchOrderById, fetchOrdersByPhone, cloudLookupDiag, isUtrUsed, saveBooking } from '../lib/db';
import { looksFakeUtr } from '../lib/utr';
import { formatINR, halfAdvance, isValidIndianPhone, makeOrderId, refundableExtra } from '../lib/order';
import { useProducts } from '../lib/ProductsContext';
import { QRCodeSVG } from 'qrcode.react';
import { getSiteContent, useSiteVersion } from '../lib/siteContent';
import { isValidVpa, merchantUpi, upiUrl } from '../lib/upi';
import { bookedQtyFor } from '../lib/slots';
import { isPickableDate } from '../lib/availability';
import { fetchApprovedReviews, getLocalReviews, submitReview, type Review } from '../lib/reviews';
import { validReview } from '../lib/reviewForm';
import { OPEN_ORDERS_EVENT, clearMyOrdersFully, getMyOrders, saveMyOrder, subscribeMyOrders, type MyOrder, type MyOrderItem } from '../lib/myOrders';
import { dataUrlToBlob, fileToCompressedDataUrl } from '../lib/proof';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { promoDiscount } from '../store/useStore';
import { getLocalBookings } from '../lib/localAdmin';
import { useStore } from '../store/useStore';
import SpinViewer from './SpinViewer';

export function QuickView() {
  const { products } = useProducts();
  const siteV = useSiteVersion();
  const id = useStore((s) => s.quickView);
  const initialMode = useStore((s) => s.quickViewMode);
  const setQuickView = useStore((s) => s.setQuickView);
  const addToCart = useStore((s) => s.addToCart);
  const toggleWish = useStore((s) => s.toggleWish);
  const wishlist = useStore((s) => s.wishlist);
  const p = products.find((x) => x.id === id) ?? null;
  const [picked, setPicked] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [spin, setSpin] = useState(false);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [mode, setMode] = useState<'rent' | 'buy'>('rent');
  // Date availability checker (additive — Add to list flow stays the same)
  const [availDate, setAvailDate] = useState('');
  const [avail, setAvail] = useState<{ checking: boolean; qty: number } | null>(null);
  useEffect(() => { setPicked([]); setPhotoIdx(0); setSpin(false); setQty(1); setSize(''); setMode(initialMode ?? 'rent'); setAvailDate(''); setAvail(null); }, [id, initialMode]);
  // When the modal is open, lock the background page — all scrolling stays inside the card
  useEffect(() => {
    if (!p) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setQuickView(null); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [p]);
  const completeLook = getSiteContent().completeLook;
  const lookTitle = completeLook?.title?.trim() || 'THE MODEL WORE THIS';
  const lookSubtitle = completeLook?.subtitle?.trim() || 'The complete look is right here — nothing to search for.';
  const lookHint = completeLook?.hint?.trim() || 'Tick = joins the dress · Only this = rent the item alone, without the dress.';
  const look = useMemo(() => (p ? lookFor(p) : []), [p, siteV]);
  const sizes = useMemo(() => normalizeSizes((p as any)?.sizes), [p]);
  const selSize = sizes.includes(size) ? size : sizes[0];
  const photos = useMemo(() => (p ? photosFor(p) : []), [p]);
  const frames = useMemo(() => (p ? spinFramesFor(p) : []), [p]);
  const canSpin = frames.length > 1;
  const paidAddons = look.filter((a) => a.tag === 'addon');
  const pickedTotal = p ? addonTotal(p, picked) : 0;
  const soldOut = (p?.stock ?? 1) <= 0;
  const isBuy = mode === 'buy';
  const basePrice = p ? (isBuy ? p.buy : p.rent1) : 0;
  const lineTotal = basePrice + pickedTotal;
  const togglePick = (name: string) =>
    setPicked((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  const addDress = () => {
    if (!p || soldOut) return;
    addToCart(p.id, selSize, isBuy ? 'buy' : '1day', picked.length ? picked : undefined, undefined, qty);
    setQuickView(null);
  };
  const checkAvail = async (d: string) => {
    setAvailDate(d);
    if (!p || !isPickableDate(d)) { setAvail(null); return; }
    setAvail({ checking: true, qty: 0 });
    try {
      const r = await bookedQtyFor(p.id, d);
      setAvail({ checking: false, qty: r.qty });
    } catch {
      setAvail(null);
    }
  };

  return (
    <AnimatePresence>
      {p && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setQuickView(null)} />
          <motion.div initial={{ y: 60, scale: 0.99 }} animate={{ y: 0, scale: 1 }} exit={{ y: 60, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative bg-white rounded-t-[1.5rem] sm:rounded-[1.5rem] max-w-4xl w-full overflow-y-auto md:overflow-hidden overscroll-contain grid md:grid-cols-[0.9fr_1.1fr] max-h-[94dvh] sm:max-h-[92vh] shadow-[0_60px_120px_-40px_rgba(0,0,0,.7)] ring-1 ring-black/10">
            <div className="bg-[#f4f1ea] flex flex-col min-h-0 img-sheen">
              <div className="relative aspect-[3/4] max-h-[44dvh] md:aspect-auto md:h-[540px] md:max-h-[80vh] overflow-hidden shrink-0">
                {spin && canSpin ? (
                  <SpinViewer photos={frames} name={p.name} />
                ) : (
                <>
                <img key={photos[photoIdx] ?? p.img} src={photos[photoIdx] ?? p.img} alt={p.name} className="w-full h-full object-contain" />
                {soldOut && <span className="absolute inset-0 grid place-items-center bg-black/45 z-[2]"><span className="bg-white text-black text-[12px] font-black tracking-[0.14em] rounded-full px-4 py-2">OUT OF STOCK</span></span>}
                {p.badge && !soldOut && <span className="absolute top-4 left-4 bg-gradient-to-br from-[#f0d78c] to-[#c9a44a] text-[#641629] text-[10px] font-bold tracking-[0.12em] rounded-full px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5)] z-[2]">{p.badge}</span>}
                {photoIdx > 0 && (
                  <span className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-[10.5px] font-semibold rounded-full px-3 py-1.5">Same dress • another angle</span>
                )}
                </>
                )}
                {canSpin && (
                  <button onClick={() => { setSpin((v) => !v); }}
                    className="absolute bottom-3 right-3 z-[2] bg-black/65 backdrop-blur text-white text-[11px] font-bold rounded-full px-3.5 py-2 hover:bg-[#641629] transition">
                    {spin ? '✕ Photos' : '⟳ 360°'}
                  </button>
                )}
              </div>
            {photos.length > 1 && (
              <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-2.5 bg-white border-t border-black/10 shrink-0">
                {photos.map((src, i) => (
                  <button key={`${src}-${i}`} onClick={() => { setPhotoIdx(i); setSpin(false); }} aria-label={`Photo ${i + 1}`}
                    className={`rounded-lg sm:rounded-xl overflow-hidden border-2 transition shrink-0 ${i === photoIdx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={src} alt="" className="w-11 h-13 sm:w-14 sm:h-16 object-contain" />
                  </button>
                ))}
                <span className="self-center text-[10.5px] sm:text-[11px] text-black/45 font-medium ml-1">Tap to<br />switch angle</span>
              </div>
            )}
            </div>
            <div className="p-4 sm:p-5 min-h-0 md:max-h-[88vh] md:overflow-y-auto md:overscroll-contain">
              <button onClick={() => setQuickView(null)} aria-label="Close" className="absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full bg-black/[.06] backdrop-blur hover:bg-[#641629] hover:text-white transition z-[3]"><X size={16} /></button>
              <p className="text-[11px] font-bold tracking-[0.14em] text-neutral-400">{p.id} · {p.fabric.toUpperCase()}</p>
              <h3 className="premium-heading font-display font-black text-[22px] leading-tight mt-1.5 text-black">{p.name}</h3>
              <p className="text-[13px] text-neutral-500 mt-0.5">{p.hindi}</p>
              <div className="flex items-center gap-1.5 text-[13px] mt-2.5"><Star size={14} className="fill-[#c9960a] text-[#c9960a]" /><b>{p.rating}</b><span className="text-neutral-400">({p.reviews} reviews)</span></div>
              <p className="text-[13.5px] mt-3 leading-relaxed text-neutral-600">{p.desc}</p>
              {!!look.length && (
                <div className="mt-4 rounded-2xl border border-black/[.07] bg-[#fafafa] p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] text-black"><Sparkles size={13} className="text-[#c9a44a]" /> {lookTitle}</p>
                  <p className="text-[11.5px] text-neutral-500 mt-0.5">{lookSubtitle}</p>
                  <div className="mt-2.5 space-y-1.5">
                    {look.filter((a) => a.tag !== 'addon').map((a) => (
                      <div key={a.name} className="flex items-center gap-2 text-[12.5px] bg-white border border-black/[.07] rounded-xl px-3 py-2 transition">
                        <Check size={14} className="text-emerald-600 shrink-0" />
                        <span className="font-medium flex-1">{a.name}</span>
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${a.tag === 'free' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-black/[.05] text-black/60'}`}>
                          {a.tag === 'free' ? 'FREE' : 'INCLUDED'}
                        </span>
                      </div>
                    ))}
                    {paidAddons.map((a) => {
                      const on = picked.includes(a.name);
                      return (
                        <div key={a.name} className="flex gap-1.5">
                          <button onClick={() => togglePick(a.name)} title="Add with the dress"
                            className={`flex-1 flex items-center gap-2 text-[12.5px] border rounded-xl px-3 py-2 transition text-left ${on ? 'border-[#641629] bg-[#641629] text-white' : 'bg-white border-[#641629]/15 hover:border-[#641629]/50'}`}>
                            <span className={`w-4 h-4 rounded-md border grid place-items-center shrink-0 ${on ? 'bg-white text-black border-white' : 'border-black/25'}`}>
                              {on && <Check size={12} />}
                            </span>
                            <span className="font-medium flex-1">{a.name}</span>
                            <b className="text-[12px]">+₹{(a.price ?? 0).toLocaleString('en-IN')}</b>
                          </button>
                          <button
                            onClick={() => { addToCart(p.id, 'One-size', '1day', undefined, { name: a.name, price: a.price ?? 0, img: itemImgFor(a.name, p.img) }, qty); }}
                            title="Rent only this item, without the dress"
                            className="shrink-0 text-[11px] font-bold border border-emerald-600 text-emerald-700 rounded-xl px-2.5 hover:bg-emerald-600 hover:text-white transition">
                            Only<br />this
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {!!paidAddons.length && (
                    <p className="text-[11px] text-[#6f5b6a] mt-2">{lookHint}</p>
                  )}
                </div>
              )}
              <div className="mt-4">
                <p className="label-pro">Rent or Buy — you choose</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button type="button" onClick={() => setMode('rent')}
                    className={`text-left border rounded-2xl p-3 transition ${!isBuy ? 'border-[#641629] bg-[#faf7ef] ring-2 ring-[#641629]/20' : 'border-black/10 bg-white hover:border-black/30'}`}>
                    <span className="flex items-center gap-1.5 text-[13px] font-bold">
                      <span className={`w-4 h-4 rounded-full border-2 grid place-items-center ${!isBuy ? 'border-[#641629]' : 'border-black/25'}`}>{!isBuy && <span className="w-2 h-2 rounded-full bg-[#641629]" />}</span>
                      Rent
                    </span>
                    <b className="block text-[15px] mt-1">₹{p.rent1.toLocaleString('en-IN')}</b>
                    <span className="block text-[11px] text-[#6f5b6a]">1-day · return after event</span>
                  </button>
                  <button type="button" onClick={() => setMode('buy')}
                    className={`text-left border rounded-2xl p-3 transition ${isBuy ? 'border-[#641629] bg-[#faf7ef] ring-2 ring-[#641629]/20' : 'border-black/10 bg-white hover:border-black/30'}`}>
                    <span className="flex items-center gap-1.5 text-[13px] font-bold">
                      <span className={`w-4 h-4 rounded-full border-2 grid place-items-center ${isBuy ? 'border-[#641629]' : 'border-black/25'}`}>{isBuy && <span className="w-2 h-2 rounded-full bg-[#641629]" />}</span>
                      Buy
                    </span>
                    <b className="block text-[15px] mt-1">₹{p.buy.toLocaleString('en-IN')}</b>
                    <span className="block text-[11px] text-[#6f5b6a]">Yours forever · no return</span>
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <p className="label-pro">Select size</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-11 px-3.5 py-2 rounded-xl text-[13px] font-bold border transition ${s === selSize ? 'bg-[#1a0f1e] text-white border-[#1a0f1e] shadow-[0_8px_18px_-10px_rgba(26,15,30,.6)]' : 'bg-white border-black/15 hover:border-black'}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              {!isBuy && (
              <div className="mt-3 rounded-2xl border border-[#c9a44a]/50 bg-[#fffdf9] p-3.5">
                <p className="label-pro">Check date availability</p>
                <input type="date" value={availDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => checkAvail(e.target.value)} className="input-pro !py-2 text-[13px] mt-2" />
                {avail?.checking && <p className="text-[12px] text-black/55 mt-2">Checking live bookings…</p>}
                {avail && !avail.checking && avail.qty === 0 && (
                  <p className="text-[12.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-2">✓ Available on {availDate} — book it before someone else does.</p>
                )}
                {avail && !avail.checking && avail.qty > 0 && (
                  <p className="text-[12.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
                    {avail.qty} already booked that day — <a href={waLink(`Hi TheKissa.co! Is ${p.name} (${p.id}) available on ${availDate}?`)} target="_blank" className="underline">ask us to confirm yours →</a>
                  </p>
                )}
              </div>
              )}
              <div className="flex items-baseline gap-2 mt-3"><b className="font-display text-[22px]">₹{(lineTotal * qty).toLocaleString('en-IN')}</b>{!isBuy && p.buy > p.rent1 && <><s className="text-[#8a7584] text-sm">₹{p.buy.toLocaleString('en-IN')}</s><span className="text-[11px] font-black text-white bg-emerald-600 rounded-full px-2 py-0.5">SAVE {Math.round((1 - p.rent1 / p.buy) * 100)}%</span></>}{isBuy && <span className="text-[11px] font-black text-white bg-[#641629] rounded-full px-2 py-0.5">BUY · NO RETURN</span>}</div>
              {!isBuy
                ? <p className="text-[11.5px] text-emerald-700 font-semibold mt-0.5">+ ₹{refundableExtra(p.rent1).toLocaleString('en-IN')} refundable extra (30% — you get it back)</p>
                : <p className="text-[11.5px] text-black/55 font-medium mt-0.5">One-time price · no deposit, no return needed</p>}
              <div className="flex items-center justify-between mt-4 border border-black/10 rounded-2xl px-3.5 py-2.5">
                <span className="text-[12.5px] font-bold">Quantity <span className="block text-[11px] font-normal text-black/50">How many dresses do you need?</span></span>
                <span className="flex items-center gap-2">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="w-9 h-9 grid place-items-center rounded-full border border-black/15 hover:bg-black hover:text-white transition disabled:opacity-30"><Minus size={15} /></button>
                  <b className="w-6 text-center text-[15px] tabular-nums">{qty}</b>
                  <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity" className="w-9 h-9 grid place-items-center rounded-full border border-black/15 hover:bg-black hover:text-white transition disabled:opacity-30"><Plus size={15} /></button>
                </span>
              </div>
              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 mt-3">
                <button onClick={addDress} disabled={soldOut} className="btn-primary !py-3 !text-[13px] disabled:opacity-40"><ShoppingBasket size={15} /> {soldOut ? 'Out of stock' : <>{isBuy ? 'Buy now' : 'Rent now'}{qty > 1 ? ` ${qty}` : ''}{pickedTotal ? ` +₹${pickedTotal.toLocaleString('en-IN')}` : ''}</>}</button>
                <button onClick={() => toggleWish(p.id)} className="btn-outline-dark !py-3 !text-[13px]"><Heart size={15} className={wishlist.includes(p.id) ? 'fill-[#641629] text-[#641629]' : ''} /> Wishlist</button>
              </div>
              {soldOut && <p className="text-[12px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mt-2 text-center">This outfit is currently out of stock. Please check back soon or ask on WhatsApp.</p>}
              <a href={waLink(`Hi TheKissa.co! I want to ${isBuy ? 'BUY' : 'RENT'} ${p.name} (${p.id}), size ${selSize} — ${isBuy ? `buy ₹${p.buy}` : '1-day rent'} available?`)} target="_blank" className="mt-2 w-full inline-flex items-center justify-center gap-1.5 border border-[#641629]/15 rounded-full py-3 text-[13px] font-semibold hover:border-[#641629] transition"><MessageCircle size={15} /> Ask on WhatsApp</a>
              <ProductReviews productId={p.id} productName={p.name} />
              <div className="grid grid-cols-3 gap-2 mt-5 text-[11px] font-medium text-[#6f5b6a] border-t border-[#641629]/8 pt-4">
                <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> Sanitised</span>
                <span className="flex items-center gap-1.5"><Truck size={13} className="text-emerald-600" /> Same-day</span>
                <span className="flex items-center gap-1.5"><BadgeCheck size={13} className="text-emerald-600" /> Quality checked</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProductReviews({ productId, productName }: { productId: string; productName: string }) {
  const [list, setList] = useState<Review[]>(() => getLocalReviews(productId));
  const [showForm, setShowForm] = useState(false);
  const [rName, setRName] = useState('');
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let on = true;
    setList(getLocalReviews(productId));
    (async () => {
      try {
        const cloud = await fetchApprovedReviews(productId);
        if (!on) return;
        const seen = new Set(cloud.map((r) => r.id));
        setList([...cloud, ...getLocalReviews(productId).filter((r) => !seen.has(r.id))].slice(0, 10));
      } catch { /* local list is fine */ }
    })();
    return () => { on = false; };
  }, [productId]);

  const pickPhoto = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setMsg('Please attach an image file (JPG/PNG).'); return; }
    if (f.size > 8 * 1024 * 1024) { setMsg('Photo is too large (max 8MB).'); return; }
    setMsg('');
    const small = await fileToCompressedDataUrl(f);
    if (!small) { setMsg('Could not read that photo — please try another.'); return; }
    setPhoto(small);
  };

  const submit = async () => {
    const err = validReview(rName, stars, text);
    if (err) { setMsg(err); return; }
    if (busy) return;
    setBusy(true);
    setMsg('');
    try {
      let url: string | undefined;
      if (photo && isSupabaseConfigured && supabase) {
        try {
          const blob = dataUrlToBlob(photo);
          if (blob) {
            const path = `reviews/${productId}-${Date.now()}.jpg`;
            const { error } = await supabase.storage.from('review-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
            if (!error) url = supabase.storage.from('review-photos').getPublicUrl(path).data.publicUrl || undefined;
          }
        } catch { /* local copy fallback below */ }
      }
      const mode = await submitReview({ productId, name: rName, rating: stars, text, photoUrl: url || (!isSupabaseConfigured ? photo || undefined : undefined) });
      setMsg(mode === 'cloud' ? 'Thanks! Your review will appear after store approval.' : 'Thanks! Your review is saved.');
      setRName(''); setStars(5); setText(''); setPhoto(null); setShowForm(false);
      setList(getLocalReviews(productId).length ? [...(await fetchApprovedReviews(productId)), ...getLocalReviews(productId)].slice(0, 10) : list);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-black/[.07] bg-[#fafafa] p-3.5">
      <div className="flex items-center gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] text-black"><Star size={13} className="fill-[#c9960a] text-[#c9960a]" /> CUSTOMER REVIEWS{list.length > 0 ? ` (${list.length})` : ''}</p>
        <button onClick={() => { setShowForm((v) => !v); setMsg(''); }} className="ml-auto text-[12px] font-bold text-[#641629] underline underline-offset-2">{showForm ? 'Close' : 'Write a review'}</button>
      </div>
      {list.length === 0 && !showForm && <p className="text-[12px] text-black/50 mt-1.5">No reviews yet — be the first to share your look.</p>}
      {list.length > 0 && (
        <div className="mt-2 space-y-2">
          {list.slice(0, 3).map((r) => (
            <div key={r.id} className="bg-white border border-black/[.07] rounded-xl p-2.5">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={11} className={i <= r.rating ? 'fill-[#c9960a] text-[#c9960a]' : 'text-black/20'} />
                ))}
                <b className="text-[12px] ml-1">{r.name}</b>
              </div>
              <p className="text-[12.5px] text-neutral-600 mt-1 leading-relaxed">{r.text}</p>
              {r.photo && <a href={r.photo} target="_blank"><img src={r.photo} alt={`${r.name}'s Garba look in ${productName}`} loading="lazy" className="mt-1.5 w-20 h-20 object-contain rounded-xl border hover:opacity-90 transition" /></a>}
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <div className="mt-2.5 space-y-2 bg-white border border-black/[.07] rounded-xl p-3">
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-bold mr-1">Rating:</span>
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onClick={() => setStars(i)} aria-label={`${i} star`} className="p-0.5">
                <Star size={18} className={i <= stars ? 'fill-[#c9960a] text-[#c9960a]' : 'text-black/20 hover:text-black/40'} />
              </button>
            ))}
          </div>
          <input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Your name" maxLength={60} className="w-full border border-black/15 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-black" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="How was the fit, look, delivery?" rows={2} maxLength={500} className="w-full border border-black/15 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-black resize-none" />
          <label className="block text-[12px] font-bold">Your Garba look photo (optional)
            <input type="file" accept="image/*" onChange={(e) => pickPhoto(e.target.files?.[0])} className="mt-1 w-full text-[13px] file:mr-2 file:rounded-full file:border file:border-black/15 file:bg-black file:text-white file:text-[12px] file:font-bold file:px-3 file:py-1.5" />
          </label>
          {photo && <img src={photo} alt="Review photo preview" className="w-20 h-20 object-contain rounded-xl border" />}
          {msg && <p className="text-[12px] bg-[#faf7ef] border border-[#c9a44a]/40 rounded-xl px-3 py-2">{msg}</p>}
          <button onClick={submit} disabled={busy} className="btn-primary w-full !py-2.5 !text-[13px] disabled:opacity-50">{busy ? 'Submitting…' : 'Submit review'}</button>
        </div>
      )}
      {!showForm && msg && <p className="text-[12px] bg-[#faf7ef] border border-[#c9a44a]/40 rounded-xl px-3 py-2 mt-2">{msg}</p>}
    </div>
  );
}

export function CartDrawer() {
  const { products } = useProducts();
  useSiteVersion();
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const remove = useStore((s) => s.removeFromCart);
  const setQty = useStore((s) => s.setQty);
  const clear = useStore((s) => s.clearCart);
  const eventDate = useStore((s) => s.eventDate);
  const setEventDate = useStore((s) => s.setEventDate);

  const [step, setStep] = useState<'cart' | 'details' | 'qr' | 'done'>('cart');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [utr, setUtr] = useState('');
  // Payment screenshot — required along with UTR (compressed dataURL preview)
  const [shot, setShot] = useState<string | null>(null);
  const [shotBusy, setShotBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  // Honeypot bot-trap — humans never fill it (off-screen field)
  const [company, setCompany] = useState('');
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'list' | 'orders'>('list');
  const [orders, setOrders] = useState<MyOrder[]>([]);
  // To restore orders from another phone/browser (mobile number / Order ID)
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMsg, setLookupMsg] = useState('');
  const [order, setOrder] = useState<{ id: string; paymentId: string; mode: string; token: number; total: number; deposit: number; lines: string[]; items: MyOrder['items'] } | null>(null);
  const [payChoice, setPayChoice] = useState<'half' | 'full'>('full');
  const [promo, setPromo] = useState('');
  // Full-view (lightbox) for order photos in the booking list
  const [viewPhoto, setViewPhoto] = useState<{ src: string; name: string } | null>(null);
  // Older orders did not save img — find a fallback photo from the catalog (pid → name → id in detail)
  const orderImgFor = (it: MyOrderItem): string | undefined => {
    if (it.img) return it.img;
    try {
      if (it.pid) {
        const byId = products.find((p) => p.id === it.pid);
        if (byId?.img) return byId.img;
      }
      const byName = products.find((p) => p.name === it.name);
      if (byName?.img) return byName.img;
      const idInDetail = products.find((p) => it.detail && it.detail.includes(p.id));
      if (idInDetail?.img) return idInDetail.img;
    } catch { /* ignore */ }
    return undefined;
  };
  const wasOpen = useRef(false);
  const resetAndClose = () => {
    setViewPhoto(null);
    setOpen(false);
    setTimeout(() => { setStep('cart'); setOrder(null); setErr(''); setUtr(''); setShot(null); setPayChoice('full'); setPromo(''); setName(''); setPhone(''); setEmail(''); setAddress(''); setLookupMsg(''); }, 400);
  };

  // Compress screenshot immediately on pick (photos up to 8MB are OK)
  const onShot = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErr('Please attach an image file (JPG/PNG) of your payment.'); return; }
    if (f.size > 8 * 1024 * 1024) { setErr('Screenshot is too large (max 8MB) — take a smaller photo.'); return; }
    setErr('');
    setShotBusy(true);
    try {
      const small = await fileToCompressedDataUrl(f);
      if (!small) { setErr('Could not read that image — please try another screenshot.'); return; }
      setShot(small);
    } finally {
      setShotBusy(false);
    }
  };
  // If the drawer opens with an empty list but orders exist — show My Orders directly (so the user doesn't have to hunt for View order)
  useEffect(() => {
    if (open && !wasOpen.current) {
      try {
        setStep('cart');
        if (cart.length === 0 && getMyOrders().length > 0) setTab('orders');
      } catch { /* ignore */ }
    }
    wasOpen.current = open;
  }, [open, cart.length]);
  // Open the orders tab directly from the Navbar "My Orders" button
  useEffect(() => {
    const openOrders = () => {
      setStep('cart');
      setTab('orders');
      setOpen(true);
    };
    window.addEventListener(OPEN_ORDERS_EVENT, openOrders);
    return () => window.removeEventListener(OPEN_ORDERS_EVENT, openOrders);
  }, [setOpen]);

  const rowPrice = (r: { p: { rent1: number; buy: number; category: Category; desc: string; accessories?: Accessory[] }; plan: '1day' | 'buy'; addons?: string[]; single?: { price: number } }) =>
    r.single ? r.single.price : ((r.plan === 'buy' ? r.p.buy : r.p.rent1) + addonTotal(r.p, r.addons));

  // Lock the background page when the drawer is open + close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (viewPhoto) setViewPhoto(null); else resetAndClose(); } };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, viewPhoto]);

  useEffect(() => {
    const refreshOrders = () => {
      const list = getMyOrders();
      // If the admin gave a decision / ready date, pull it from the booking record (shows instantly on the same device)
      // Downgrade guard: never revert a confirmed/onway/delivered/returned/cancelled order
      // back to 'new' (old booking record).
      try {
        const byId = new Map(getLocalBookings().map((b) => [b.order_id, b]));
        list.forEach((o) => {
          const b = byId.get(o.id);
          if (!b) return;
          if (b.ready_date) (o as MyOrder).readyDate = b.ready_date;
          if (b.status) {
            const incoming = String(b.status);
            const prev = String(o.status || '');
            // 'new' must never overwrite confirmed/delivered/returned/cancelled
            if (!(incoming === 'new' && prev && prev !== 'new')) {
              (o as MyOrder).status = b.status;
            }
          }
          if (b.admin_note) (o as MyOrder).note = b.admin_note;
          if ((b as any).payment_status) (o as MyOrder).payStatus = (b as any).payment_status;
          // If the old snapshot lacks a photo, attach the one from the booking record
          try {
            const bItems: any[] = Array.isArray((b as any).items) ? (b as any).items : [];
            if (bItems.length === o.items.length) {
              o.items.forEach((it, i) => {
                if (!it.img) {
                  const src = bItems[i]?.img || bItems[i]?.single?.img;
                  if (src) it.img = String(src);
                }
                if (!it.pid) {
                  const pid = bItems[i]?.id || bItems[i]?.pid;
                  if (pid) it.pid = String(pid);
                }
              });
            }
          } catch { /* ignore */ }
        });
      } catch { /* ignore */ }
      setOrders(list);
    };
    refreshOrders();
    const unsub = subscribeMyOrders(refreshOrders);
    return unsub;
  }, []);

  // Fetch the latest status from the cloud (so the customer sees an admin cancel/confirm).
  // Silent sync once on drawer open + on the My Orders tab — on top of the same-device local merge.
  // A new status replaces the OLD one (cancel after confirm → only cancel is shown).
  const syncing = useRef(false);
  const [syncingUi, setSyncingUi] = useState(false);
  const syncCloudStatuses = async (silent = true): Promise<number> => {
    if (syncing.current) return 0;
    const mine = getMyOrders();
    if (!mine.length) return 0;
    const before = new Map(mine.map((o) => [o.id, `${o.status || ''}|${o.note || ''}|${o.readyDate || ''}|${(o as MyOrder).payStatus || ''}`]));
    syncing.current = true;
    if (!silent) setSyncingUi(true);
    try {
      await Promise.allSettled(mine.slice(0, 20).map((o) => fetchOrderById(o.id, { refresh: true })));
    } catch { /* if offline, the local copy is fine */ }
    syncing.current = false;
    if (!silent) setSyncingUi(false);
    let changed = 0;
    try {
      for (const o of getMyOrders()) {
        const prev = before.get(o.id);
        const now = `${o.status || ''}|${o.note || ''}|${o.readyDate || ''}|${(o as MyOrder).payStatus || ''}`;
        if (prev !== undefined && prev !== now) changed++;
      }
    } catch { /* ignore */ }
    return changed;
  };
  const refreshStatuses = async () => {
    const n = await syncCloudStatuses(false);
    if (n > 0) setLookupMsg(`✓ ${n} order${n === 1 ? '' : 's'} updated — latest status is shown below.`);
    else if (isSupabaseConfigured && cloudLookupDiag() === 'missing') setLookupMsg('Store sync setup is pending (one-time) — ask the store to enable it, then try again.');
    else setLookupMsg('✓ Already up to date — no new update from the store.');
    setTab('orders');
  };
  // Fetch the admin decision (confirm/onway/delivered/returned/cancelled/note/ready-date)
  // instantly — all orders in one lightweight phone-RPC call. Returns the changed orders.
  const fastSyncPhones = async (): Promise<MyOrder[]> => {
    try {
      const mine = getMyOrders();
      if (!mine.length) return [];
      const before = new Map(mine.map((o) => [o.id, `${o.status || ''}|${o.note || ''}|${o.readyDate || ''}|${o.payStatus || ''}`]));
      const phones = [...new Set(mine.map((o) => String(o.phone || '').replace(/\D/g, '').slice(-10)).filter((d) => d.length >= 10))].slice(0, 3);
      if (phones.length) {
        await Promise.allSettled(phones.map((p) => fetchOrdersByPhone(p)));
      } else {
        await syncCloudStatuses(true);
      }
      return getMyOrders().filter((o) => {
        const p = before.get(o.id);
        return p !== undefined && p !== `${o.status || ''}|${o.note || ''}|${o.readyDate || ''}|${o.payStatus || ''}`;
      });
    } catch { return []; }
  };
  useEffect(() => {
    if (open) {
      try {
        if (getMyOrders().length > 0) { syncCloudStatuses(true); fastSyncPhones(); }
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  // Fast live status — as soon as the admin panel changes (max ~10s), the customer gets a
  // PARTICULAR status + toast in My Orders. One lightweight call per tick (all orders by
  // phone at once), only when the tab is visible. The same browser already updates
  // same-second via events.
  const pushToast = useStore((s) => s.pushToast);
  useEffect(() => {
    let stop = false;
    const statusText = (s?: string) =>
      s === 'confirmed' ? 'Confirmed ✓'
      : s === 'onway' ? 'On the way 🚚 — arriving soon'
      : s === 'delivered' ? 'Delivered ✓ — enjoy!'
      : s === 'returned' ? 'Returned ✓'
      : s === 'cancelled' ? 'Cancelled — tap My Orders' : 'Order update — tap My Orders';
    const fastTick = async () => {
      try {
        if (stop || document.visibilityState === 'hidden') return;
        if (!getMyOrders().length) return;
        const changed = await fastSyncPhones();
        if (changed.length && !stop) {
          changed.slice(0, 2).forEach((o) => pushToast(`Order ${o.id}: ${statusText(o.status)}`));
        }
      } catch { /* if offline, retry on the next tick */ }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') fastTick();
    };
    fastTick();
    const t = setInterval(fastTick, 10000);
    window.addEventListener('focus', fastTick);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stop = true;
      clearInterval(t);
      window.removeEventListener('focus', fastTick);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => cart.map((c) => ({ ...c, p: products.find((x) => x.id === c.id)! })).filter((r) => r.p), [cart, products]);
  const subtotal = rows.reduce((a, r) => a + rowPrice(r) * r.qty, 0);
  // Deposit sirf rent par — buy + single accessory par zero
  const deposit = rows.reduce((a, r) => a + (r.single || r.plan === 'buy' ? 0 : refundableExtra(rowPrice(r) * r.qty)), 0);
  const hasBuy = rows.some((r) => !r.single && r.plan === 'buy');
  const hasRent = rows.some((r) => !r.single && r.plan !== 'buy');
  const disc = promo.trim() ? promoDiscount(subtotal, promo) : 0;
  const total = subtotal - disc;
  const half = halfAdvance(total);
  // Buy ho to sirf full payment — half sirf rent ke liye
  const effectivePayChoice = hasBuy ? 'full' as const : payChoice;
  // Full = rent + 30% extra together (nothing on delivery, extra returned later).
  // Half = 50% rent now, remaining rent + 30% extra on delivery.
  // Buy items hon to half band — sirf full.
  const payAmount = effectivePayChoice === 'full' ? total + deposit : half;
  const rentBalance = effectivePayChoice === 'full' ? 0 : total - half;
  const extraDue = effectivePayChoice === 'full' ? 0 : deposit;

  // Restore orders after another phone / cache-clear (via the same mobile number or Order ID)
  const runLookupByPhone = async () => {
    const digits = lookupPhone.replace(/\D/g, '').slice(-10);
    if (digits.length < 10) { setLookupMsg('Please enter your 10-digit mobile number.'); return; }
    setLookupBusy(true);
    setLookupMsg('');
    try {
      const { orders: found } = await fetchOrdersByPhone(digits);
      if (found.length) {
        setLookupMsg(`✓ ${found.length} order${found.length === 1 ? '' : 's'} found — shown below.`);
        setTab('orders');
      } else {
        setLookupMsg('No order found for this number on this device yet. Check the mobile number used for the order, or try the Order ID.');
      }
    } catch {
      setLookupMsg('Could not search right now — please try again.');
    } finally {
      setLookupBusy(false);
    }
  };

  const runLookupById = async () => {
    const needle = lookupId.trim().toUpperCase();
    if (!needle) { setLookupMsg('Please enter your Order ID (e.g. RL-2026-1234).'); return; }
    setLookupBusy(true);
    setLookupMsg('');
    try {
      const found = await fetchOrderById(needle);
      if (found) {
        setLookupMsg(`✓ Order ${found.id} found — shown below.`);
        setTab('orders');
      } else {
        setLookupMsg('Order ID not found on this device. Check the spelling (e.g. RL-2026-1234).');
      }
    } catch {
      setLookupMsg('Could not search right now — please try again.');
    } finally {
      setLookupBusy(false);
    }
  };

  // Designer invoice PDF — store details for the bill footer (PDF lib lazy-loads: the site won't slow down)
  const invoiceOpts = () => ({ brand: STORE.brand, phone: STORE.phoneDisplay, email: STORE.email, address: STORE.addressLong });
  const downloadDoneInvoice = async () => {
    if (!order) return;
    const { downloadInvoicePDF } = await import('../lib/invoice');
    downloadInvoicePDF({
      id: order.id,
      date: new Date().toISOString(),
      name: name.trim() || 'Customer',
      phone: phone.trim(),
      event: eventDate || 'TBD',
      items: order.items,
      total: order.total,
      deposit: order.deposit,
      token: order.token,
      mode: order.mode,
    }, { ...invoiceOpts(), paymentId: order.paymentId || undefined });
  };

  const validateDetails = () => {
    if (name.trim().length < 3) return 'Please enter your full name';
    if (!isValidIndianPhone(phone)) return 'Please enter a valid 10-digit mobile number';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address';
    if (!eventDate) return 'Please select the event date';
    if (eventDate < new Date().toISOString().slice(0, 10)) return 'Please choose today or a future event date';
    if (!rows.length) return 'Your list is empty';
    return '';
  };

  const rowLabel = (r: { plan: '1day' | 'buy'; size: string; qty: number; addons?: string[] }) => {
    const base = r.plan === 'buy' ? `Buy · ${r.size} x${r.qty}` : `1-day · ${r.size} x${r.qty}`;
    return r.addons?.length ? `${base} + ${r.addons.join(', ')}` : base;
  };

  // The order always stays on the website — My Orders snapshot.
  // MANUAL CONFIRM: status 'new' = payment sent, admin confirmation pending.
  // The admin confirms after seeing a genuine payment, and cancels fake-UTR ones.
  const snapOrder = (orderId: string, token: number, mode: string, proof?: string) => saveMyOrder({
    id: orderId,
    date: new Date().toISOString(),
    name: name.trim(),
    phone: phone.trim(),
    event: eventDate || 'TBD',
    items: rows.map((r) => ({
      name: r.single ? r.single.name : r.p.name,
      detail: r.single ? `${r.p.id} look · without dress` : rowLabel(r),
      qty: r.qty,
      price: rowPrice(r) * r.qty,
      img: r.single?.img ?? r.p.img,
      pid: r.p.id,
    })),
    total,
    deposit,
    token,
    mode,
    status: 'new',
    proof,
  });

  const buildCustomerMsg = (o: { id: string; total: number; deposit: number; token: number; mode: string }) =>
    `Your order has been placed successfully!\n\nOrder ID: ${o.id}\nName: ${name}\nEvent: ${eventDate || 'TBD'}\nTotal${hasRent ? ' rent' : ''}${hasBuy && hasRent ? ' + buy' : hasBuy ? ' (buy)' : ''}: ${formatINR(o.total)}\nPaid now: ${formatINR(o.token)}${o.mode === 'upi-qr-full' ? (o.deposit > 0 ? ' (rent + 30% extra — nothing due on delivery)' : ' (full payment — nothing due on delivery)') : ''}${o.deposit > 0 ? `\nRefundable extra 30%: ${formatINR(o.deposit)} — you will get this back when you return the outfit.` : ''}\n\nThank you for shopping with TheKissa.co! Delivery updates will be shared with you on WhatsApp/SMS.`;

  const orderLines = () => rows.map((r, i) => r.single
    ? `${i + 1}. ${r.single.name} (accessory only — ${r.p.id} look) x${r.qty} = ${formatINR(r.single.price * r.qty)}`
    : `${i + 1}. ${r.p.name} (${r.p.id}) — ${rowLabel(r)} = ${formatINR(rowPrice(r) * r.qty)}`);

  // Store notification — ALWAYS goes to the client's number/email.
  // Earning (rent+buy) vs refundable deposit vs total collection — on three separate lines,
  // so the store sees at a glance how much to keep and how much to return.
  // The order is 'new' — the admin confirms/cancels after checking the UTR + screenshot.
  const buildStoreMsg = (o: { id: string; mode: string; token: number; total: number; deposit: number; lines: string[]; paymentId: string }) =>
    `New order ${o.id} — TheKissa.co\n\n${(o.lines.length ? o.lines : ['(full item list in Admin → Bookings)']).join('\n')}\n\nName: ${name}\nMobile: ${phone}\nEvent: ${eventDate || 'TBD'}\n\nTotal (your earning): ${formatINR(o.total)}\n${o.mode === 'upi-qr-full' ? `Payment: Full ${formatINR(o.token)}${o.deposit > 0 ? ' (rent + 30% extra)' : ''} received via QR (UTR ${o.paymentId}) — VERIFY in Reports → Payments, then confirm` : o.mode === 'upi-qr-half' ? `Payment: Half ${formatINR(o.token)} received via QR (UTR ${o.paymentId}), balance ${formatINR(o.total - o.token)} + 30% extra ${formatINR(o.deposit)} on delivery — VERIFY in Reports → Payments, then confirm` : `Payment: Token ${formatINR(o.token)} received via QR (UTR ${o.paymentId}) — VERIFY in Reports → Payments, then confirm`}${o.deposit > 0 ? `\nRefundable extra 30%: ${formatINR(o.deposit)}${o.mode === 'upi-qr-full' ? ' (already received — return on outfit return)' : ' — collect on delivery, return on outfit return'}` : '\nNo deposit — buy order, no return needed.'}\nTotal collection: ${formatINR(o.total + o.deposit)} (${formatINR(o.token)} received + ${formatINR(Math.max(0, o.total - o.token + (o.mode === 'upi-qr-full' ? 0 : o.deposit)))} on delivery)`;

  const goQr = () => {
    const v = validateDetails();
    if (v) { setErr(v); return; }
    setErr('');
    const amt = effectivePayChoice === 'full' ? total + deposit : half;
    if (amt < 1) {
      setErr('Amount is below ₹1 — please contact store on WhatsApp.');
      return;
    }
    setStep('qr');
  };

  const upiId = merchantUpi();
  const upiLink = upiId && isValidVpa(upiId) ? upiUrl(upiId, getSiteContent().store.brand || 'TheKissa.co', payAmount, `Order ${effectivePayChoice === 'full' ? 'full payment' : 'half payment'} ${name.trim()}`) : '';

  const copyUpi = async () => {
    try { await navigator.clipboard.writeText(upiId); } catch {
      const t = document.createElement('textarea');
      t.value = upiId;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmQrPaid = async () => {
    if (paying) return;
    // No order is saved without payment — both UTR + screenshot are compulsory.
    // The order is saved as 'new' (pending) — the admin confirms or cancels after checking the UTR/screenshot.
    if (!/^\d{12}$/.test(utr.trim())) { setErr('Please enter the 12-digit UTR from your UPI app after payment — it is required.'); return; }
    if (looksFakeUtr(utr.trim())) { setErr('This UTR looks invalid (repeated or sequential digits). Please copy the exact 12-digit UTR from your UPI app.'); return; }
    if (!shot) { setErr('Please attach your payment screenshot — it is required to place the order.'); return; }
    setErr('');
    // One UTR per order only — reuse is blocked instantly (genuine check, fail-open).
    // No limit on order count — every paid order is saved as 'new'; the admin confirms/cancels.
    try {
      if (await isUtrUsed(utr.trim())) { setErr('This UTR has already been used for another order. Please check the number in your UPI app.'); return; }
    } catch { /* guard fail ho to order mat roko */ }
    setPaying(true);
    const amt = effectivePayChoice === 'full' ? total + deposit : half;
    const mode = effectivePayChoice === 'full' ? 'upi-qr-full' : 'upi-qr-half';
    try {
      let orderId = makeOrderId();
      try {
        const taken = new Set([...getMyOrders().map((o) => o.id), ...getLocalBookings().map((b) => b.order_id)]);
        let guard = 0;
        while (taken.has(orderId) && guard++ < 5) orderId = makeOrderId();
      } catch { /* ignore */ }
      const ref = utr.trim();
      // Screenshot: cloud ho to storage me upload (public URL), warna compressed copy local
      let proof: string | null = shot;
      try {
        if (isSupabaseConfigured && supabase && shot) {
          const blob = dataUrlToBlob(shot);
          if (blob) {
            const path = `proofs/${orderId}-${Date.now()}.jpg`;
            const { error: upErr } = await supabase.storage.from('payment-proofs').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
            if (!upErr) {
              const { data } = supabase.storage.from('payment-proofs').getPublicUrl(path);
              if (data?.publicUrl) proof = data.publicUrl;
            }
          }
        }
      } catch { /* upload fail ho to compressed copy hi save hogi */ }
      await saveBooking({
        order_id: orderId,
        name: name.trim(),
        phone: phone.trim(),
        category: 'cart',
        size: '',
        event_date: eventDate || null,
        plan: 'cart',
        honeypot: company,
        address: address.trim() || null,
        note: rows.map((r2) => r2.single ? `${r2.p.id} SINGLE:${r2.single.name} x${r2.qty}` : `${r2.p.id} ${r2.size} ${r2.plan} x${r2.qty}${r2.addons?.length ? ` +${r2.addons.join('+')}` : ''}`).join(' | ').slice(0, 500),
        items: rows.map((r2) => ({ id: r2.p.id, pid: r2.p.id, name: r2.single ? `${r2.single.name} (accessory only)` : r2.p.name, size: r2.size, plan: r2.plan, qty: r2.qty, addons: r2.addons ?? [], single: r2.single ?? null, img: r2.single?.img ?? r2.p.img })),
        subtotal,
        total,
        token_amount: amt,
        deposit,
        deposit_status: 'pending',
        payment_mode: mode,
        payment_id: ref,
        payment_status: 'unverified',
        payment_proof: proof,
        promo_code: promo.trim() ? promo.trim().toUpperCase() : null,
      });
      setOrder({ id: orderId, paymentId: ref, mode, token: amt, total, deposit, lines: orderLines(), items: rows.map((r) => ({ name: r.single ? r.single.name : r.p.name, detail: r.single ? `${r.p.id} look · without dress` : rowLabel(r), qty: r.qty, price: rowPrice(r) * r.qty, img: r.single?.img ?? r.p.img, pid: r.p.id })) });
      setStep('done');
      snapOrder(orderId, amt, mode, proof || undefined);
      clear();
      // QR payment par bhi store ko WhatsApp notice (block ho to done-step buttons se resend)
      try {
        window.open(waLink(buildStoreMsg({ id: orderId, paymentId: ref, mode, token: amt, total, deposit, lines: orderLines() })), '_blank');
      } catch { /* popup blocked — resend buttons below */ }
    } catch (e: any) {
      setErr(e?.message || 'Could not confirm order');
    } finally {
      setPaying(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetAndClose} />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[#fffdf9] flex flex-col ring-1 ring-[#c9a44a]/30">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#c9a44a]/25 bg-gradient-to-b from-[#fbf3df] to-[#fffdf9]">
              <div>
                <h3 className="font-semibold text-[17px] tracking-tight">Booking {step === 'cart' ? `(${cart.reduce((a, c) => a + c.qty, 0)})` : step === 'details' ? '— Details' : step === 'qr' ? '— QR Payment' : '— Confirmed'}</h3>
                <p className="text-[11px] text-black/50 mt-0.5">Step {step === 'cart' ? '1/3 List' : step === 'details' ? '2/3 Details' : step === 'qr' ? '3/3 QR Payment' : '3/3 Invoice'} · 100% Secure checkout</p>
              </div>
              <button onClick={resetAndClose} aria-label="Close" className="w-10 h-10 grid place-items-center rounded-full bg-black/5 hover:bg-[#641629] hover:text-white transition"><X size={16} /></button>
            </div>
            {step === 'cart' && (
              <div className="flex gap-1.5 px-4 pt-3">
                <button onClick={() => setTab('list')} className={`flex-1 rounded-full py-2 text-[12.5px] font-bold transition ${tab === 'list' ? 'bg-gradient-to-b from-[#2b141b] to-[#1c0d12] text-[#f7ead0] ring-1 ring-[#c9a44a]/40' : 'bg-black/5 text-black/60'}`}>Booking list ({cart.reduce((a, c) => a + c.qty, 0)})</button>
                <button onClick={() => setTab('orders')} className={`flex-1 rounded-full py-2 text-[12.5px] font-bold transition ${tab === 'orders' ? 'bg-gradient-to-b from-[#2b141b] to-[#1c0d12] text-[#f7ead0] ring-1 ring-[#c9a44a]/40' : 'bg-black/5 text-black/60'}`}>My Orders ({orders.length})</button>
              </div>
            )}

            {step === 'done' && order ? (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="text-center py-2">
                  <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
                  <h4 className="font-semibold text-xl mt-3">Payment sent successfully!</h4>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">⏳ Waiting for store confirmation</p>
                  <p className="text-[12.5px] text-black/55 mt-2">The store will check your UTR + screenshot and confirm your order. You will see it in My Orders.</p>
                  <p className="text-sm text-black/55 mt-2">Order ID: <b className="text-black">{order.id}</b></p>
                </div>
                <div className="mt-4 border border-black/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-[#641629] text-white flex items-center gap-2 text-sm font-semibold"><ReceiptText size={15} /> Invoice</div>
                  <div className="p-4 text-sm space-y-1.5">
                    <div className="flex justify-between gap-3"><span className="text-black/55 shrink-0">Order ID</span><b className="text-right break-words min-w-0">{order.id}</b></div>
                    <div className="flex justify-between gap-3"><span className="text-black/55 shrink-0">Name</span><b className="text-right break-words min-w-0">{name}</b></div>
                    {address.trim() && <div className="flex justify-between gap-3"><span className="text-black/55 shrink-0">Delivery</span><b className="text-[12.5px] text-right break-words min-w-0">{address.trim()}</b></div>}
                    <div className="flex justify-between gap-3"><span className="text-black/55 shrink-0">Payment</span><b className="text-right break-words min-w-0">{order.mode === 'upi-qr-full' ? `Full claimed via QR ${formatINR(order.token)}${order.deposit > 0 ? ' (rent + 30% extra)' : ''} · verification pending` : order.mode === 'upi-qr-half' ? `Half claimed via QR ${formatINR(order.token)} · Balance ${formatINR(order.total - order.token)} + 30% extra ${formatINR(order.deposit)} on delivery · verification pending` : order.mode === 'upi-qr' ? `Token claimed via QR ${formatINR(order.token)} · verification pending` : 'Pay on delivery'}</b></div>
                    {order.paymentId && <div className="flex justify-between gap-3"><span className="text-black/55 shrink-0">Txn ID</span><b className="text-[12px] text-right break-all">{order.paymentId}</b></div>}
                    <div className="border-t border-black/10 my-2 pt-2 flex justify-between"><span>Total</span><b>{formatINR(order.total)}</b></div>
                    {order.deposit > 0
                      ? <><div className="flex justify-between text-[13px] text-emerald-700 font-semibold"><span>Refundable extra 30% (you get back on return)</span><b>{formatINR(order.deposit)}</b></div>
                    <p className="text-[11px] text-black/50 pt-1">You will get {formatINR(order.deposit)} back via UPI/cash within 24h of return.</p></>
                      : <p className="text-[11px] text-black/50 pt-1">Buy order — no deposit, no return needed.</p>}
                  </div>
                </div>
                <p className="text-[12px] font-bold mt-4 text-center">Send this order to the store:</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <a href={waLink(buildStoreMsg(order))} target="_blank" className="bg-[#25d366] text-white font-semibold rounded-full py-3 text-sm flex items-center justify-center gap-1.5"><MessageCircle size={15} /> WhatsApp</a>
                  <a href={`mailto:${STORE.email}?subject=${encodeURIComponent(`New order ${order.id} — TheKissa.co`)}&body=${encodeURIComponent(buildStoreMsg(order))}`} className="bg-[#641629] text-white font-semibold rounded-full py-3 text-sm flex items-center justify-center gap-1.5"><Mail size={15} /> Email</a>
                </div>
                <p className="text-[12px] font-bold mt-4 text-center">Get confirmation on your email:</p>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" inputMode="email" className="mt-2 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-black" />
                {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
                  ? <a href={`mailto:${email.trim()}?subject=${encodeURIComponent(`Order confirmed ${order.id} — TheKissa.co`)}&body=${encodeURIComponent(buildCustomerMsg(order))}`} className="mt-2 w-full bg-black text-white font-semibold rounded-full py-3 text-sm flex items-center justify-center gap-1.5"><Mail size={15} /> Send me confirmation</a>
                  : <span className="mt-2 w-full bg-black/[.06] text-black/40 font-semibold rounded-full py-3 text-sm flex items-center justify-center gap-1.5"><Mail size={15} /> Enter email above</span>}
                <p className="text-[12px] font-bold mt-4 text-center">Designer bill for your records:</p>
                <button onClick={downloadDoneInvoice} className="btn-gold w-full mt-2 !py-3 !text-sm"><Download size={15} /> Download Invoice (PDF)</button>
                <button onClick={resetAndClose} className="w-full mt-3 bg-[#641629] text-white font-semibold rounded-full py-3 text-sm">Continue shopping</button>
                <button onClick={() => { setStep('cart'); setTab('orders'); }} className="w-full mt-2 border border-black/15 font-semibold rounded-full py-3 text-sm hover:bg-black hover:text-white transition">View in My Orders</button>
                <a href="/track" className="w-full mt-2 border border-black/15 font-semibold rounded-full py-3 text-sm hover:bg-[#641629] hover:border-[#641629] hover:text-white transition flex items-center justify-center gap-2">📍 Track delivery boy</a>
                <p className="text-[11px] text-black/45 text-center mt-2">You will get the tracking link on SMS/WhatsApp after dispatch</p>
              </div>
            ) : step === 'details' ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <button onClick={() => setStep('cart')} className="text-xs font-semibold text-black/55 hover:text-black">← Back to list</button>
                <div className="grid gap-3">
                  <label className="text-xs font-bold">FULL NAME *<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" className="mt-1.5 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal outline-none focus:border-black" /></label>
                  <label className="text-xs font-bold">MOBILE *<input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" className="mt-1.5 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal outline-none focus:border-black" /></label>
                  <label className="text-xs font-bold">EMAIL (for order confirmation)<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" inputMode="email" className="mt-1.5 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal outline-none focus:border-black" /></label>
                  <label aria-hidden className="hp-trap">COMPANY<input value={company} onChange={(e) => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" className="mt-1.5 w-full border rounded-xl px-3.5 py-2.5 text-sm" /></label>
                  <label className="text-xs font-bold">EVENT DATE *<input type="date" value={eventDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setEventDate(e.target.value)} className="mt-1.5 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal" /></label>
                  <label className="text-xs font-bold">DELIVERY ADDRESS (for doorstep delivery)<textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, street, area, city" rows={2} className="mt-1.5 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal outline-none focus:border-black resize-none" /></label>
                </div>
                <div className="bg-[#fafafa] border border-black/10 rounded-2xl p-4 text-sm space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><b>{formatINR(subtotal)}</b></div>
                  {disc > 0 && <div className="flex justify-between text-emerald-700 font-semibold"><span>Promo {promo.trim().toUpperCase()}</span><b>−{formatINR(disc)}</b></div>}
                  <div className="flex gap-2 pt-1">
                    <input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="Promo code (e.g. NAVRATRI20)" className="flex-1 min-w-0 border border-black/15 rounded-xl px-3 py-2 text-[13px] font-semibold tracking-wide outline-none focus:border-black uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal" maxLength={20} />
                  </div>
                  {promo.trim() && disc <= 0 && <p className="text-[11.5px] text-rose-700 font-medium">This code is not valid for this order.</p>}
                  <div className="flex justify-between text-[15px]"><span>Total{hasBuy && hasRent ? ' (rent + buy)' : hasBuy ? ' (buy)' : ' rent'}</span><b>{formatINR(total)}</b></div>
                  {deposit > 0
                    ? <><div className="flex justify-between text-[13px] text-emerald-700 font-semibold"><span>Refundable extra 30% (you get back on return)</span><b>{formatINR(deposit)}</b></div>
                  <p className="text-[11px] text-black/50">You will get {formatINR(deposit)} back via UPI/cash within 24h of return · QR scan & pay via any UPI app</p></>
                    : <p className="text-[11px] text-black/50">Buy order — no deposit, no return needed · QR scan & pay via any UPI app</p>}
                </div>
                <p className="text-xs font-bold">PAYMENT OPTION *</p>
                <div className="grid gap-2">
                  <button type="button" onClick={() => setPayChoice('full')} className={`text-left border rounded-2xl p-3.5 text-sm transition ${effectivePayChoice === 'full' ? 'border-[#641629] bg-[#faf7ef] ring-2 ring-[#641629]/20' : 'border-black/10 bg-white hover:border-black/30'}`}>
                    <span className="flex items-center gap-2 font-bold"><span className={`w-4 h-4 rounded-full border-2 grid place-items-center ${effectivePayChoice === 'full' ? 'border-[#641629]' : 'border-black/25'}`}>{effectivePayChoice === 'full' && <span className="w-2 h-2 rounded-full bg-[#641629]" />}</span> Full payment <span className="ml-auto text-[10px] font-bold bg-emerald-600 text-white rounded-full px-2 py-0.5">RECOMMENDED</span></span>
                    <span className="block text-[12.5px] mt-1">Pay now <b>{formatINR(total + deposit)}</b>{deposit > 0 ? ' (rent + 30% extra)' : ' (full amount)'} · Nothing due on delivery{deposit > 0 ? <> · <b>{formatINR(deposit)}</b> back on return</> : ''}</span>
                  </button>
                  {!hasBuy && (
                  <button type="button" onClick={() => setPayChoice('half')} className={`text-left border rounded-2xl p-3.5 text-sm transition ${payChoice === 'half' ? 'border-[#641629] bg-[#faf7ef] ring-2 ring-[#641629]/20' : 'border-black/10 bg-white hover:border-black/30'}`}>
                    <span className="flex items-center gap-2 font-bold"><span className={`w-4 h-4 rounded-full border-2 grid place-items-center ${payChoice === 'half' ? 'border-[#641629]' : 'border-black/25'}`}>{payChoice === 'half' && <span className="w-2 h-2 rounded-full bg-[#641629]" />}</span> Half payment <span className="ml-auto text-[10px] font-bold bg-black text-white rounded-full px-2 py-0.5">50% NOW</span></span>
                    <span className="block text-[12.5px] mt-1">Pay now <b>{formatINR(half)}</b> (50%) · Balance <b>{formatINR(total - half)}</b> + 30% extra <b>{formatINR(deposit)}</b> on delivery</span>
                  </button>
                  )}
                  {hasBuy && <p className="text-[11.5px] text-black/55">Buy items me sirf full payment hota hai — half payment sirf rent ke liye hai.</p>}
                </div>
                {err && <p className="text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}
                <button disabled={paying} onClick={goQr} className="w-full bg-[#221114] text-white font-semibold rounded-full py-3.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2"><CreditCard size={15} /> {paying ? 'Processing…' : `Pay ${formatINR(payAmount)} ${effectivePayChoice === 'full' ? 'Full' : 'Half'} via QR`}</button>
                <p className="text-[11px] text-black/45 text-center">GPay · PhonePe · Paytm · BHIM — QR scan & pay</p>
                <p className="text-[11px] text-black/45 text-center">By confirming you agree to our <a href="/terms" target="_blank" className="underline">Terms</a> &amp; <a href="/refunds" target="_blank" className="underline">Refund Policy</a></p>
                <p className="text-[11px] text-black/45 text-center flex items-center justify-center gap-1"><ShieldCheck size={12} /> Your details stay private · No spam calls</p>
              </div>
            ) : step === 'qr' ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <button onClick={() => setStep('details')} className="text-xs font-semibold text-black/55 hover:text-black">← Back to details</button>
                {!upiLink ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm">
                    <b>QR payment is being set up.</b>
                    <p className="text-[12.5px] mt-1">Please contact the store on WhatsApp for payment.</p>
                  </div>
                ) : (
                  <>
                    <div className="border border-black/10 rounded-2xl p-4 text-center">
                      <p className="text-[11px] font-bold tracking-[0.14em]">SCAN & PAY {effectivePayChoice === 'full' ? 'FULL AMOUNT' : 'HALF AMOUNT'}</p>
                      <b className="font-display text-[32px] text-[#641629] leading-none mt-1 block">{formatINR(payAmount)}</b>
                      {effectivePayChoice === 'full'
                        ? <p className="text-[11.5px] text-emerald-700 font-semibold mt-1">{deposit > 0 ? 'Full — rent + 30% extra paid, nothing due on delivery' : 'Full payment — nothing due on delivery'}</p>
                        : <p className="text-[11.5px] text-black/55 mt-1">Half payment (50%) — balance {formatINR(rentBalance)} + 30% extra {formatINR(extraDue)} due on delivery</p>}
                      <div className="mx-auto mt-3 w-fit bg-white p-3 rounded-2xl border border-black/10">
                        <QRCodeSVG value={upiLink} size={200} />
                      </div>
                      <p className="text-[11.5px] text-black/55 mt-2">GPay · PhonePe · Paytm · BHIM — scan with any UPI app</p>
                      <button onClick={copyUpi} className="mt-2 max-w-full text-[12.5px] font-bold border border-black/15 rounded-full px-4 py-2 hover:bg-black hover:text-white transition break-all">
                        {copied ? 'Copied ✓' : `Copy UPI ID: ${upiId}`}
                      </button>
                      <a href={upiLink} className="block mt-2 text-[12.5px] font-bold text-[#641629] underline">Open in UPI app →</a>
                    </div>
                    <label className="block text-[11px] font-bold tracking-wide">UTR / TRANSACTION ID * (12 digits, you get it after payment)
                      <input value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="Required — 12-digit UTR from your UPI app" inputMode="numeric" className="mt-1 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal outline-none focus:border-black" />
                      <span className="block font-normal text-black/50 mt-1 normal-case tracking-normal">Required — each UTR works only once and is verified by the store.</span>
                    </label>
                    <label className="block text-[11px] font-bold tracking-wide">PAYMENT SCREENSHOT * (required)
                      <input type="file" accept="image/*" onChange={(e) => onShot(e.target.files?.[0])} className="mt-1 w-full text-sm file:mr-3 file:rounded-full file:border file:border-black/15 file:bg-black file:text-white file:text-[12.5px] file:font-bold file:px-4 file:py-2 hover:file:brightness-125 file:transition" />
                      <span className="block font-normal text-black/50 mt-1 normal-case tracking-normal">Required — attach your UPI payment screenshot to place the order.</span>
                    </label>
                    {shotBusy && <p className="text-[12px] text-black/55">Compressing screenshot…</p>}
                    {shot && (
                      <div className="flex items-center gap-3 border border-emerald-200 bg-emerald-50 rounded-2xl p-2.5">
                        <img src={shot} alt="Payment screenshot" className="w-14 h-14 object-contain rounded-xl border" />
                        <p className="text-[12px] font-bold text-emerald-800 flex-1">Screenshot attached ✓</p>
                        <button onClick={() => setShot(null)} className="text-[12px] font-bold text-rose-700 underline shrink-0">Remove</button>
                      </div>
                    )}
                    {err && <p className="text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}
                    <button disabled={paying} onClick={confirmQrPaid} className="w-full bg-[#221114] text-white font-semibold rounded-full py-3.5 text-sm disabled:opacity-50">I have paid {formatINR(payAmount)} — Confirm order</button>
                    <p className="text-[11px] text-black/45 text-center">🔒 100% safe — payment goes directly to the store account.</p>
                  </>
                )}
              </div>
            ) : tab === 'orders' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
                  {/* Order wapas lao — dusra phone / cache clear ke baad */}
                  <div className="bg-white rounded-2xl p-3.5 border border-[#c9a44a]/50">
                    <b className="text-[13px]">Can&apos;t see your order?</b>
                    <p className="text-[11.5px] text-black/55 mt-0.5">Find it with your order mobile number or Order ID:</p>
                    <div className="flex gap-2 mt-2">
                      <input value={lookupPhone} onChange={(e) => setLookupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" className="flex-1 min-w-0 border border-black/15 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-black" />
                      <button onClick={runLookupByPhone} disabled={lookupBusy} className="shrink-0 bg-[#221114] text-white text-[12.5px] font-bold rounded-xl px-4 py-2 disabled:opacity-50">{lookupBusy ? '…' : 'Find'}</button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input value={lookupId} onChange={(e) => setLookupId(e.target.value.toUpperCase())} placeholder="Order ID e.g. RL-2026-1234" className="flex-1 min-w-0 border border-black/15 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-black uppercase" />
                      <button onClick={runLookupById} disabled={lookupBusy} className="shrink-0 border border-black/15 text-[12.5px] font-bold rounded-xl px-4 py-2 hover:bg-black hover:text-white transition disabled:opacity-50">{lookupBusy ? '…' : 'Get'}</button>
                    </div>
                    {lookupMsg && <p className="text-[12px] mt-2 bg-[#faf7ef] border border-[#c9a44a]/40 rounded-xl px-3 py-2">{lookupMsg}</p>}
                    {orders.length > 0 && (
                      <button onClick={refreshStatuses} disabled={syncingUi} className="mt-2 w-full text-[12.5px] font-bold border border-black/15 rounded-xl px-3 py-2 hover:bg-black hover:text-white transition disabled:opacity-50">
                        {syncingUi ? 'Checking latest status…' : '↻ Refresh order status'}
                      </button>
                    )}
                  </div>
                  {orders.length === 0 && !lookupMsg && <p className="text-center text-black/50 py-8">No orders yet on this device.<br />Your confirmed orders will appear here.</p>}
                  {orders.map((o) => (
                    <div key={o.id} className={`rounded-2xl p-3.5 border ${o.status === 'cancelled' ? 'bg-rose-50/50 border-rose-300' : 'bg-white border-black/10'}`}>
                      {o.status === 'cancelled' && (
                        <div className="rounded-xl bg-rose-700 text-white px-3.5 py-3 mb-2.5 shadow-[0_12px_24px_-14px_rgba(190,18,60,.7)]">
                          <b className="text-[13.5px]">✕ Order cancelled by store</b>
                          <p className="text-[12px] text-white/85 mt-0.5">{o.note || 'Sorry — this outfit is out of stock / not available for your date.'}</p>
                          {o.payStatus !== 'verified' && o.token > 0 && <p className="text-[12px] font-bold text-white mt-1">Refund of {formatINR(o.token)} will be done on WhatsApp/UPI — contact the store.</p>}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <b className="text-[13.5px]">{o.id}</b>
                        <span className="ml-auto text-[11px] text-black/50">{new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="mt-2 space-y-2">
                        {o.items.map((it, i) => {
                          const src = orderImgFor(it);
                          return (
                          <div key={i} className="flex gap-3 text-[12px] bg-white border border-black/10 rounded-2xl p-2 overflow-hidden">
                            {src ? (
                              <button onClick={() => setViewPhoto({ src, name: it.name })} title="Tap to view full photo" className="relative shrink-0 group">
                                <img src={src} alt={it.name} loading="lazy" className="w-20 h-24 object-contain rounded-xl border border-black/10 group-hover:opacity-90 transition" />
                                <span className="absolute bottom-1 right-1 bg-black/65 text-white text-[9px] font-bold rounded-full px-2 py-0.5">View ⤢</span>
                              </button>
                            ) : (
                              <span className="w-20 h-24 grid place-items-center rounded-xl border border-black/10 bg-black/5 text-black/30 text-[10px] font-bold shrink-0">No<br />photo</span>
                            )}
                            <span className="text-black/70 min-w-0 flex-1 py-0.5">
                              <b className="block text-[13px] leading-snug text-black">{it.name}</b>
                              <span className="block text-[10.5px] text-black/45 mt-0.5">{it.detail}</span>
                              <span className="block text-[11px] text-black/55 mt-0.5">Qty: <b>{it.qty}</b></span>
                              <b className="block text-[14px] mt-0.5">{formatINR(it.price)}</b>
                            </span>
                          </div>
                          );
                        })}
                      </div>
                      <div className="border-t border-black/10 mt-2 pt-2 flex justify-between text-[13px]"><span>Total</span><b>{formatINR(o.total)}</b></div>
                      <p className="text-[11px] text-black/55 mt-0.5">{o.mode === 'upi-qr-full' ? `Full ${formatINR(o.token)}${o.deposit > 0 ? ' (rent + 30% extra)' : ''} claimed via QR${o.payStatus === 'verified' ? ' · payment verified ✓' : o.payStatus === 'rejected' ? ' · payment needs attention — store will contact you' : ' · verification pending'}` : o.mode === 'upi-qr-half' ? `Half ${formatINR(o.token)} claimed via QR · Balance ${formatINR(o.total - o.token)} + 30% extra ${formatINR(o.deposit)} on delivery${o.payStatus === 'verified' ? ' · payment verified ✓' : o.payStatus === 'rejected' ? ' · payment needs attention — store will contact you' : ' · verification pending'}` : o.mode === 'upi-qr' ? `Token ${formatINR(o.token)} claimed via QR${o.payStatus === 'verified' ? ' · payment verified ✓' : o.payStatus === 'rejected' ? ' · payment needs attention — store will contact you' : ' · verification pending'}` : 'Pay on delivery'}{o.deposit > 0 ? ` · Refundable extra 30% ${formatINR(o.deposit)} — you get it back on return` : ' · Buy order — no return needed'}</p>
                      <span className={`inline-block mt-1 text-[10.5px] font-bold rounded-full px-2 py-0.5 border ${o.status === 'cancelled' ? 'text-white bg-rose-600 border-rose-600' : o.status === 'delivered' || o.status === 'returned' ? 'text-violet-800 bg-violet-50 border-violet-200' : o.status === 'confirmed' ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : o.status === 'onway' ? 'text-orange-800 bg-orange-50 border-orange-200' : 'text-amber-800 bg-amber-50 border-amber-200'}`}>
                        {o.status === 'cancelled' ? '✕ Cancelled' : o.status === 'delivered' ? '✓ Delivered' : o.status === 'returned' ? '✓ Returned' : o.status === 'confirmed' ? '✓ Confirmed' : o.status === 'onway' ? '🚚 On the way — arriving soon' : '⏳ Payment sent — awaiting store confirmation'}
                      </span>
                      {o.readyDate && o.status !== 'cancelled' && <span className="inline-block mt-1 ml-1.5 text-[10.5px] font-bold text-[#641629] bg-[#faf3ea] border border-[#c9a44a]/50 rounded-full px-2 py-0.5">📦 Available by {new Date(o.readyDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {o.note && o.status !== 'cancelled' && <p className="text-[12px] mt-1.5 bg-[#faf7ef] border border-[#c9a44a]/40 rounded-xl px-3 py-2"><b>Store message:</b> {o.note}</p>}
                      {o.status === 'cancelled' ? (
                        <>
                          <button onClick={() => { resetAndClose(); setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), 450); }} className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 bg-[#221114] text-white text-[12.5px] font-bold rounded-full py-2.5">Browse other dresses →</button>
                          <a href={waLink(`Hi TheKissa.co! My order ${o.id} was cancelled. Please suggest a similar outfit. Name: ${o.name}, Mobile: ${o.phone}`)} target="_blank" className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-[#25d366] text-white text-[12.5px] font-bold rounded-full py-2.5"><MessageCircle size={14} /> Ask for alternative on WhatsApp</a>
                        </>
                      ) : (
                      <a href={waLink(`Hi TheKissa.co! Reorder ${o.id} — same items please. Name: ${o.name}, Mobile: ${o.phone}`)} target="_blank" className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 bg-[#25d366] text-white text-[12.5px] font-bold rounded-full py-2.5"><MessageCircle size={14} /> Reorder on WhatsApp</a>
                      )}
                      <button onClick={async () => { const { downloadInvoicePDF } = await import('../lib/invoice'); downloadInvoicePDF(o, invoiceOpts()); }} className="mt-2 w-full inline-flex items-center justify-center gap-1.5 border border-[#c9a44a]/60 text-[#4d0f1f] text-[12.5px] font-bold rounded-full py-2.5 hover:bg-[#4d0f1f] hover:text-[#f7ead0] hover:border-[#4d0f1f] transition"><Download size={14} /> Download Invoice (PDF)</button>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-black/10 bg-white" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                  <p className="text-[11px] text-black/50 text-center">Orders stay saved on this device/browser and are also sent to the store on WhatsApp.<br />To view on another phone, use Find with your mobile number above.</p>
                  {orders.length > 0 && <button onClick={() => { if (confirm('Remove all orders from this device? (The store keeps its WhatsApp record.)')) { clearMyOrdersFully(); setOrders([]); } }} className="w-full text-xs text-black/50 underline mt-1">Clear history</button>}
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
                  {orders.length > 0 && rows.length > 0 && (
                    <button onClick={() => setTab('orders')} className="w-full flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-2 hover:bg-emerald-100 transition">
                      ✓ You have {orders.length} order{orders.length === 1 ? '' : 's'} — View →
                    </button>
                  )}
                  {rows.length === 0 && orders.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-emerald-200 text-center">
                      <p className="text-[13px] font-bold text-emerald-800">✓ You have {orders.length} order{orders.length === 1 ? '' : 's'}</p>
                      <button onClick={() => setTab('orders')} className="mt-2 w-full bg-[#221114] text-white text-[13px] font-bold rounded-full py-2.5">View my order →</button>
                    </div>
                  )}
                  {rows.length === 0 && orders.length === 0 && <p className="text-center text-black/50 py-16">Your list is empty.<br />Add a dress from the shop 👆</p>}
                  {rows.map((r) => (
                    <div key={`${r.id}-${r.size}-${r.plan}-${(r.addons ?? []).join('+')}-${r.single?.name ?? ''}`} className="flex gap-3 bg-white rounded-2xl p-2.5 border border-black/10">
                      <img src={r.single?.img ?? r.p.img} className="w-16 h-20 object-contain rounded-xl" alt={r.single?.name ?? r.p.name} />
                      <div className="flex-1 text-sm">
                        {r.single ? (
                          <>
                            <span className="inline-block text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">ACCESSORY ONLY</span>
                            <b className="text-[13px] leading-tight block mt-1">{r.single.name}</b>
                            <p className="text-[11px] text-black/55">{r.p.id} look · without dress • x{r.qty}</p>
                          </>
                        ) : (
                          <>
                            <span className={`inline-block text-[10px] font-bold tracking-wide rounded-full px-2 py-0.5 border ${r.plan === 'buy' ? 'bg-[#641629] text-white border-[#641629]' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{r.plan === 'buy' ? 'BUY' : 'RENT · 1-day'}</span>
                            <b className="text-[13px] leading-tight block mt-1">{r.p.name}</b>
                            <p className="text-[11px] text-black/55">Size {r.size} • {r.plan === 'buy' ? 'buy — yours forever' : '1-day rent'} • x{r.qty}</p>
                          </>
                        )}
                        {!!r.addons?.length && <p className="text-[11px] text-emerald-700 font-medium">+ {r.addons.join(', ')}</p>}
                        <b className="text-[14px]">{formatINR(rowPrice(r) * r.qty)}</b>
                        {!r.single && r.plan !== 'buy' && <p className="text-[11px] text-emerald-700 font-semibold">+ {formatINR(refundableExtra(rowPrice(r) * r.qty))} refundable extra (30%)</p>}
                        {!r.single && r.plan === 'buy' && <p className="text-[11px] text-black/50 font-medium">No deposit · no return</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] font-bold text-black/55">Qty:</span>
                          <span className="flex items-center gap-1.5 border border-black/10 rounded-full px-1 py-0.5">
                            <button onClick={() => setQty(r.id, r.size, r.plan, r.addons, r.single?.name, r.qty - 1)} disabled={r.qty <= 1} aria-label="Decrease quantity" className="w-8 h-8 grid place-items-center rounded-full hover:bg-black hover:text-white transition disabled:opacity-30"><Minus size={13} /></button>
                            <b className="w-5 text-center text-[13px] tabular-nums">{r.qty}</b>
                            <button onClick={() => setQty(r.id, r.size, r.plan, r.addons, r.single?.name, r.qty + 1)} aria-label="Increase quantity" className="w-8 h-8 grid place-items-center rounded-full hover:bg-black hover:text-white transition disabled:opacity-30"><Plus size={13} /></button>
                          </span>
                        </div>
                      </div>
                      <button onClick={() => remove(r.id, r.size, r.plan, r.addons, r.single?.name)} aria-label="Remove item" className="text-red-600 w-10 h-10 grid place-items-center rounded-full hover:bg-red-50 transition shrink-0"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-black/10 bg-white space-y-2.5" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Subtotal</span><b>{formatINR(subtotal)}</b></div>
                    <div className="flex justify-between text-[17px]"><span>Total{hasBuy && hasRent ? ' (rent + buy)' : hasBuy ? ' (buy)' : ' rent'}</span><b>{formatINR(total)}</b></div>
                    {deposit > 0
                      ? <><div className="flex justify-between text-emerald-700"><span>Refundable extra 30% (you get back)</span><b>{formatINR(deposit)}</b></div>
                    <p className="text-[11px] text-black/50">{effectivePayChoice === 'full' ? `Nothing due on delivery — you will get ${formatINR(deposit)} back via UPI/cash within 24h of return.` : `Balance rent + 30% extra due on delivery. You will get ${formatINR(deposit)} back via UPI/cash within 24h of return.`}</p></>
                      : <p className="text-[11px] text-black/50">Buy order — full payment now, no deposit, no return needed.</p>}
                  </div>
                  <button disabled={rows.length === 0} onClick={() => setStep('details')} className="w-full bg-[#221114] text-white font-semibold rounded-full py-3.5 text-sm disabled:opacity-40 flex items-center justify-center gap-2"><ShoppingBasket size={15} /> Proceed to Checkout →</button>
                  <button onClick={clear} className="w-full text-xs text-black/50 underline">Clear list</button>
                </div>
              </>
            )}
          </motion.aside>
          {/* Order photo full-view — thumbnail tap par badi photo */}
          <AnimatePresence>
            {viewPhoto && (
              <motion.div className="absolute inset-0 z-[60] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewPhoto(null)} />
                <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} transition={{ duration: 0.22 }}
                  className="relative bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl">
                  <img src={viewPhoto.src} alt={viewPhoto.name} className="w-full max-h-[70vh] object-contain bg-black" />
                  <div className="flex items-center gap-2 p-3">
                    <b className="text-[13px] flex-1 min-w-0 truncate">{viewPhoto.name}</b>
                    <button onClick={() => setViewPhoto(null)} aria-label="Close photo" className="w-9 h-9 grid place-items-center rounded-full bg-black/5 hover:bg-[#641629] hover:text-white transition shrink-0"><X size={15} /></button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="fixed bottom-28 sm:bottom-5 left-1/2 -translate-x-1/2 z-[60] space-y-2 w-max max-w-[90vw]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="bg-[#3d0a18] text-white text-sm font-semibold rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-2 text-center break-words whitespace-normal max-w-[90vw]">
            <Plus size={14} className="text-[#ffc93c]" /> {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function TrackFloat() {
  return (
    <a href="/track"
      className="fixed bottom-24 right-4 sm:bottom-5 sm:right-5 z-40 w-14 h-14 grid place-items-center rounded-full bg-[#221114] text-white shadow-2xl hover:scale-110 transition ring-1 ring-white/20" aria-label="Track your delivery"><MapPin size={24} /></a>
  );
}
