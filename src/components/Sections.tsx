import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, MapPin, Navigation, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { waLink } from '../data/products';
import { STORE } from '../data/store';
import { getSiteContent, DEFAULT_CONTENT, useSiteVersion } from '../lib/siteContent';
import Logo from './Logo';

/** Marigold toran — festive bunting strip. Pure CSS/static, no logic. */
const TORAN_BLOOMS: { bg: string; w: number; h: number }[] = [
  { bg: 'radial-gradient(circle at 35% 30%, #fef3c7, #fbbf24 45%, #b45309)', w: 13, h: 13 },
  { bg: 'radial-gradient(circle at 35% 30%, #bbf7d0, #22c55e 55%, #15803d)', w: 9, h: 13 },
  { bg: 'radial-gradient(circle at 35% 30%, #ffedd5, #fb923c 45%, #9a3412)', w: 12, h: 12 },
  { bg: 'radial-gradient(circle at 35% 30%, #fef9c3, #fde047 45%, #a16207)', w: 13, h: 13 },
  { bg: 'radial-gradient(circle at 35% 30%, #fecaca, #ef4444 50%, #7f1d1d)', w: 10, h: 10 },
  { bg: 'radial-gradient(circle at 35% 30%, #bbf7d0, #22c55e 55%, #15803d)', w: 9, h: 13 },
];
const TORAN_DROPS = [10, 18, 13, 22, 15, 20, 12, 24];

