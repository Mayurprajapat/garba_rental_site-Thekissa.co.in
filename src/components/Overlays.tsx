import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Check, CheckCircle2, CreditCard, Heart, Mail, MapPin, MessageCircle, Plus, ReceiptText, ShieldCheck, ShoppingBasket, Sparkles, Star, Trash2, Truck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { addonTotal, hotspotsFor, lookFor, photosFor, waLink, type Accessory, type Category, type Hotspot } from '../data/products';
import { itemImgFor } from '../lib/items';
import { saveBooking } from '../lib/db';
import { formatINR, isValidIndianPhone, makeOrderId, tokenAdvance } from '../lib/order';
import { useProducts } from '../lib/ProductsContext';
import { RAZORPAY_KEY_ID, payWithRazorpay } from '../lib/razorpay';
import { promoDiscount, useStore } from '../store/useStore';

export function QuickView() {
  const { products } = useProducts();
  const id = useStore((s) => s.quickView);
  const setQuickView = useStore((s) => s.setQuickView);
  const addToCart = useStore((s) => s.addToCart);
  const toggleWish = useStore((s) => s.toggleWish);
  const wishlist = useStore((s) => s.wishlist);
  const p = products.find((x) => x.id === id) ?? null;
  const [size, setSize] = useState('M');
  const [plan, setPlan] = useState<'3day' | '9day'>('3day');
  const [picked, setPicked] = useState<string[]>([]);
  const [activeHot, setActiveHot] = useState<string | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  useEffect(() => { setPicked([]); setActiveHot(null); setPhotoIdx(0); }, [id]);
  const look = useMemo(() => (p ? lookFor(p) : []), [p]);
  const spots = useMemo(() => (p ? hotspotsFor(p) : []), [p]);
  const photos = useMemo(() => (p ? photosFor(p) : []), [p]);
  const activeSpot: Hotspot | null = spots.find((s) => s.key === activeHot) ?? null;
  const paidAddons = look.filter((a) => a.tag === 'addon');
  const pickedTotal = p ? addonTotal(p, picked) : 0;
  const togglePick = (name: string) =>
    setPicked((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  const addDress = () => {
    if (!p) return;
    addToCart(p.id, p.sizes.includes(size) ? size : p.sizes[0], plan, picked.length ? picked : undefined);
    setQuickView(null);
  };
  const tapSpot = (key: string) => setActiveHot((prev) => (prev === key ? null : key));

  return (
    <AnimatePresence>
      {p && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setQuickView(null)} />
          <motion.div initial={{ y: 60, scale: 0.99 }} animate={{ y: 0, scale: 1 }} exit={{ y: 60, scale: 0.99 }} transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative bg-white rounded-t-[1.5rem] sm:rounded-[1.5rem] max-w-4xl w-full overflow-hidden grid md:grid-cols-[0.9fr_1.1fr] max-h-[94dvh] sm:max-h-[92vh] shadow-[0_60px_120px_-40px_rgba(0,0,0,.7)] ring-1 ring-black/10">
            <div className="bg-[#f4f1ea] flex flex-col min-h-0 img-sheen">
              <div className="relative aspect-[3/4] max-h-[62dvh] md:aspect-auto md:h-[540px] md:max-h-[80vh] overflow-hidden shrink-0">
                <img key={photos[photoIdx] ?? p.img} src={photos[photoIdx] ?? p.img} alt={p.name} className="w-full h-full object-cover" />
                {p.badge && <span className="absolute top-4 left-4 bg-gradient-to-br from-[#f0d78c] to-[#c9a44a] text-[#641629] text-[10px] font-bold tracking-[0.12em] rounded-full px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5)] z-[2]">{p.badge}</span>}
                {photoIdx === 0 ? (
                  <span className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-[10.5px] font-semibold rounded-full px-3 py-1.5">Tap the dots • see every item</span>
                ) : (
                  <span className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-[10.5px] font-semibold rounded-full px-3 py-1.5">Same dress • another angle</span>
                )}
              {photoIdx === 0 && spots.map((s) => {
                const on = activeHot === s.key;
                return (
                  <button key={s.key} onClick={() => tapSpot(s.key)} aria-label={s.name} title={s.name}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                    <span className={`relative grid place-items-center w-7 h-7 rounded-full border-2 shadow-lg transition ${on ? 'bg-[#641629] text-white border-white scale-110' : 'bg-white/95 text-black border-black/20 group-hover:scale-110'}`}>
                      {!on && <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-60 animate-ping" />}
                      <Plus size={14} className="relative" />
                    </span>
                  </button>
                );
              })}
              {photoIdx === 0 && activeSpot && (
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur rounded-2xl p-3 shadow-2xl border border-black/10">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <b className="text-[13.5px] block leading-tight">{activeSpot.name}</b>
                      <span className={`inline-block mt-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${activeSpot.tag === 'free' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : activeSpot.tag === 'dress' ? 'bg-[#641629] text-white' : activeSpot.tag === 'addon' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-black/[.05] text-black/60'}`}>
                        {activeSpot.tag === 'free' ? 'FREE' : activeSpot.tag === 'dress' ? `RENT ₹${(activeSpot.price ?? 0).toLocaleString('en-IN')}` : activeSpot.tag === 'addon' ? `+₹${(activeSpot.price ?? 0).toLocaleString('en-IN')}` : 'INCLUDED'}
                      </span>
                    </div>
                    <button onClick={() => setActiveHot(null)} aria-label="Close" className="w-7 h-7 grid place-items-center rounded-full bg-black/5 hover:bg-[#641629] hover:text-white transition shrink-0"><X size={13} /></button>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {activeSpot.tag === 'dress' ? (
                      <button onClick={addDress} className="flex-1 bg-[#641629] text-white text-[12px] font-bold rounded-full py-2 flex items-center justify-center gap-1.5"><ShoppingBasket size={13} /> Add to list</button>
                    ) : activeSpot.tag === 'addon' ? (
                      <>
                        <button onClick={() => { if (!picked.includes(activeSpot.name)) togglePick(activeSpot.name); setActiveHot(null); }} className="flex-1 bg-[#641629] text-white text-[12px] font-bold rounded-full py-2">+ With the dress</button>
                        <button onClick={() => { addToCart(p.id, 'One-size', plan, undefined, { name: activeSpot.name, price: activeSpot.price ?? 0, img: itemImgFor(activeSpot.name, p.img) }); }} className="flex-1 border border-emerald-600 text-emerald-700 text-[12px] font-bold rounded-full py-2">Only this</button>
                      </>
                    ) : (
                      <p className="text-[11.5px] text-black/55">This is included in the dress rental — no need to tick it below.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-2.5 bg-white border-t border-black/10 shrink-0">
                {photos.map((src, i) => (
                  <button key={`${src}-${i}`} onClick={() => { setPhotoIdx(i); setActiveHot(null); }} aria-label={`Photo ${i + 1}`}
                    className={`rounded-lg sm:rounded-xl overflow-hidden border-2 transition shrink-0 ${i === photoIdx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={src} alt="" className="w-11 h-13 sm:w-14 sm:h-16 object-cover" />
                  </button>
                ))}
                <span className="self-center text-[10.5px] sm:text-[11px] text-black/45 font-medium ml-1">Tap to<br />switch angle</span>
              </div>
            )}
            </div>
            <div className="p-5 sm:p-7 overflow-y-auto min-h-0 max-h-[46dvh] sm:max-h-[48vh] md:max-h-[88vh] overscroll-contain">
              <button onClick={() => setQuickView(null)} aria-label="Close" className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full bg-black/[.06] backdrop-blur hover:bg-[#641629] hover:text-white transition z-[3]"><X size={16} /></button>
              <p className="text-[11px] font-bold tracking-[0.14em] text-neutral-400">{p.id} · {p.fabric.toUpperCase()}</p>
              <h3 className="premium-heading font-display font-black text-[26px] leading-tight mt-1.5 text-black">{p.name}</h3>
              <p className="text-[13px] text-neutral-500 mt-0.5">{p.hindi}</p>
              <div className="flex items-center gap-1.5 text-[13px] mt-2.5"><Star size={14} className="fill-[#c9960a] text-[#c9960a]" /><b>{p.rating}</b><span className="text-neutral-400">({p.reviews} reviews)</span></div>
              <p className="text-[13.5px] mt-3 leading-relaxed text-neutral-600">{p.desc}</p>
              {!!look.length && (
                <div className="mt-4 rounded-2xl border border-black/[.07] bg-[#fafafa] p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] text-black"><Sparkles size={13} className="text-[#c9a44a]" /> THE MODEL WORE THIS</p>
                  <p className="text-[11.5px] text-neutral-500 mt-0.5">The complete look is right here — nothing to search for.</p>
                  <div className="mt-2.5 space-y-1.5">
                    {look.filter((a) => a.tag !== 'addon').map((a) => (
                      <div key={a.name} className={`flex items-center gap-2 text-[12.5px] bg-white border rounded-xl px-3 py-2 transition ${activeHot === a.name ? 'border-black ring-2 ring-black/15' : 'border-black/[.07]'}`}>
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
                            className={`flex-1 flex items-center gap-2 text-[12.5px] border rounded-xl px-3 py-2 transition text-left ${on ? 'border-[#641629] bg-[#641629] text-white' : activeHot === a.name ? 'bg-white border-[#641629] ring-2 ring-[#641629]/25' : 'bg-white border-[#641629]/15 hover:border-[#641629]/50'}`}>
                            <span className={`w-4 h-4 rounded-md border grid place-items-center shrink-0 ${on ? 'bg-white text-black border-white' : 'border-black/25'}`}>
                              {on && <Check size={12} />}
                            </span>
                            <span className="font-medium flex-1">{a.name}</span>
                            <b className="text-[12px]">+₹{(a.price ?? 0).toLocaleString('en-IN')}</b>
                          </button>
                          <button
                            onClick={() => { addToCart(p.id, 'One-size', plan, undefined, { name: a.name, price: a.price ?? 0, img: itemImgFor(a.name, p.img) }); }}
                            title="Rent only this item, without the dress"
                            className="shrink-0 text-[11px] font-bold border border-emerald-600 text-emerald-700 rounded-xl px-2.5 hover:bg-emerald-600 hover:text-white transition">
                            Only<br />this
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {!!paidAddons.length && (
                    <p className="text-[11px] text-[#6f5b6a] mt-2">Tick = joins the dress · <b>Only this</b> = rent the item alone, without the dress.</p>
                  )}
                </div>
              )}
              <div className="mt-5">
                <p className="label-pro">Select size</p>
                <div className="flex flex-wrap gap-1.5 mt-2">{p.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`text-xs font-semibold border rounded-full px-3.5 py-2 transition ${size === s ? 'bg-[#641629] text-white border-[#641629]' : 'border-[#641629]/15 hover:border-[#641629]/40'}`}>{s}</button>
                ))}</div>
              </div>
              <div className="mt-4">
                <p className="label-pro">Rental plan</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={() => setPlan('3day')} className={`border rounded-2xl p-3 text-left transition ${plan === '3day' ? 'border-[#641629] bg-[#faf7ef]' : 'border-[#641629]/12'}`}><b className="text-sm">3-day · ₹{p.rent3.toLocaleString('en-IN')}</b><p className="text-[11px] text-[#6f5b6a] mt-0.5">Single event + returns</p></button>
                  <button onClick={() => setPlan('9day')} className={`border rounded-2xl p-3 text-left transition ${plan === '9day' ? 'border-[#641629] bg-[#faf7ef]' : 'border-[#641629]/12'}`}><b className="text-sm">9-day · ₹{p.rent9.toLocaleString('en-IN')}</b><p className="text-[11px] text-[#6f5b6a] mt-0.5">Full Navratri value</p></button>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-4"><b className="font-display text-[26px]">₹{(plan === '3day' ? p.rent3 : p.rent9).toLocaleString('en-IN')}</b><s className="text-[#8a7584] text-sm">₹{p.buy.toLocaleString('en-IN')}</s></div>
              <p className="text-[11.5px] text-emerald-700 font-semibold mt-0.5">+ ₹{p.deposit.toLocaleString('en-IN')} fully refundable deposit</p>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <button onClick={addDress} className="btn-primary !py-3 !text-[13px]"><ShoppingBasket size={15} /> Add to list{pickedTotal ? ` +₹${pickedTotal.toLocaleString('en-IN')}` : ''}</button>
                <button onClick={() => toggleWish(p.id)} className="btn-outline-dark !py-3 !text-[13px]"><Heart size={15} className={wishlist.includes(p.id) ? 'fill-[#c9273a] text-[#c9273a]' : ''} /> Wishlist</button>
              </div>
              <a href={waLink(`Hi TheKissa.co.in! Is ${p.name} (${p.id}), size ${size}, ${plan === '3day' ? '3-day' : '9-day'} available?`)} target="_blank" className="mt-2 w-full inline-flex items-center justify-center gap-1.5 border border-[#641629]/15 rounded-full py-3 text-[13px] font-semibold hover:border-[#641629] transition"><MessageCircle size={15} /> Ask on WhatsApp</a>
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

export function CartDrawer() {
  const { products } = useProducts();
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const remove = useStore((s) => s.removeFromCart);
  const clear = useStore((s) => s.clearCart);
  const eventDate = useStore((s) => s.eventDate);
  const setEventDate = useStore((s) => s.setEventDate);
  const promo = useStore((s) => s.promo);
  const setPromo = useStore((s) => s.setPromo);

  const [step, setStep] = useState<'cart' | 'details' | 'done'>('cart');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState('');
  const [order, setOrder] = useState<{ id: string; paymentId: string; mode: string; token: number; total: number; deposit: number } | null>(null);

  const rowPrice = (r: { p: { rent3: number; rent9: number; category: Category; desc: string; accessories?: Accessory[] }; plan: '3day' | '9day'; addons?: string[]; single?: { price: number } }) =>
    r.single ? r.single.price : ((r.plan === '3day' ? r.p.rent3 : r.p.rent9) + addonTotal(r.p, r.addons));

  const rows = useMemo(() => cart.map((c) => ({ ...c, p: products.find((x) => x.id === c.id)! })).filter((r) => r.p), [cart, products]);
  const subtotal = rows.reduce((a, r) => a + rowPrice(r) * r.qty, 0);
  const deposit = rows.reduce((a, r) => a + (r.single ? 0 : r.p.deposit * r.qty), 0);
  const disc = promoDiscount(subtotal, promo);
  const total = subtotal - disc;
  const token = tokenAdvance(total);
  const balance = total - token;

  const resetAndClose = () => {
    setOpen(false);
    setTimeout(() => { setStep('cart'); setOrder(null); setErr(''); }, 400);
  };

  const validateDetails = () => {
    if (name.trim().length < 3) return 'Please enter your full name';
    if (!isValidIndianPhone(phone)) return 'Please enter a valid 10-digit mobile number';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address';
    if (!eventDate) return 'Please select the event date';
    if (!rows.length) return 'Your list is empty';
    return '';
  };

  const rowLabel = (r: { plan: '3day' | '9day'; size: string; qty: number; addons?: string[] }) => {
    const base = `Size ${r.size}, ${r.plan === '3day' ? '3-day' : '9-day'} x${r.qty}`;
    return r.addons?.length ? `${base} + ${r.addons.join(', ')}` : base;
  };

  const buildWaMsg = (orderId: string, payInfo: string) => {
    const lines = rows.map((r, i) => r.single
      ? `${i + 1}. ${r.single.name} (accessory only — ${r.p.id} look) x${r.qty} = ${formatINR(r.single.price * r.qty)}`
      : `${i + 1}. ${r.p.name} (${r.p.id}) — ${rowLabel(r)} = ${formatINR(rowPrice(r) * r.qty)}`);
    return `Hi TheKissa.co.in! New Order ${orderId}\n\n${lines.join('\n')}\n\nName: ${name}\nMobile: ${phone}\nEvent: ${eventDate}\nSubtotal: ${formatINR(subtotal)}\nDiscount: -${formatINR(disc)}\nTotal rent: ${formatINR(total)}\nToken: ${payInfo}\nBalance on delivery: ${formatINR(balance)}\nDeposit (refundable): ${formatINR(deposit)}`;
  };

  const buildCustomerMsg = (o: { id: string; total: number; deposit: number }) =>
    `Your order has been confirmed successfully!\n\nOrder ID: ${o.id}\nName: ${name}\nEvent: ${eventDate || 'TBD'}\nTotal rent: ${formatINR(o.total)}\nDeposit (refundable): ${formatINR(o.deposit)}\n\nThank you for renting with TheKissa.co.in! We will call/WhatsApp you within 30 minutes (9 AM – 10 PM).`;

  const confirmWithoutPayment = async () => {
    const v = validateDetails();
    if (v) { setErr(v); return; }
    setErr('');
    setPaying(true);
    try {
      const orderId = makeOrderId();
      await saveBooking({
        order_id: orderId,
        name: name.trim(),
        phone: phone.trim(),
        category: 'cart',
        size: '',
        event_date: eventDate || null,
        plan: promo || 'cart',
        note: rows.map((r) => r.single ? `${r.p.id} SINGLE:${r.single.name} x${r.qty}` : `${r.p.id} ${r.size} ${r.plan} x${r.qty}${r.addons?.length ? ` +${r.addons.join('+')}` : ''}`).join(' | ').slice(0, 500),
        items: rows.map((r) => ({ id: r.p.id, name: r.single ? `${r.single.name} (accessory only)` : r.p.name, size: r.size, plan: r.plan, qty: r.qty, addons: r.addons ?? [], single: r.single ?? null })),
        subtotal,
        total,
        token_amount: 0,
        deposit,
        deposit_status: 'pending',
        payment_mode: 'pay-on-delivery',
        payment_id: '',
        payment_status: 'pending',
      });
      setOrder({ id: orderId, paymentId: '', mode: 'pay-on-delivery', token: 0, total, deposit });
      setStep('done');
      clear();
      window.open(waLink(buildWaMsg(orderId, 'Cash/UPI on delivery')), '_blank');
    } finally {
      setPaying(false);
    }
  };

  const payOnline = async () => {
    const v = validateDetails();
    if (v) { setErr(v); return; }
    setErr('');
    if (!RAZORPAY_KEY_ID) {
      setErr('Online payment is being set up — please confirm with Pay on delivery for now.');
      return;
    }
    if (token < 1) {
      setErr('Token amount is below ₹1 — please confirm with Pay on delivery.');
      return;
    }
    setPaying(true);
    try {
      const orderId = makeOrderId();
      const r = await payWithRazorpay({ amount: token, orderId, name: name.trim(), phone: phone.trim() });
      await saveBooking({
        order_id: orderId,
        name: name.trim(),
        phone: phone.trim(),
        category: 'cart',
        size: '',
        event_date: eventDate || null,
        plan: promo || 'cart',
        note: rows.map((r2) => r2.single ? `${r2.p.id} SINGLE:${r2.single.name} x${r2.qty}` : `${r2.p.id} ${r2.size} ${r2.plan} x${r2.qty}${r2.addons?.length ? ` +${r2.addons.join('+')}` : ''}`).join(' | ').slice(0, 500),
        items: rows.map((r2) => ({ id: r2.p.id, name: r2.single ? `${r2.single.name} (accessory only)` : r2.p.name, size: r2.size, plan: r2.plan, qty: r2.qty, addons: r2.addons ?? [], single: r2.single ?? null })),
        subtotal,
        total,
        token_amount: token,
        deposit,
        deposit_status: 'pending',
        payment_mode: 'razorpay',
        payment_id: r.paymentId,
        payment_status: 'paid-token',
      });
      setOrder({ id: orderId, paymentId: r.paymentId, mode: 'razorpay', token, total, deposit });
      setStep('done');
      clear();
    } catch (e: any) {
      setErr(e?.message || 'Payment failed');
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
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
              <div>
                <h3 className="font-semibold text-[17px] tracking-tight">Booking {step === 'cart' ? `(${cart.reduce((a, c) => a + c.qty, 0)})` : step === 'details' ? '— Details' : '— Confirmed'}</h3>
                <p className="text-[11px] text-black/50 mt-0.5">Step {step === 'cart' ? '1/3 List' : step === 'details' ? '2/3 Details & Payment' : '3/3 Invoice'} · Secure checkout</p>
              </div>
              <button onClick={resetAndClose} className="w-9 h-9 grid place-items-center rounded-full bg-black/5 hover:bg-[#641629] hover:text-white transition"><X size={16} /></button>
            </div>

            {step === 'done' && order ? (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="text-center py-2">
                  <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
                  <h4 className="font-semibold text-xl mt-3">Your order has been confirmed successfully!</h4>
                  <p className="text-sm text-black/55 mt-1">Order ID: <b className="text-black">{order.id}</b> · we will call/WhatsApp within 30 min</p>
                </div>
                <div className="mt-4 border border-black/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-[#641629] text-white flex items-center gap-2 text-sm font-semibold"><ReceiptText size={15} /> Invoice</div>
                  <div className="p-4 text-sm space-y-1.5">
                    <div className="flex justify-between"><span className="text-black/55">Order ID</span><b>{order.id}</b></div>
                    <div className="flex justify-between"><span className="text-black/55">Name</span><b>{name}</b></div>
                    <div className="flex justify-between"><span className="text-black/55">Payment</span><b>{order.mode === 'razorpay' ? `Token paid ${formatINR(order.token)}` : 'Pay on delivery'}</b></div>
                    {order.paymentId && <div className="flex justify-between gap-3"><span className="text-black/55 shrink-0">Txn ID</span><b className="text-[12px] text-right break-all">{order.paymentId}</b></div>}
                    <div className="border-t border-black/10 my-2 pt-2 flex justify-between"><span>Total rent</span><b>{formatINR(order.total)}</b></div>
                    <div className="flex justify-between text-[13px] text-emerald-700 font-semibold"><span>Security deposit (delivery par)</span><b>{formatINR(order.deposit)}</b></div>
                    <p className="text-[11px] text-black/50 pt-1">Deposit is 100% refundable — returned via UPI/cash within 24h of return.</p>
                  </div>
                </div>
                <p className="text-[12px] font-bold mt-4 text-center">Get your confirmation with Order ID:</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <a href={`https://wa.me/91${phone.replace(/\D/g, '')}?text=${encodeURIComponent(buildCustomerMsg(order))}`} target="_blank" className="bg-[#25d366] text-white font-semibold rounded-full py-3 text-sm flex items-center justify-center gap-1.5"><MessageCircle size={15} /> WhatsApp</a>
                  {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
                    ? <a href={`mailto:${email.trim()}?subject=${encodeURIComponent(`Order confirmed ${order.id} — TheKissa.co.in`)}&body=${encodeURIComponent(buildCustomerMsg(order))}`} className="bg-[#641629] text-white font-semibold rounded-full py-3 text-sm flex items-center justify-center gap-1.5"><Mail size={15} /> Email</a>
                    : <span className="bg-black/[.06] text-black/40 font-semibold rounded-full py-3 text-sm flex items-center justify-center gap-1.5"><Mail size={15} /> Email</span>}
                </div>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for confirmation (optional)" inputMode="email" className="mt-2 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-black" />
                <button onClick={resetAndClose} className="w-full mt-3 bg-[#641629] text-white font-semibold rounded-full py-3 text-sm">Continue shopping</button>
                <a href="/track" className="w-full mt-2 border border-black/15 font-semibold rounded-full py-3 text-sm hover:bg-[#641629] hover:border-[#641629] hover:text-white transition flex items-center justify-center gap-2">📍 Track delivery boy</a>
                <p className="text-[11px] text-black/45 text-center mt-2">Dispatch hote hi tracking link SMS/WhatsApp par milega</p>
              </div>
            ) : step === 'details' ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <button onClick={() => setStep('cart')} className="text-xs font-semibold text-black/55 hover:text-black">← Back to list</button>
                <div className="grid gap-3">
                  <label className="text-xs font-bold">FULL NAME *<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" className="mt-1.5 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal outline-none focus:border-black" /></label>
                  <label className="text-xs font-bold">MOBILE *<input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" inputMode="numeric" className="mt-1.5 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal outline-none focus:border-black" /></label>
                  <label className="text-xs font-bold">EMAIL (for order confirmation)<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" inputMode="email" className="mt-1.5 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal outline-none focus:border-black" /></label>
                  <label className="text-xs font-bold">EVENT DATE *<input type="date" value={eventDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setEventDate(e.target.value)} className="mt-1.5 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal" /></label>
                </div>
                <div className="bg-[#fafafa] border border-black/10 rounded-2xl p-4 text-sm space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><b>{formatINR(subtotal)}</b></div>
                  <div className="flex justify-between text-emerald-700"><span>Discount</span><b>-{formatINR(disc)}</b></div>
                  <div className="flex justify-between text-[15px]"><span>Total rent</span><b>{formatINR(total)}</b></div>
                  <div className="border-t border-black/10 pt-2 mt-1 flex justify-between"><span>Pay now (token 20%)</span><b>{formatINR(token)}</b></div>
                  <div className="flex justify-between text-[13px] text-black/55"><span>Balance on delivery</span><b>{formatINR(balance)}</b></div>
                  <div className="flex justify-between text-[13px] text-emerald-700 font-semibold"><span>Security deposit (delivery par, refundable)</span><b>{formatINR(deposit)}</b></div>
                  <p className="text-[11px] text-black/50">Deposit is 100% refunded via UPI/cash within 24h of return · Secure UPI/Card via Razorpay</p>
                </div>
                {err && <p className="text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}
                <button disabled={paying} onClick={payOnline} className="w-full bg-[#641629] text-white font-semibold rounded-full py-3.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2"><CreditCard size={15} /> {paying ? 'Processing…' : `Pay ${formatINR(token)} Token Online`}</button>
                <p className="text-[11px] text-black/45 text-center">UPI · Cards · Netbanking — secure via Razorpay</p>
                {!RAZORPAY_KEY_ID && <p className="text-[11px] text-black/45 text-center">Online payment is coming soon — please confirm with Pay on delivery for now.</p>}
                <button disabled={paying} onClick={confirmWithoutPayment} className="w-full border border-black/15 font-semibold rounded-full py-3 text-sm hover:bg-[#641629] hover:border-[#641629] hover:text-white transition flex items-center justify-center gap-2"><MessageCircle size={15} /> Confirm without payment →</button>
                <p className="text-[11px] text-black/45 text-center">By confirming you agree to our <a href="/terms" target="_blank" className="underline">Terms</a> &amp; <a href="/refunds" target="_blank" className="underline">Refund Policy</a></p>
                <p className="text-[11px] text-black/45 text-center flex items-center justify-center gap-1"><ShieldCheck size={12} /> Your details stay private · No spam calls</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
                  {rows.length === 0 && <p className="text-center text-black/50 py-16">Your list is empty.<br />Add a dress from the shop 👆</p>}
                  {rows.map((r) => (
                    <div key={`${r.id}-${r.size}-${r.plan}-${(r.addons ?? []).join('+')}-${r.single?.name ?? ''}`} className="flex gap-3 bg-white rounded-2xl p-2.5 border border-black/10">
                      <img src={r.single?.img ?? r.p.img} className="w-16 h-20 object-cover rounded-xl" alt={r.single?.name ?? r.p.name} />
                      <div className="flex-1 text-sm">
                        {r.single ? (
                          <>
                            <span className="inline-block text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">ACCESSORY ONLY</span>
                            <b className="text-[13px] leading-tight block mt-1">{r.single.name}</b>
                            <p className="text-[11px] text-black/55">{r.p.id} look · without dress • x{r.qty}</p>
                          </>
                        ) : (
                          <>
                            <b className="text-[13px] leading-tight block">{r.p.name}</b>
                            <p className="text-[11px] text-black/55">Size {r.size} • {r.plan === '3day' ? '3-day' : '9-day'} • x{r.qty}</p>
                          </>
                        )}
                        {!!r.addons?.length && <p className="text-[11px] text-emerald-700 font-medium">+ {r.addons.join(', ')}</p>}
                        <b className="text-[14px]">{formatINR(rowPrice(r) * r.qty)}</b>
                        {!r.single && <p className="text-[11px] text-emerald-700 font-semibold">+ {formatINR(r.p.deposit * r.qty)} security deposit (refundable)</p>}
                      </div>
                      <button onClick={() => remove(r.id, r.size, r.plan, r.addons, r.single?.name)} className="text-red-600 p-1"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-black/10 bg-white space-y-2.5">
                  <label className="block text-[11px] font-bold tracking-wide">PROMO CODE
                    <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="NAVRATRI20 / GROUP25 / FIRST10" className="mt-1 w-full border border-black/15 rounded-xl px-3 py-2 text-sm font-normal uppercase outline-none focus:border-black" />
                  </label>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Subtotal</span><b>{formatINR(subtotal)}</b></div>
                    <div className="flex justify-between text-emerald-700"><span>Discount</span><b>-{formatINR(disc)}</b></div>
                    <div className="flex justify-between text-[17px]"><span>Total rent</span><b>{formatINR(total)}</b></div>
                    <div className="flex justify-between text-emerald-700"><span>Security deposit</span><b>{formatINR(deposit)}</b></div>
                    <p className="text-[11px] text-black/50">Deposit is 100% refundable — returned via UPI/cash within 24h of return. It is paid separately on delivery, over and above the rent.</p>
                  </div>
                  <button disabled={rows.length === 0} onClick={() => setStep('details')} className="w-full bg-[#641629] text-white font-semibold rounded-full py-3.5 text-sm disabled:opacity-40 flex items-center justify-center gap-2"><ShoppingBasket size={15} /> Proceed to Checkout →</button>
                  <button onClick={clear} className="w-full text-xs text-black/50 underline">Clear list</button>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="fixed bottom-24 sm:bottom-5 left-1/2 -translate-x-1/2 z-[60] space-y-2 w-max max-w-[90vw]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="bg-[#3d0a18] text-white text-sm font-semibold rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-2">
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
      className="fixed bottom-20 right-4 sm:bottom-5 sm:right-5 z-40 w-14 h-14 grid place-items-center rounded-full bg-gradient-to-br from-[#d92b3f] to-[#641629] text-white shadow-2xl hover:scale-110 transition ring-1 ring-white/20" aria-label="Track your delivery"><MapPin size={24} /></a>
  );
}
