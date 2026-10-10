import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Check, CheckCircle2, CreditCard, Heart, Mail, MapPin, MessageCircle, Minus, Plus, ReceiptText, ShieldCheck, ShoppingBasket, Sparkles, Star, Trash2, Truck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { addonTotal, lookFor, photosFor, spinFramesFor, STORE, waLink, type Accessory, type Category } from '../data/products';
import { itemImgFor } from '../lib/items';
import { saveBooking } from '../lib/db';
import { formatINR, halfAdvance, isValidIndianPhone, makeOrderId } from '../lib/order';
import { useProducts } from '../lib/ProductsContext';
import { QRCodeSVG } from 'qrcode.react';
import { getSiteContent, useSiteVersion } from '../lib/siteContent';
import { isValidVpa, merchantUpi, upiUrl } from '../lib/upi';
import { clearMyOrders, getMyOrders, saveMyOrder, type MyOrder } from '../lib/myOrders';
import { getLocalBookings } from '../lib/localAdmin';
import { useStore } from '../store/useStore';
import SpinViewer from './SpinViewer';

export function QuickView() {
  const { products } = useProducts();
  const id = useStore((s) => s.quickView);
  const setQuickView = useStore((s) => s.setQuickView);
  const addToCart = useStore((s) => s.addToCart);
  const toggleWish = useStore((s) => s.toggleWish);
  const wishlist = useStore((s) => s.wishlist);
  const p = products.find((x) => x.id === id) ?? null;
  const [picked, setPicked] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [spin, setSpin] = useState(false);
  const [qty, setQty] = useState(1);
  useEffect(() => { setPicked([]); setPhotoIdx(0); setSpin(false); setQty(1); }, [id]);
  // Modal khula ho to background page lock — saara scroll card ke andar
  useEffect(() => {
    if (!p) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [p]);
  const look = useMemo(() => (p ? lookFor(p) : []), [p]);
  const photos = useMemo(() => (p ? photosFor(p) : []), [p]);
  const frames = useMemo(() => (p ? spinFramesFor(p) : []), [p]);
  const canSpin = frames.length > 1;
  const paidAddons = look.filter((a) => a.tag === 'addon');
  const pickedTotal = p ? addonTotal(p, picked) : 0;
  const soldOut = (p?.stock ?? 1) <= 0;
  const togglePick = (name: string) =>
    setPicked((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));
  const addDress = () => {
    if (!p || soldOut) return;
    addToCart(p.id, 'Free size', '1day', picked.length ? picked : undefined, undefined, qty);
    setQuickView(null);
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
                <img key={photos[photoIdx] ?? p.img} src={photos[photoIdx] ?? p.img} alt={p.name} className="w-full h-full object-cover" />
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
                    <img src={src} alt="" className="w-11 h-13 sm:w-14 sm:h-16 object-cover" />
                  </button>
                ))}
                <span className="self-center text-[10.5px] sm:text-[11px] text-black/45 font-medium ml-1">Tap to<br />switch angle</span>
              </div>
            )}
            </div>
            <div className="p-4 sm:p-5 min-h-0 md:max-h-[88vh] md:overflow-y-auto md:overscroll-contain">
              <button onClick={() => setQuickView(null)} aria-label="Close" className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full bg-black/[.06] backdrop-blur hover:bg-[#641629] hover:text-white transition z-[3]"><X size={16} /></button>
              <p className="text-[11px] font-bold tracking-[0.14em] text-neutral-400">{p.id} · {p.fabric.toUpperCase()}</p>
              <h3 className="premium-heading font-display font-black text-[22px] leading-tight mt-1.5 text-black">{p.name}</h3>
              <p className="text-[13px] text-neutral-500 mt-0.5">{p.hindi}</p>
              <div className="flex items-center gap-1.5 text-[13px] mt-2.5"><Star size={14} className="fill-[#c9960a] text-[#c9960a]" /><b>{p.rating}</b><span className="text-neutral-400">({p.reviews} reviews)</span></div>
              <p className="text-[13.5px] mt-3 leading-relaxed text-neutral-600">{p.desc}</p>
              {!!look.length && (
                <div className="mt-4 rounded-2xl border border-black/[.07] bg-[#fafafa] p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] text-black"><Sparkles size={13} className="text-[#c9a44a]" /> THE MODEL WORE THIS</p>
                  <p className="text-[11.5px] text-neutral-500 mt-0.5">The complete look is right here — nothing to search for.</p>
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
                    <p className="text-[11px] text-[#6f5b6a] mt-2">Tick = joins the dress · <b>Only this</b> = rent the item alone, without the dress.</p>
                  )}
                </div>
              )}
              <div className="mt-4">
                <p className="label-pro">Rental plan</p>
                <div className="mt-2 border border-[#641629] bg-[#faf7ef] rounded-2xl p-3"><b className="text-sm">1-day · ₹{p.rent1.toLocaleString('en-IN')}</b><p className="text-[11px] text-[#6f5b6a] mt-0.5">Single event + returns · same price for all days</p></div>
              </div>
              <div className="flex items-baseline gap-2 mt-3"><b className="font-display text-[22px]">₹{p.rent1.toLocaleString('en-IN')}</b><s className="text-[#8a7584] text-sm">₹{p.buy.toLocaleString('en-IN')}</s>{p.buy > p.rent1 && <span className="text-[11px] font-black text-white bg-emerald-600 rounded-full px-2 py-0.5">SAVE {Math.round((1 - p.rent1 / p.buy) * 100)}%</span>}</div>
              <p className="text-[11.5px] text-emerald-700 font-semibold mt-0.5">+ ₹{p.deposit.toLocaleString('en-IN')} fully refundable deposit</p>
              <div className="flex items-center justify-between mt-4 border border-black/10 rounded-2xl px-3.5 py-2.5">
                <span className="text-[12.5px] font-bold">Quantity <span className="block text-[11px] font-normal text-black/50">How many dresses do you need?</span></span>
                <span className="flex items-center gap-2">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="w-8 h-8 grid place-items-center rounded-full border border-black/15 hover:bg-black hover:text-white transition disabled:opacity-30"><Minus size={15} /></button>
                  <b className="w-6 text-center text-[15px] tabular-nums">{qty}</b>
                  <button onClick={() => setQty((q) => Math.min(10, q + 1))} disabled={qty >= 10} aria-label="Increase quantity" className="w-8 h-8 grid place-items-center rounded-full border border-black/15 hover:bg-black hover:text-white transition disabled:opacity-30"><Plus size={15} /></button>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={addDress} disabled={soldOut} className="btn-primary !py-3 !text-[13px] disabled:opacity-40"><ShoppingBasket size={15} /> {soldOut ? 'Out of stock' : <>Add {qty > 1 ? `${qty} ` : ''}to list{pickedTotal ? ` +₹${pickedTotal.toLocaleString('en-IN')}` : ''}</>}</button>
                <button onClick={() => toggleWish(p.id)} className="btn-outline-dark !py-3 !text-[13px]"><Heart size={15} className={wishlist.includes(p.id) ? 'fill-[#641629] text-[#641629]' : ''} /> Wishlist</button>
              </div>
              {soldOut && <p className="text-[12px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mt-2 text-center">This outfit is currently out of stock. Please check back soon or ask on WhatsApp.</p>}
              <a href={waLink(`Hi TheKissa.co! Is ${p.name} (${p.id}), free size, 1-day available?`)} target="_blank" className="mt-2 w-full inline-flex items-center justify-center gap-1.5 border border-[#641629]/15 rounded-full py-3 text-[13px] font-semibold hover:border-[#641629] transition"><MessageCircle size={15} /> Ask on WhatsApp</a>
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
  const [copied, setCopied] = useState(false);
  // Honeypot bot-trap — humans kabhi nahi bharte (off-screen field)
  const [company, setCompany] = useState('');
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'list' | 'orders'>('list');
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [order, setOrder] = useState<{ id: string; paymentId: string; mode: string; token: number; total: number; deposit: number; lines: string[] } | null>(null);
  const [payChoice, setPayChoice] = useState<'half' | 'full'>('full');

  const rowPrice = (r: { p: { rent1: number; category: Category; desc: string; accessories?: Accessory[] }; plan: '1day'; addons?: string[]; single?: { price: number } }) =>
    r.single ? r.single.price : (r.p.rent1 + addonTotal(r.p, r.addons));

  useEffect(() => {
    const refreshOrders = () => {
      const list = getMyOrders();
      // Admin ne decision / ready date di ho to booking record se lao (same device par turant dikhega)
      try {
        const byId = new Map(getLocalBookings().map((b) => [b.order_id, b]));
        list.forEach((o) => {
          const b = byId.get(o.id);
          if (!b) return;
          if (b.ready_date) (o as MyOrder).readyDate = b.ready_date;
          if (b.status) (o as MyOrder).status = b.status;
          if (b.admin_note) (o as MyOrder).note = b.admin_note;
        });
      } catch { /* ignore */ }
      setOrders(list);
    };
    refreshOrders();
    window.addEventListener('raasleela-orders-updated', refreshOrders);
    return () => window.removeEventListener('raasleela-orders-updated', refreshOrders);
  }, []);

  const rows = useMemo(() => cart.map((c) => ({ ...c, p: products.find((x) => x.id === c.id)! })).filter((r) => r.p), [cart, products]);
  const subtotal = rows.reduce((a, r) => a + rowPrice(r) * r.qty, 0);
  const deposit = rows.reduce((a, r) => a + (r.single ? 0 : r.p.deposit * r.qty), 0);
  const disc = 0;
  const total = subtotal - disc;
  const half = halfAdvance(total);
  const payAmount = payChoice === 'full' ? total : half;
  const balance = total - payAmount;

  const resetAndClose = () => {
    setOpen(false);
    setTimeout(() => { setStep('cart'); setOrder(null); setErr(''); setUtr(''); setPayChoice('full'); }, 400);
  };

  const validateDetails = () => {
    if (name.trim().length < 3) return 'Please enter your full name';
    if (!isValidIndianPhone(phone)) return 'Please enter a valid 10-digit mobile number';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address';
    if (!eventDate) return 'Please select the event date';
    if (!rows.length) return 'Your list is empty';
    return '';
  };

  const rowLabel = (r: { plan: '1day'; size: string; qty: number; addons?: string[] }) => {
    const base = `1-day · Free size x${r.qty}`;
    return r.addons?.length ? `${base} + ${r.addons.join(', ')}` : base;
  };

  // Website par order hamesha rahe — My Orders snapshot (confirm se pehle banao)
  const snapOrder = (orderId: string, token: number, mode: string) => saveMyOrder({
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
    })),
    total,
    deposit,
    token,
    mode,
  });

  const buildCustomerMsg = (o: { id: string; total: number; deposit: number }) =>
    `Your order has been placed successfully!\n\nOrder ID: ${o.id}\nName: ${name}\nEvent: ${eventDate || 'TBD'}\nTotal rent: ${formatINR(o.total)}\nDeposit (refundable): ${formatINR(o.deposit)}\n\nThank you for renting with TheKissa.co! Delivery updates will be shared with you on WhatsApp/SMS.`;

  const orderLines = () => rows.map((r, i) => r.single
    ? `${i + 1}. ${r.single.name} (accessory only — ${r.p.id} look) x${r.qty} = ${formatINR(r.single.price * r.qty)}`
    : `${i + 1}. ${r.p.name} (${r.p.id}) — ${rowLabel(r)} = ${formatINR(rowPrice(r) * r.qty)}`);

  // Store notification — ALWAYS goes to the client's number/email
  const buildStoreMsg = (o: { id: string; mode: string; token: number; total: number; deposit: number; lines: string[] }) =>
    `New order ${o.id} — TheKissa.co\n\n${(o.lines.length ? o.lines : ['(full item list in Admin → Bookings)']).join('\n')}\n\nName: ${name}\nMobile: ${phone}\nEvent: ${eventDate || 'TBD'}\nTotal rent: ${formatINR(o.total)}\n${o.mode === 'upi-qr-full' ? `Full payment: ${formatINR(o.token)} paid via QR` : o.mode === 'upi-qr-half' ? `Half payment: ${formatINR(o.token)} paid via QR, balance ${formatINR(o.total - o.token)} on delivery` : o.mode === 'upi-qr' ? `Token: ${formatINR(o.token)} paid via QR` : 'Token: Pay on delivery'}\nDeposit (refundable): ${formatINR(o.deposit)}`;

  const goQr = () => {
    const v = validateDetails();
    if (v) { setErr(v); return; }
    setErr('');
    const amt = payChoice === 'full' ? total : half;
    if (amt < 1) {
      setErr('Amount is below ₹1 — please contact store on WhatsApp.');
      return;
    }
    setStep('qr');
  };

  const upiId = merchantUpi();
  const upiLink = upiId && isValidVpa(upiId) ? upiUrl(upiId, getSiteContent().store.brand || 'TheKissa.co', payAmount, `Order ${payChoice === 'full' ? 'full payment' : 'half payment'} ${name.trim()}`) : '';

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
    if (!/^\d{12}$/.test(utr.trim()) && utr.trim() !== '') { setErr('The UTR is 12 digits — copy it from your UPI app after payment (or leave it empty).'); return; }
    setErr('');
    setPaying(true);
    const amt = payChoice === 'full' ? total : half;
    const mode = payChoice === 'full' ? 'upi-qr-full' : 'upi-qr-half';
    try {
      const orderId = makeOrderId();
      const ref = utr.trim();
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
        items: rows.map((r2) => ({ id: r2.p.id, name: r2.single ? `${r2.single.name} (accessory only)` : r2.p.name, size: r2.size, plan: r2.plan, qty: r2.qty, addons: r2.addons ?? [], single: r2.single ?? null })),
        subtotal,
        total,
        token_amount: amt,
        deposit,
        deposit_status: 'pending',
        payment_mode: mode,
        payment_id: ref,
        payment_status: 'unverified',
      });
      setOrder({ id: orderId, paymentId: ref, mode, token: amt, total, deposit, lines: orderLines() });
      setStep('done');
      snapOrder(orderId, amt, mode);
      clear();
      // QR payment par bhi store ko WhatsApp notice (block ho to done-step buttons se resend)
      try {
        window.open(waLink(`New order ${orderId} — TheKissa.co\n\nName: ${name.trim()}\nMobile: ${phone.trim()}\nEvent: ${eventDate || 'TBD'}\nTotal rent: ${formatINR(total)}\n${mode === 'upi-qr-full' ? `Full payment: ${formatINR(amt)} paid via QR` : `Half payment: ${formatINR(amt)} paid via QR, balance ${formatINR(total - amt)} on delivery`}${ref ? ` (UTR ${ref})` : ''}\nDeposit (refundable): ${formatINR(deposit)}`), '_blank');
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
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
              <div>
                <h3 className="font-semibold text-[17px] tracking-tight">Booking {step === 'cart' ? `(${cart.reduce((a, c) => a + c.qty, 0)})` : step === 'details' ? '— Details' : step === 'qr' ? '— QR Payment' : '— Confirmed'}</h3>
                <p className="text-[11px] text-black/50 mt-0.5">Step {step === 'cart' ? '1/3 List' : step === 'details' ? '2/3 Details' : step === 'qr' ? '3/3 QR Payment' : '3/3 Invoice'} · 100% Secure checkout</p>
              </div>
              <button onClick={resetAndClose} className="w-9 h-9 grid place-items-center rounded-full bg-black/5 hover:bg-[#641629] hover:text-white transition"><X size={16} /></button>
            </div>
            {step === 'cart' && (
              <div className="flex gap-1.5 px-4 pt-3">
                <button onClick={() => setTab('list')} className={`flex-1 rounded-full py-2 text-[12.5px] font-bold transition ${tab === 'list' ? 'bg-[#221114] text-white' : 'bg-black/5 text-black/60'}`}>Booking list ({cart.reduce((a, c) => a + c.qty, 0)})</button>
                <button onClick={() => setTab('orders')} className={`flex-1 rounded-full py-2 text-[12.5px] font-bold transition ${tab === 'orders' ? 'bg-[#221114] text-white' : 'bg-black/5 text-black/60'}`}>My Orders ({orders.length})</button>
              </div>
            )}

            {step === 'done' && order ? (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="text-center py-2">
                  <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
                  <h4 className="font-semibold text-xl mt-3">Order placed successfully!</h4>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">✓ Order confirmed</p>
                  <p className="text-sm text-black/55 mt-2">Order ID: <b className="text-black">{order.id}</b></p>
                </div>
                <div className="mt-4 border border-black/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-[#641629] text-white flex items-center gap-2 text-sm font-semibold"><ReceiptText size={15} /> Invoice</div>
                  <div className="p-4 text-sm space-y-1.5">
                    <div className="flex justify-between"><span className="text-black/55">Order ID</span><b>{order.id}</b></div>
                    <div className="flex justify-between"><span className="text-black/55">Name</span><b>{name}</b></div>
                    {address.trim() && <div className="flex justify-between gap-3"><span className="text-black/55 shrink-0">Delivery</span><b className="text-[12.5px] text-right">{address.trim()}</b></div>}
                    <div className="flex justify-between"><span className="text-black/55">Payment</span><b>{order.mode === 'upi-qr-full' ? `Full paid via QR ${formatINR(order.token)}` : order.mode === 'upi-qr-half' ? `Half paid via QR ${formatINR(order.token)} · Balance ${formatINR(order.total - order.token)} on delivery` : order.mode === 'upi-qr' ? `Token paid via QR ${formatINR(order.token)}` : 'Pay on delivery'}</b></div>
                    {order.paymentId && <div className="flex justify-between gap-3"><span className="text-black/55 shrink-0">Txn ID</span><b className="text-[12px] text-right break-all">{order.paymentId}</b></div>}
                    <div className="border-t border-black/10 my-2 pt-2 flex justify-between"><span>Total rent</span><b>{formatINR(order.total)}</b></div>
                    <div className="flex justify-between text-[13px] text-emerald-700 font-semibold"><span>Security deposit (on delivery, refundable)</span><b>{formatINR(order.deposit)}</b></div>
                    <p className="text-[11px] text-black/50 pt-1">Deposit is 100% refundable — returned via UPI/cash within 24h of return.</p>
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
                  <div className="flex justify-between text-[15px]"><span>Total rent</span><b>{formatINR(total)}</b></div>
                  <div className="flex justify-between text-[13px] text-emerald-700 font-semibold"><span>Security deposit (on delivery, refundable)</span><b>{formatINR(deposit)}</b></div>
                  <p className="text-[11px] text-black/50">Deposit is 100% refunded via UPI/cash within 24h of return · QR scan & pay via any UPI app</p>
                </div>
                <p className="text-xs font-bold">PAYMENT OPTION *</p>
                <div className="grid gap-2">
                  <button type="button" onClick={() => setPayChoice('full')} className={`text-left border rounded-2xl p-3.5 text-sm transition ${payChoice === 'full' ? 'border-[#641629] bg-[#faf7ef] ring-2 ring-[#641629]/20' : 'border-black/10 bg-white hover:border-black/30'}`}>
                    <span className="flex items-center gap-2 font-bold"><span className={`w-4 h-4 rounded-full border-2 grid place-items-center ${payChoice === 'full' ? 'border-[#641629]' : 'border-black/25'}`}>{payChoice === 'full' && <span className="w-2 h-2 rounded-full bg-[#641629]" />}</span> Full payment <span className="ml-auto text-[10px] font-bold bg-emerald-600 text-white rounded-full px-2 py-0.5">RECOMMENDED</span></span>
                    <span className="block text-[12.5px] mt-1">Pay now <b>{formatINR(total)}</b> full rent · Balance <b>₹0</b> on delivery</span>
                  </button>
                  <button type="button" onClick={() => setPayChoice('half')} className={`text-left border rounded-2xl p-3.5 text-sm transition ${payChoice === 'half' ? 'border-[#641629] bg-[#faf7ef] ring-2 ring-[#641629]/20' : 'border-black/10 bg-white hover:border-black/30'}`}>
                    <span className="flex items-center gap-2 font-bold"><span className={`w-4 h-4 rounded-full border-2 grid place-items-center ${payChoice === 'half' ? 'border-[#641629]' : 'border-black/25'}`}>{payChoice === 'half' && <span className="w-2 h-2 rounded-full bg-[#641629]" />}</span> Half payment <span className="ml-auto text-[10px] font-bold bg-black text-white rounded-full px-2 py-0.5">50% NOW</span></span>
                    <span className="block text-[12.5px] mt-1">Pay now <b>{formatINR(half)}</b> (50%) · Balance <b>{formatINR(total - half)}</b> on delivery</span>
                  </button>
                </div>
                {err && <p className="text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}
                <button disabled={paying} onClick={goQr} className="w-full bg-[#221114] text-white font-semibold rounded-full py-3.5 text-sm disabled:opacity-50 flex items-center justify-center gap-2"><CreditCard size={15} /> {paying ? 'Processing…' : `Pay ${formatINR(payAmount)} ${payChoice === 'full' ? 'Full' : 'Half'} via QR`}</button>
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
                      <p className="text-[11px] font-bold tracking-[0.14em]">SCAN & PAY {payChoice === 'full' ? 'FULL AMOUNT' : 'HALF AMOUNT'}</p>
                      <b className="font-display text-[32px] text-[#641629] leading-none mt-1 block">{formatINR(payAmount)}</b>
                      {payChoice === 'full'
                        ? <p className="text-[11.5px] text-emerald-700 font-semibold mt-1">Full rent — no balance due on delivery</p>
                        : <p className="text-[11.5px] text-black/55 mt-1">Half payment (50%) — balance {formatINR(balance)} due on delivery</p>}
                      <div className="mx-auto mt-3 w-fit bg-white p-3 rounded-2xl border border-black/10">
                        <QRCodeSVG value={upiLink} size={200} />
                      </div>
                      <p className="text-[11.5px] text-black/55 mt-2">GPay · PhonePe · Paytm · BHIM — scan with any UPI app</p>
                      <button onClick={copyUpi} className="mt-2 text-[12.5px] font-bold border border-black/15 rounded-full px-4 py-2 hover:bg-black hover:text-white transition">
                        {copied ? 'Copied ✓' : `Copy UPI ID: ${upiId}`}
                      </button>
                      <a href={upiLink} className="block mt-2 text-[12.5px] font-bold text-[#641629] underline">Open in UPI app →</a>
                    </div>
                    <label className="block text-[11px] font-bold tracking-wide">UTR / TRANSACTION ID (12 digits, you get it after payment)
                      <input value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="Optional — can be left empty" inputMode="numeric" className="mt-1 w-full border border-black/15 rounded-xl px-3.5 py-2.5 text-sm font-normal outline-none focus:border-black" />
                    </label>
                    {err && <p className="text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}
                    <button disabled={paying} onClick={confirmQrPaid} className="w-full bg-[#221114] text-white font-semibold rounded-full py-3.5 text-sm disabled:opacity-50">I have paid {formatINR(payAmount)} — Confirm order</button>
                    <p className="text-[11px] text-black/45 text-center">🔒 100% safe — payment goes directly to the store account.</p>
                  </>
                )}
              </div>
            ) : tab === 'orders' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">
                  {orders.length === 0 && <p className="text-center text-black/50 py-16">No orders yet on this device.<br />Your confirmed orders will appear here.</p>}
                  {orders.map((o) => (
                    <div key={o.id} className="bg-white rounded-2xl p-3.5 border border-black/10">
                      <div className="flex items-center gap-2">
                        <b className="text-[13.5px]">{o.id}</b>
                        <span className="ml-auto text-[11px] text-black/50">{new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {o.items.map((it, i) => (
                          <div key={i} className="flex justify-between gap-2 text-[12px]">
                            <span className="text-black/70 min-w-0">{it.name} x{it.qty}<span className="block text-[10.5px] text-black/45">{it.detail}</span></span>
                            <b className="shrink-0">{formatINR(it.price)}</b>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-black/10 mt-2 pt-2 flex justify-between text-[13px]"><span>Total rent</span><b>{formatINR(o.total)}</b></div>
                      <p className="text-[11px] text-black/55 mt-0.5">{o.mode === 'upi-qr-full' ? `Full ${formatINR(o.token)} paid via QR` : o.mode === 'upi-qr-half' ? `Half ${formatINR(o.token)} paid via QR · Balance ${formatINR(o.total - o.token)} on delivery` : o.mode === 'upi-qr' ? `Token ${formatINR(o.token)} paid via QR` : 'Pay on delivery'} · Deposit {formatINR(o.deposit)} (refundable)</p>
                      <span className={`inline-block mt-1 text-[10.5px] font-bold rounded-full px-2 py-0.5 border ${o.status === 'cancelled' ? 'text-rose-800 bg-rose-50 border-rose-200' : o.status === 'delivered' || o.status === 'returned' ? 'text-violet-800 bg-violet-50 border-violet-200' : 'text-emerald-800 bg-emerald-50 border-emerald-200'}`}>
                        {o.status === 'cancelled' ? '✕ Not available' : o.status === 'delivered' ? '✓ Delivered' : o.status === 'returned' ? '✓ Returned' : o.status === 'confirmed' ? '✓ Confirmed — will be delivered' : '✓ Order confirmed'}
                      </span>
                      {o.readyDate && <span className="inline-block mt-1 ml-1.5 text-[10.5px] font-bold text-[#641629] bg-[#faf3ea] border border-[#c9a44a]/50 rounded-full px-2 py-0.5">📦 Available by {new Date(o.readyDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {o.note && <p className="text-[12px] mt-1.5 bg-[#faf7ef] border border-[#c9a44a]/40 rounded-xl px-3 py-2"><b>Store message:</b> {o.note}</p>}
                      <a href={waLink(`Hi TheKissa.co! Reorder ${o.id} — same items please. Name: ${o.name}, Mobile: ${o.phone}`)} target="_blank" className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 bg-[#25d366] text-white text-[12.5px] font-bold rounded-full py-2.5"><MessageCircle size={14} /> Reorder on WhatsApp</a>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-black/10 bg-white">
                  <p className="text-[11px] text-black/50 text-center">Orders stay saved on this device.</p>
                  {orders.length > 0 && <button onClick={() => { clearMyOrders(); setOrders([]); }} className="w-full text-xs text-black/50 underline mt-1">Clear history</button>}
                </div>
              </>
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
                            <p className="text-[11px] text-black/55">Free size • 1-day • x{r.qty}</p>
                          </>
                        )}
                        {!!r.addons?.length && <p className="text-[11px] text-emerald-700 font-medium">+ {r.addons.join(', ')}</p>}
                        <b className="text-[14px]">{formatINR(rowPrice(r) * r.qty)}</b>
                        {!r.single && <p className="text-[11px] text-emerald-700 font-semibold">+ {formatINR(r.p.deposit * r.qty)} security deposit (refundable)</p>}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] font-bold text-black/55">Qty:</span>
                          <span className="flex items-center gap-1.5 border border-black/10 rounded-full px-1 py-0.5">
                            <button onClick={() => setQty(r.id, r.size, r.plan, r.addons, r.single?.name, r.qty - 1)} disabled={r.qty <= 1} aria-label="Decrease quantity" className="w-6 h-6 grid place-items-center rounded-full hover:bg-black hover:text-white transition disabled:opacity-30"><Minus size={13} /></button>
                            <b className="w-5 text-center text-[13px] tabular-nums">{r.qty}</b>
                            <button onClick={() => setQty(r.id, r.size, r.plan, r.addons, r.single?.name, r.qty + 1)} disabled={r.qty >= 10} aria-label="Increase quantity" className="w-6 h-6 grid place-items-center rounded-full hover:bg-black hover:text-white transition disabled:opacity-30"><Plus size={13} /></button>
                          </span>
                        </div>
                      </div>
                      <button onClick={() => remove(r.id, r.size, r.plan, r.addons, r.single?.name)} className="text-red-600 p-1"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-black/10 bg-white space-y-2.5">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span>Subtotal</span><b>{formatINR(subtotal)}</b></div>
                    <div className="flex justify-between text-[17px]"><span>Total rent</span><b>{formatINR(total)}</b></div>
                    <div className="flex justify-between text-emerald-700"><span>Security deposit</span><b>{formatINR(deposit)}</b></div>
                    <p className="text-[11px] text-black/50">Deposit is 100% refundable — returned via UPI/cash within 24h of return. It is paid separately on delivery, over and above the rent.</p>
                  </div>
                  <button disabled={rows.length === 0} onClick={() => setStep('details')} className="w-full bg-[#221114] text-white font-semibold rounded-full py-3.5 text-sm disabled:opacity-40 flex items-center justify-center gap-2"><ShoppingBasket size={15} /> Proceed to Checkout →</button>
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
      className="fixed bottom-20 right-4 sm:bottom-5 sm:right-5 z-40 w-14 h-14 grid place-items-center rounded-full bg-[#221114] text-white shadow-2xl hover:scale-110 transition ring-1 ring-white/20" aria-label="Track your delivery"><MapPin size={24} /></a>
  );
}
