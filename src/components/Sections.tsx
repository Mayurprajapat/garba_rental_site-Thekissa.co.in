import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock, Mail, MapPin, Navigation, Quote, Ruler, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { waLink } from '../data/products';
import { STORE } from '../data/store';
import { saveBooking } from '../lib/db';

export function FeatureBanner() {
  const items = [
    { icon: Sparkles, t: 'Dry-cleaned & Sanitized' },
    { icon: ShieldCheck, t: '100% Refundable Security Deposit' },
    { icon: Navigation, t: 'Live Availability Tracking' },
  ];
  return (
    <div className="bg-[#faf8f6]">
      <div className="container-x pt-4">
        <div className="mandala-bg bg-gradient-to-r from-[#2b070e] via-[#641629] to-[#2b070e] border border-[#c9a44a]/50 rounded-b-2xl rounded-t-lg shadow-[0_18px_40px_-24px_rgba(100,22,41,.7)]">
          <div className="flex items-center justify-center gap-4 sm:gap-10 overflow-x-auto no-scrollbar whitespace-nowrap px-4 py-3">
            {items.map((it) => (
              <span key={it.t} className="flex items-center gap-2 shrink-0 text-[12px] sm:text-[13px] font-semibold text-[#f7ead0]">
                <it.icon size={15} className="text-[#e8c66a] shrink-0" />{it.t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Process() {
  const steps = [
    ['01', 'Pick your look', 'Browse the collection or WhatsApp us your size and colour.'],
    ['02', 'Confirm & delivery', 'Lock with a small token. Same-day delivery or store pickup.'],
  ];
  return (
    <section id="process" className="container-x py-7">
      <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-4">
        <h2 className="premium-heading font-display font-black text-xl sm:text-2xl">Renting in 2 quick steps</h2>
        <a href="#book" className="text-[13px] font-semibold text-[#c9273a] underline underline-offset-2 sm:ml-auto shrink-0">Book now →</a>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {steps.map(([n, h, p], i) => (
          <motion.div key={h} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
            className="card p-3.5">
            <span className="font-display font-black text-[12px] tracking-[0.18em] text-[#b8860b]">{n}</span>
            <h3 className="font-semibold text-[13.5px] mt-1">{h}</h3>
            <p className="text-[12px] text-[#6f5b6a] mt-1 leading-relaxed">{p}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Looks() {
  const imgs = [
    '/images/g-hero.webp', '/images/g-combo2.jpg',
    '/images/g-girls2.jpg', '/images/g-koti.webp',
    '/images/g-kids1.webp', '/images/g-chaniya1.jpg',
  ];
  return (
    <section id="looks" className="container-x py-7">
      <p className="eyebrow text-center">Customer looks</p>
      <h2 className="premium-heading font-display font-black text-xl sm:text-2xl text-center mt-1.5">Worn last Navratri</h2>
      <div className="flex gap-2.5 mt-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-4 px-4">
        {imgs.map((src, i) => (
          <motion.img key={src} src={src} alt={`Customer garba look ${i + 1}`} loading="lazy"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            className="rounded-2xl h-36 sm:h-44 w-auto shrink-0 snap-start object-cover card-shadow" />
        ))}
      </div>
      <p className="text-center text-[11px] text-[#8a7584] mt-2.5">Swipe → to see more looks</p>
    </section>
  );
}

export function Testimonials() {
  const data = [
    ['The mirror-work chaniya fit perfectly — fresh and crisp. Size exchange at my doorstep, zero tension.', 'Priya S. · Vijay Nagar'],
    ['The kediyu arrived in the same shade, delivered on time. Fully online, yet personal attention on every order.', 'Amit P. · Palasia'],
    ['My child was comfortable in the dress, and the return was picked up from our doorstep.', 'Kinjal M. · Rajwada'],
  ];
  const [idx, setIdx] = useState(0);
  return (
    <section className="bg-gradient-to-b from-[#fafafa] to-white border-y border-black/[.07]">
      <div className="max-w-3xl mx-auto px-4 py-7 text-center">
        <h2 className="premium-heading font-display font-black text-xl sm:text-2xl mt-1">Loved by local families</h2>
        <div className="relative mt-4 min-h-[130px]">
          <AnimatePresence mode="wait">
            <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="card p-5 sm:p-6 card-shadow">
              <Quote size={20} className="mx-auto text-black/25" />
              <p className="mt-3 text-[15px] leading-relaxed text-[#3d2b36]">“{data[idx][0]}”</p>
              <b className="block mt-4 text-[13px]">— {data[idx][1]} · ★★★★★</b>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {data.map((_, i) => (
            <button key={i} aria-label={`Review ${i + 1}`} onClick={() => setIdx(i)} className={`h-2 rounded-full transition-all ${i === idx ? 'w-8 bg-[#1a0f1e]' : 'w-2 bg-[#1a0f1e]/20'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  const faqs: [string, string][] = [
    ['How long is the rental period?', 'Standard rental is 3 days — event day plus pickup and return. The full-Navratri plan covers 9 days with three outfits.'],
    ['What if the size doesn’t fit?', 'We keep large sizes in stock — get the fitting done from us, and we also provide pins for minor adjustments. Share your size on email or WhatsApp and we confirm fit before dispatch — a wrong size gets exchanged at your doorstep.'],
    ['Is the deposit refundable?', 'Yes, 100%. Refunded via UPI/cash within 24 hours of return and quality check. Normal wear is never charged.'],
    ['What about stains or minor damage?', 'Light dry-cleanable stains are on us. Major damage is charged at repair cost only — optional ₹199 damage cover removes the worry.'],
    ['Where do you deliver?', '1-2 hours delivery in Indore. Free delivery on bulk orders.'],
    ['Can I buy instead of renting?', 'Yes — every design is available for purchase at roughly 2.5× the rental price. Message “BUY” with the product ID on WhatsApp.'],
  ];
  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 py-7">
      <h2 className="premium-heading font-display font-black text-xl sm:text-2xl text-center">Frequently asked questions</h2>
      <div className="mt-4 space-y-2">
        {faqs.map(([q, a], i) => (
          <div key={q} className={`card overflow-hidden ${open === i ? 'card-shadow' : ''}`}>
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-3 px-5 py-4 font-semibold text-left text-[14.5px]">
              {q}<ChevronDown size={17} className={`shrink-0 text-[#8a7584] transition ${open === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>{open === i && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <p className="px-5 pb-5 text-sm text-[#6f5b6a] leading-relaxed">{a}</p>
              </motion.div>
            )}</AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Booking() {
  const [f, setF] = useState({ name: '', phone: '', cat: 'Women Chaniya Choli', size: 'M (36)', date: '', days: '3 days (standard)', note: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveBooking({
      name: f.name, phone: f.phone, category: f.cat, size: f.size,
      event_date: f.date || null, plan: f.days, note: f.note,
      items: [], subtotal: 0, total: 0,
    });
    setSaving(false);
    setDone(true);
    const subject = `New Booking — ${f.name} (${f.date || 'date TBD'})`;
    const body = `Hi The Kissa! New booking:\nName: ${f.name}\nMobile: ${f.phone}\nCategory: ${f.cat}\nSize: ${f.size}\nEvent: ${f.date}\nPlan: ${f.days}\nNote: ${f.note}`;
    window.location.href = `mailto:${STORE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  return (
    <section id="book" className="container-x pb-8">
      <div className="grid lg:grid-cols-[1fr_1.05fr] gap-0 card overflow-hidden card-shadow">
        <div className="bg-gradient-to-br from-[#641629] via-[#4d0f1f] to-[#2b070e] text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-bandhani opacity-10" />
          <div className="relative">
            <p className="eyebrow eyebrow-light">Instant booking</p>
            <h2 className="premium-heading font-display font-black text-2xl sm:text-[30px] mt-2 leading-tight">Reserve your outfit in two minutes</h2>
            <p className="text-white/60 text-[13px] mt-2 leading-relaxed">Fill the form — it opens your email app with everything pre-written. Send it and your outfit enquiry is locked.</p>
            <ul className="text-[13px] mt-4 space-y-2">
              {[['Ruler', 'Presize available'], ['Clock', 'Same-day slots in Indore'], ['ShieldCheck', 'Refundable deposit, no hidden fees']].map(([icon, t]) => (
                <li key={t} className="flex items-center gap-2.5 text-white/75">
                  {icon === 'Ruler' ? <Ruler size={15} className="text-[#e8c66a]" /> : icon === 'Clock' ? <Clock size={15} className="text-[#e8c66a]" /> : <ShieldCheck size={15} className="text-[#e8c66a]" />}{t}
                </li>
              ))}
            </ul>
            <div className="mt-5 bg-white/[.05] ring-1 ring-white/10 backdrop-blur rounded-2xl p-4 text-[13px] leading-relaxed">
              <b className="flex items-center gap-1.5"><Mail size={14} className="text-[#e8c66a]" /> 100% online — no shop visit</b>
              <p className="text-white/65 mt-1">Doorstep delivery & pickup across Indore<br />{STORE.hoursShort} · <a href={STORE.phoneHref} className="text-white underline">{STORE.phoneShort}</a> · {STORE.email}</p>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="bg-white p-5 sm:p-6 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3 [&>*]:min-w-0">
            <label className="label-pro">Full name *<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Priya Sharma" className="input-pro mt-1.5 normal-case tracking-normal" /></label>
            <label className="label-pro">Mobile *<input required pattern="[0-9]{10}" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="10-digit mobile" className="input-pro mt-1.5" /></label>
          </div>
          <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
            <label className="label-pro">Category<select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })} className="input-pro mt-1.5 font-normal">{['Women Chaniya Choli', 'Men Kediyu', 'Kids', 'Couple Combo', 'Premium Bridal'].map((o) => <option key={o}>{o}</option>)}</select></label>
            <label className="label-pro">Size<select value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })} className="input-pro mt-1.5 font-normal">{['S (34)', 'M (36)', 'L (38)', 'XL (40)', 'XXL (42)', 'Kids — age in note'].map((o) => <option key={o}>{o}</option>)}</select></label>
          </div>
          <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
            <label className="label-pro">Event date *<input type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="input-pro mt-1.5" /></label>
            <label className="label-pro">Plan<select value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} className="input-pro mt-1.5 font-normal">{['3 days (standard)', 'Full Navratri (9 days)', '1 day only'].map((o) => <option key={o}>{o}</option>)}</select></label>
          </div>
          <label className="label-pro block">Notes<input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Preferred colour, product ID e.g. RL-04" className="input-pro mt-1.5" /></label>
          <button className="btn-primary w-full !py-3.5"><Mail size={15} /> {saving ? 'Reserving…' : done ? 'Reserved — send the email' : 'Confirm on Email'} </button>
          <p className="text-[11px] text-[#8a7584] text-center flex items-center justify-center gap-1.5"><Sparkles size={12} /> No advance needed to enquire · Reply within 30 minutes, 10 AM–9 PM</p>
        </form>
      </div>
    </section>
  );
}

export function MobileBar() {
  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-black/10 px-4 pt-2.5" style={{ paddingBottom: 'calc(0.65rem + env(safe-area-inset-bottom))' }}>
      <div className="grid grid-cols-2 gap-2.5">
        <a href="#shop" className="bg-[#641629] text-white text-center font-semibold text-[13.5px] rounded-full py-3">View dresses</a>
        <a href={waLink('Hi! I want to rent a Garba dress')} target="_blank" className="bg-[#25d366] text-white text-center font-semibold text-[13.5px] rounded-full py-3">WhatsApp us</a>
      </div>
    </div>
  );
}

export function Footer() {  return (
    <footer id="contact" className="bg-gradient-to-b from-[#3d0a1a] to-[#1c0409] text-white/70 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#c9a44a]/60 to-transparent" />
      <div aria-hidden className="pointer-events-none select-none absolute -bottom-6 left-1/2 -translate-x-1/2 font-display font-black whitespace-nowrap leading-none text-[24vw] sm:text-[13rem] text-white/[.035]">The Kissa</div>
      <div className="container-x py-7 grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl grid place-items-center font-display font-black text-lg bg-white text-[#0c0a0f] ring-1 ring-white/10">K</span>
            <span><b className="font-display text-xl text-white block">The Kissa</b><small className="text-[10px] tracking-[0.22em] text-white/40">GARBA RENTAL</small></span>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-white/55">Designer Garba outfits on rent — perfect fitting, doorstep delivery, easy return.</p>
          <p className="mt-4 text-[13px]">📞 <a href={STORE.phoneHref} className="text-white font-semibold">{STORE.phoneDisplay}</a><br />
            💬 <a href={waLink('Hi The Kissa!')} target="_blank" className="text-white font-semibold">WhatsApp us</a><br />✉️ {STORE.email}</p>
        </div>
        <div><h4 className="text-white font-semibold mb-4 text-[13px] tracking-wide">SHOP</h4><div className="space-y-2.5 flex flex-col text-[13.5px]">{[['Women Chaniya Choli', '/#shop'], ['Men Kediyu', '/#shop'], ['Kids Garba', '/#shop'], ['Couple Combo', '/#shop']].map(([l, h]) => <a key={l as string} href={h as string} className="hover:text-white w-fit">{l as string}</a>)}</div></div>
        <div><h4 className="text-white font-semibold mb-4 text-[13px] tracking-wide">SUPPORT</h4><div className="space-y-2.5 flex flex-col text-[13.5px]">{[['How it works', '/#process'], ['FAQs', '/#faq'], ['Track delivery', '/track'], ['Book now', '/#book'], ['About us', '/about'], ['Contact us', '/contact']].map(([l, h]) => <a key={l as string} href={h as string} className="hover:text-white w-fit">{l as string}</a>)}</div></div>
        <div><h4 className="text-white font-semibold mb-4 text-[13px] tracking-wide flex items-center gap-1.5"><MapPin size={14} /> DELIVERY</h4><p className="text-[13px] leading-relaxed">Online only — no walk-in store<br />Doorstep delivery & pickup<br /><br />{STORE.hours}</p>
          <a href="/track" className="inline-flex items-center gap-1.5 mt-4 bg-white text-[#641629] font-semibold rounded-full px-4 py-2.5 text-xs hover:bg-[#e8c66a] hover:text-[#3d0a1a] transition">Track your delivery →</a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-5 flex flex-col sm:flex-row items-center gap-2 text-[11.5px] text-white/40">
          <p>© 2026 The Kissa Garba Rental. All rights reserved.</p>
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:ml-auto">
            <a href="/terms" className="hover:text-white underline underline-offset-2">Terms &amp; Conditions</a>
            <a href="/privacy" className="hover:text-white underline underline-offset-2">Privacy Policy</a>
            <a href="/refunds" className="hover:text-white underline underline-offset-2">Refunds &amp; Cancellation</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