export function ToranDivider() {
  return (
    <div aria-hidden className="bg-[#faf8f6] overflow-hidden select-none">
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#c9a44a]/80 to-transparent" />
      <div className="flex items-start justify-around max-w-6xl mx-auto px-1">
        {Array.from({ length: 30 }).map((_, i) => {
          const b = TORAN_BLOOMS[i % TORAN_BLOOMS.length];
          return (
            <span key={i} className="flex flex-col items-center shrink-0">
              <span className="w-px bg-[#c9a44a]/70" style={{ height: TORAN_DROPS[i % TORAN_DROPS.length] }} />
              <span className="toran-bloom" style={{ background: b.bg, width: b.w, height: b.h }} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function FeatureBanner() {
  useSiteVersion();
  const icons = [Sparkles, ShieldCheck, Navigation];
  const items = getSiteContent().features.map((t, i) => ({ icon: icons[i % icons.length], t }));
  return (
    <div className="bg-[#faf8f6]">
      <div className="container-x pt-3">
        <div className="bg-gradient-to-b from-[#fffdf9] to-[#faf3e3] border border-[#c9a44a]/40 rounded-b-2xl rounded-t-lg shadow-[0_18px_40px_-24px_rgba(60,30,40,.3)]">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:gap-x-10 px-4 py-2">
            {items.map((it) => (
              <span key={it.t} className="flex items-center gap-2 text-[12px] sm:text-[13px] font-bold text-[#3d0a1a]">
                <it.icon size={15} className="text-[#8a6d1f] shrink-0" />{it.t}
              </span>
            ))}
          </div>
          <div aria-hidden className="h-px bg-gradient-to-r from-transparent via-[#c9a44a]/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}

export function Process() {
  useSiteVersion();
  const proc = getSiteContent().process;
  return (
    <section id="process" className="bg-[#F6EFE3] border-y border-[#c9a44a]/25">
      <div className="container-x py-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-4">
        <h2 className="premium-heading font-display font-black text-lg sm:text-xl">{proc.title}</h2>
        <a href="#shop" className="text-[13px] font-semibold text-[#641629] underline underline-offset-2 decoration-[#c9a44a] sm:ml-auto shrink-0">Book now →</a>
      </div>
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5 mt-3">
        {proc.steps.map((s, i) => (
          <motion.div key={`${s.n}-${i}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
            className="card card-hover p-3.5 relative overflow-hidden">
            <span className="chip-gold !text-[10px] !tracking-[0.18em]">{s.n}</span>
            <h3 className="font-semibold text-[13.5px] mt-2">{s.h}</h3>
            <p className="text-[12px] text-[#6f5b6a] mt-1 leading-relaxed">{s.p}</p>
          </motion.div>
        ))}
      </div>
      </div>
    </section>
  );
}

export function Looks() {
  useSiteVersion();
  const looks = getSiteContent().looks;
  const imgs = looks.imgs.length ? looks.imgs : DEFAULT_CONTENT.looks.imgs;
  // Tap-to-zoom — customer photo tap kare to badi dikhe
  const [zoom, setZoom] = useState<number | null>(null);
  useEffect(() => {
    if (zoom === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null);
      else if (e.key === 'ArrowRight') setZoom((z) => (z === null ? z : (z + 1) % imgs.length));
      else if (e.key === 'ArrowLeft') setZoom((z) => (z === null ? z : (z - 1 + imgs.length) % imgs.length));
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [zoom === null, imgs.length]);
  return (
    <section id="looks" className="container-x py-5">
      <p className="eyebrow text-center">{looks.subtitle}</p>
      <h2 className="premium-heading font-display font-black text-lg sm:text-xl text-center mt-1.5">{looks.title}</h2>
      <div className="flex gap-2.5 mt-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-4 px-4">
        {imgs.map((src, i) => (
          <motion.button key={src} type="button" onClick={() => setZoom(i)} title="Tap to view full photo"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            className="shrink-0 snap-start rounded-2xl ring-1 ring-[#c9a44a]/30 hover:ring-[#c9a44a]/70 hover:scale-[1.03] transition overflow-hidden card-shadow relative group p-0 bg-transparent">
            <img src={src} alt={`Customer garba look ${i + 1}`} loading="lazy"
              className="h-28 sm:h-36 w-auto object-cover block pointer-events-none" draggable={false} />
            <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition">⤢ Badi dekho</span>
          </motion.button>
        ))}
      </div>
      <p className="text-center text-[11px] text-[#6f5b6a] mt-2">{looks.note} · Tap any photo to zoom</p>
      {/* Full-view lightbox */}
      <AnimatePresence>
        {zoom !== null && imgs[zoom] && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setZoom(null)} />
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }} transition={{ duration: 0.22 }}
              className="relative bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl">
              <img key={imgs[zoom]} src={imgs[zoom]} alt={`Customer garba look ${zoom + 1} — full view`} className="w-full max-h-[72vh] object-contain bg-black" />
              <div className="flex items-center gap-2 p-3">
                <button onClick={() => setZoom((zoom - 1 + imgs.length) % imgs.length)} aria-label="Previous photo" className="w-9 h-9 grid place-items-center rounded-full bg-black/5 hover:bg-[#641629] hover:text-white transition shrink-0"><ChevronLeft size={16} /></button>
                <b className="text-[13px] flex-1 text-center tabular-nums">{zoom + 1} / {imgs.length}</b>
                <button onClick={() => setZoom((zoom + 1) % imgs.length)} aria-label="Next photo" className="w-9 h-9 grid place-items-center rounded-full bg-black/5 hover:bg-[#641629] hover:text-white transition shrink-0"><ChevronRight size={16} /></button>
                <button onClick={() => setZoom(null)} aria-label="Close photo" className="w-9 h-9 grid place-items-center rounded-full bg-black text-white hover:bg-[#641629] transition shrink-0"><X size={15} /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  useSiteVersion();
  const faqs = getSiteContent().faqs;
  return (
    <section id="faq" className="cv-auto bg-[#F4EBDD] border-y border-[#4d0f1f]/10">
      <div className="max-w-3xl mx-auto px-4 py-5">
      <h2 className="premium-heading font-display font-black text-lg sm:text-xl text-center">Frequently asked questions</h2>
      <div className="mt-3 space-y-2">
        {faqs.map((f, i) => (
          <div key={`${i}-${f.q}`} className={`card overflow-hidden transition ${open === i ? 'card-shadow border-[#c9a44a]/60 ring-1 ring-[#c9a44a]/30' : ''}`}>
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3 font-semibold text-left text-[14px]">
              {f.q}<ChevronDown size={17} className={`shrink-0 text-[#8a7584] transition ${open === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>{open === i && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <p className="px-4 pb-4 text-sm text-[#6f5b6a] leading-relaxed">{f.a}</p>
              </motion.div>
            )}</AnimatePresence>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

export function MobileBar() {
  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-black/10 px-4 pt-2.5" style={{ paddingBottom: 'calc(0.65rem + env(safe-area-inset-bottom))' }}>
      <div className="grid grid-cols-2 gap-2.5">
        <a href="#shop" className="bg-[#221114] text-white text-center font-semibold text-[13.5px] rounded-full py-3">View dresses</a>
        <a href={waLink('Hi! I want to rent a Garba dress')} target="_blank" className="bg-[#25d366] text-white text-center font-semibold text-[13.5px] rounded-full py-3">WhatsApp us</a>
      </div>
    </div>
  );
}

export function Footer() {
  useSiteVersion();
  const foot = getSiteContent().footer;
  return (
    <footer id="contact" className="cv-auto bg-gradient-to-b from-[#2b070e] via-[#25060d] to-[#160309] text-white/70 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#c9a44a]/70 to-transparent" />
      <div aria-hidden className="pointer-events-none select-none absolute -bottom-6 left-1/2 -translate-x-1/2 font-display font-black whitespace-nowrap leading-none text-[20vw] sm:text-[10rem] text-white/[.035]">TheKissa.co</div>
      <div className="container-x py-5 grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="w-10 h-10" />
            <span><b className="font-display text-xl text-white block">TheKissa.co</b><small className="text-[10px] tracking-[0.22em] text-white/40">GARBA RENTAL</small></span>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-white/55">{foot.about}</p>
          <p className="mt-4 text-[13px]">📞 <a href={STORE.phoneHref} className="text-white font-semibold">{STORE.phoneDisplay}</a><br />
            💬 <a href={waLink('Hi TheKissa.co!')} target="_blank" className="text-white font-semibold">WhatsApp us</a><br />✉️ <span className="break-all">{STORE.email}</span></p>
        </div>
        <div><h4 className="text-[#e8c66a] font-semibold mb-4 text-[13px] tracking-[0.14em]">SHOP</h4><div className="space-y-2.5 flex flex-col text-[13.5px]">{[['Women Chaniya Choli', '#shop'], ['Ghaghra & Lehenga', '#shop'], ['Premium Bridal', '#shop'], ['Jewellery', '#shop']].map(([l, h]) => <a key={l as string} href={h as string} className="hover:text-white w-fit">{l as string}</a>)}</div></div>
        <div><h4 className="text-[#e8c66a] font-semibold mb-4 text-[13px] tracking-[0.14em]">SUPPORT</h4><div className="space-y-2.5 flex flex-col text-[13.5px]">{[['How it works', '#process'], ['FAQs', '#faq'], ['Track delivery', '/track'], ['Book now', '#shop'], ['About us', '/about'], ['Contact us', '/contact']].map(([l, h]) => <a key={l as string} href={h as string} className="hover:text-white w-fit">{l as string}</a>)}</div></div>
        <div><h4 className="text-[#e8c66a] font-semibold mb-4 text-[13px] tracking-[0.14em] flex items-center gap-1.5"><MapPin size={14} /> DELIVERY</h4><p className="text-[13px] leading-relaxed">{foot.delivery}<br />Doorstep delivery & pickup<br /><br />{STORE.hours}</p>
          <a href="/track" className="inline-flex items-center gap-1.5 mt-4 bg-white text-[#641629] font-semibold rounded-full px-4 py-2.5 text-xs hover:bg-[#e8c66a] hover:text-[#3d0a1a] transition">Track your delivery →</a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x pt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12px] font-semibold text-white/80">
          <span className="flex items-center gap-1.5">✓ Dry-cleaned & sanitised</span>
          <span className="flex items-center gap-1.5">✓ 100% refundable extra</span>
          <span className="flex items-center gap-1.5">✓ Secure UPI payments</span>
          <span className="flex items-center gap-1.5">✓ Same-day delivery</span>
        </div>
        <div className="container-x py-4 flex flex-col sm:flex-row items-center gap-2 text-[11.5px] text-white/60">
          <p>© 2026 TheKissa.co Garba Rental. All rights reserved.</p>
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:ml-auto">
            <a href="/terms" className="hover:text-white underline underline-offset-2">Terms &amp; Conditions</a>
            <a href="/privacy" className="hover:text-white underline underline-offset-2">Privacy Policy</a>
            <a href="/refunds" className="hover:text-white underline underline-offset-2">Refunds &amp; Cancellation</a>
          </p>
        </div>
        <p className="text-center text-[10px] tracking-wide text-white/70 pb-4 -mt-1">{foot.credit || 'Built by Mayur (TEXOWEB.SOLUTIONS)'}</p>
      </div>
    </footer>
  );
}
