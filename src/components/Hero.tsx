import { motion } from 'framer-motion';
import { Lock, Search, ShieldCheck, Star, Truck } from 'lucide-react';
import { useState } from 'react';
import { getRefundablePct } from '../lib/order';
import { getSiteContent, DEFAULT_CONTENT, useSiteVersion } from '../lib/siteContent';
import { waLink } from '../data/products';
import { useStore } from '../store/useStore';

/* Headline ke aas-paas twinkling sparkles — fixed positions, pure CSS */
const SPARKLES: { l: string; t: string; s: number; c: string; d: string; du: string }[] = [
  { l: '6%', t: '18%', s: 6, c: '#e8c66a', d: '0s', du: '2.6s' },
  { l: '20%', t: '6%', s: 4, c: '#ffffff', d: '0.7s', du: '3.1s' },
  { l: '44%', t: '12%', s: 5, c: '#c9a44a', d: '1.3s', du: '2.4s' },
  { l: '68%', t: '6%', s: 7, c: '#e8c66a', d: '0.4s', du: '3.4s' },
  { l: '88%', t: '34%', s: 5, c: '#7a1f38', d: '1.8s', du: '2.9s' },
  { l: '56%', t: '2%', s: 4, c: '#ffffff', d: '2.2s', du: '2.6s' },
];

