import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, MapPin, Navigation, Quote, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { waLink } from '../data/products';
import { STORE } from '../data/store';
import { getSiteContent, DEFAULT_CONTENT, useSiteVersion } from '../lib/siteContent';
import Logo from './Logo';

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
            <span aria-hidden className="pointer-events-none select-none absolute -top-2 right-1 font-display font-black text-[64px] leading-none text-[#c9a44a]/15">{s.n}</span>
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
  return (
    <section id="looks" className="container-x py-5">
      <p className="eyebrow text-center">{looks.subtitle}</p>
      <h2 className="premium-heading font-display font-black text-lg sm:text-xl text-center mt-1.5">{looks.title}</h2>
      <div className="flex gap-2.5 mt-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-4 px-4">
        {imgs.map((src, i) => (
          <motion.img key={src} src={src} alt={`Customer garba look ${i + 1}`} loading="lazy"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            className="rounded-2xl h-28 sm:h-36 w-auto shrink-0 snap-start object-cover card-shadow ring-1 ring-[#c9a44a]/30 hover:ring-[#c9a44a]/70 hover:scale-[1.03] transition" />
        ))}
      </div>
      <p className="text-center text-[11px] text-[#8a7584] mt-2">{looks.note}</p>
    </section>
  );
}

export function Testimonials() {
  const data = [
    ['The mirror-work chaniya fit perfectly — fresh and crisp. Size exchange at my doorstep, zero tension.', 'Priya S. · Vijay Nagar'],
    ['The bridal lehenga looked straight out of a boutique, delivered on time with full jewellery set.', 'Amita P. · Palasia'],
    ['The fit was perfect and the colour looked exactly like the photos — delivery and return both at my doorstep.', 'Kinjal M. · Rajwada'],
  ];
  const [idx, setIdx] = useState(0);
  return (
    <section id="reviews" className="cv-auto mandala-bg bg-gradient-to-b from-[#2b070e] via-[#3d0a1e] to-[#1c0d12] border-y border-[#c9a44a]/30 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e8c66a]/70 to-transparent" />
      <div className="max-w-3xl mx-auto px-4 py-8 text-center relative">
        <p className="eyebrow eyebrow-light">Customer love</p>
        <h2 className="premium-heading font-display font-black text-xl sm:text-2xl mt-1.5 text-[#f7ead0]">Loved by local families</h2>
        <div className="relative mt-4 min-h-[130px]">
          <AnimatePresence mode="wait">
            <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="bg-white/[.06] backdrop-blur border border-[#c9a44a]/35 rounded-[1.25rem] p-5 sm:p-6 shadow-[0_24px_48px_-30px_rgba(0,0,0,.6)]">
              <Quote size={20} className="mx-auto text-[#e8c66a]/70" />
              <p className="mt-3 text-[15px] leading-relaxed text-[#f7ead0]">“{data[idx][0]}”</p>
              <b className="block mt-4 text-[13px] text-[#e8c66a]">— {data[idx][1]} · ★★★★★</b>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-0.5 mt-4">
          {data.map((_, i) => (
            <button key={i} aria-label={`Review ${i + 1}`} onClick={() => setIdx(i)} className="p-2.5">
              <span className={`block h-2 rounded-full transition-all ${i === idx ? 'w-8 bg-[#e8c66a]' : 'w-2 bg-white/25'}`} />
            </button>
          ))}
        </div>
      </div>
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
        <div className="container-x pt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12px] font-semibold text-white/60">
          <span className="flex items-center gap-1.5">✓ Dry-cleaned & sanitised</span>
          <span className="flex items-center gap-1.5">✓ 100% refundable extra</span>
          <span className="flex items-center gap-1.5">✓ Secure UPI payments</span>
          <span className="flex items-center gap-1.5">✓ Same-day delivery</span>
        </div>
        <div className="container-x py-4 flex flex-col sm:flex-row items-center gap-2 text-[11.5px] text-white/40">
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