export default function Hero() {
  const setSearch = useStore((s) => s.setSearch);
  const setCategory = useStore((s) => s.setCategory);
  const setActiveCat = useStore((s) => s.setActiveCat);
  const setWishOnly = useStore((s) => s.setWishOnly);
  const [q, setQ] = useState('');
  useSiteVersion();
  const hero = getSiteContent().hero;
  const heroImgs = hero.imgs?.length ? hero.imgs : DEFAULT_CONTENT.hero.imgs;
  const imgMain = heroImgs[0] || DEFAULT_CONTENT.hero.imgs[0];
  const imgSmall = heroImgs[1] || DEFAULT_CONTENT.hero.imgs[1];
  const imgThird = heroImgs[2] || DEFAULT_CONTENT.hero.imgs[2];
  const pct = getRefundablePct();

  const goShop = () => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCategory('all');
    setActiveCat(null);
    setWishOnly(false);
    setSearch(q.trim());
    goShop();
  };

  return (
    <section id="top" className="bg-[#FAF5EC] text-[#221114] relative overflow-hidden scroll-mt-28">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#c9a44a]/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 w-[380px] h-[380px] rounded-full bg-[#641629]/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[720px] h-[320px] rounded-full bg-[#e8c66a]/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a44a]/70 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c9a44a]/50 to-transparent" />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 relative grid md:grid-cols-[1.05fr_.95fr] gap-8 items-center [&>*]:min-w-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="min-w-0">
          <span className="inline-flex items-center gap-1.5 bg-gradient-to-b from-[#2b141b] to-[#1c0d12] text-[#f0d78c] text-[10.5px] font-bold tracking-[0.16em] rounded-full px-3.5 py-1.5 ring-1 ring-[#c9a44a]/50 shadow-[0_8px_20px_-10px_rgba(34,17,20,.6),inset_0_1px_0_rgba(240,215,140,.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8c66a] pulse-dot" /> THE FESTIVE EDIT · LIVE
          </span>
          <div className="relative mt-3">
            <div aria-hidden className="pointer-events-none absolute -top-6 right-2 sm:right-10 flex items-end gap-[3px] select-none">
              <span className="dandiya-stick stick-l" />
              <span className="dandiya-stick stick-r" />
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
              {SPARKLES.map((sp, i) => (
                <span key={i} className="absolute rounded-full animate-twinkle"
                  style={{ left: sp.l, top: sp.t, width: sp.s, height: sp.s, background: sp.c, boxShadow: `0 0 7px 1px ${sp.c}`, animationDelay: sp.d, animationDuration: sp.du }} />
              ))}
            </div>
            <h1 className="headline-festive font-display font-black tracking-tight text-balance text-[32px] min-[400px]:text-[38px] sm:text-[50px] leading-[1.02] pt-1">
              {hero.titleA}
              <br />
              <span className="font-display-i font-normal text-[#641629]">{hero.titleB}</span>
            </h1>
          </div>
          <p className="text-[#6f5b6a] max-w-xl text-[13.5px] sm:text-[15px] leading-relaxed mt-3">
            {hero.subtitle.includes('{price}') ? (
              <>
                {hero.subtitle.split('{price}')[0]}
                <b className="text-[#221114]">{hero.minPrice}</b>
                {hero.subtitle.split('{price}').slice(1).join('{price}')}
              </>
            ) : hero.subtitle}
          </p>

          <form onSubmit={onSearch} className="mt-4 flex items-center gap-2 bg-[#fffdf9] rounded-2xl p-1.5 pl-4 max-w-lg shadow-[0_20px_45px_-24px_rgba(34,17,20,.35)] ring-1 ring-[#c9a44a]/35 focus-within:ring-[#c9a44a]/70 transition">
            <Search size={17} className="text-black/35 shrink-0" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="What are you looking for? — mirror, red, blouse…"
              className="flex-1 bg-transparent outline-none text-[14px] text-black placeholder:text-black/35 min-w-0" />
            <button type="submit" className="bg-gradient-to-b from-[#2b141b] to-[#1c0d12] ring-1 ring-[#c9a44a]/40 text-[#f7ead0] text-[12.5px] sm:text-[13px] font-bold rounded-xl px-4 sm:px-5 py-2.5 shrink-0 hover:brightness-125 transition">Search</button>
          </form>

          <div className="flex flex-wrap items-center gap-2 mt-4 text-[12px] font-bold text-[#3d2b36]">
            <span className="flex items-center gap-1.5 bg-white/80 ring-1 ring-[#c9a44a]/35 rounded-full px-3 py-1.5 shadow-sm"><Star size={13} className="fill-[#c9960a] text-[#c9960a]" /> 4.9 rated</span>
            <span className="flex items-center gap-1.5 bg-white/80 ring-1 ring-[#c9a44a]/35 rounded-full px-3 py-1.5 shadow-sm"><Truck size={13} className="text-emerald-700" /> Same-day delivery</span>
            <span className="flex items-center gap-1.5 bg-white/80 ring-1 ring-[#c9a44a]/35 rounded-full px-3 py-1.5 shadow-sm"><ShieldCheck size={13} className="text-emerald-700" /> {pct}% extra, 100% refundable</span>
            <span className="flex items-center gap-1.5 bg-white/80 ring-1 ring-[#c9a44a]/35 rounded-full px-3 py-1.5 shadow-sm"><Lock size={13} className="text-emerald-700" /> 100% Secure payments</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={goShop} className="group relative overflow-hidden card-shine inline-flex items-center gap-1.5 bg-gradient-to-b from-[#2b141b] to-[#1c0d12] ring-1 ring-[#c9a44a]/50 text-[#f7ead0] text-[13px] font-bold rounded-full px-5 py-2.5 shadow-[0_12px_24px_-12px_rgba(34,17,20,.6)] hover:brightness-125 transition">Shop collection →</button>
            <a href={waLink('Hi TheKissa.co! I want to rent a Garba outfit')} target="_blank" className="group relative overflow-hidden card-shine inline-flex items-center gap-1.5 bg-[#1e7a45] text-white text-[13px] font-bold rounded-full px-5 py-2.5 shadow-[0_12px_24px_-12px_rgba(30,122,69,.6)] hover:brightness-110 transition">WhatsApp us</a>
          </div>
          <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#fdf6e3] via-[#f0d78c] to-[#d9ab2e] px-5 py-4 shadow-[0_20px_45px_-20px_rgba(160,120,30,.55)] ring-1 ring-[#8a6d1f]/50 relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#8a6d1f]/10 to-transparent" />
            <p className="relative font-display font-black text-[22px] min-[400px]:text-[26px] sm:text-[32px] leading-tight tracking-tight break-words text-balance text-[#3d0a1a]">100% Refundable Extra <span className="whitespace-nowrap inline-block align-middle rounded-full bg-[#3d0a1a] text-[#f0d78c] px-3.5 py-1 text-[0.62em] tracking-normal shadow-[0_8px_18px_-8px_rgba(61,10,26,.7)]">({pct}%)</span></p>
            <p className="relative text-[#3d0a1a]/75 font-medium text-[12.5px] sm:text-[13px] mt-1.5">Returned via UPI/cash within 24 hours of return — no deductions on normal wear</p>
          </div>
          {/* Mobile photos — desktop collage yahan nahi dikhta, isliye chhoti strip */}
          <div className="md:hidden mt-4 grid grid-cols-3 gap-2">
            {[imgMain, imgSmall, imgThird].map((src, i) => (
              <div key={`${src}-${i}`} className="rounded-2xl overflow-hidden ring-1 ring-[#c9a44a]/50 shadow-[0_16px_30px_-20px_rgba(34,17,20,.5)] bg-[#f4f1ea]">
                <img src={src} alt="Garba rental outfit" loading="lazy" decoding="async" className="w-full h-28 object-cover" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative hidden md:block"
        >
          <div className="rounded-[2rem] overflow-hidden ring-2 ring-[#c9a44a]/50 shadow-[0_40px_80px_-40px_rgba(34,17,20,.45)]">
            <img src={imgMain} alt="Mirror-work Chaniya Choli" fetchPriority="high" className="w-full h-72 object-cover" />
          </div>
          <div className="absolute -bottom-5 -left-5 w-40 rounded-2xl overflow-hidden ring-2 ring-[#e8c66a]/70 shadow-xl">
            <img src={imgSmall} alt="Golden diva choli" className="w-full h-48 object-cover" />
          </div>
          <div className="animate-floaty absolute -top-4 -right-2 bg-white/95 backdrop-blur rounded-2xl ring-1 ring-[#c9a44a]/50 shadow-xl px-4 py-3 flex items-center gap-2.5">
            <span className="bg-emerald-500 text-white font-bold text-[11px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <Star size={10} className="fill-white" />4.9
            </span>
            <span className="text-[12px] font-semibold leading-tight">2,000+ happy<br />rentals</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
