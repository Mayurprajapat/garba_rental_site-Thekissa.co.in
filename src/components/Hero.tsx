import { motion } from 'framer-motion';
import { Lock, Search, ShieldCheck, Star, Truck } from 'lucide-react';
import { useState } from 'react';
import { getSiteContent, useSiteVersion } from '../lib/siteContent';
import { useStore } from '../store/useStore';

export default function Hero() {
  const setSearch = useStore((s) => s.setSearch);
  const setCategory = useStore((s) => s.setCategory);
  const setActiveCat = useStore((s) => s.setActiveCat);
  const setWishOnly = useStore((s) => s.setWishOnly);
  const [q, setQ] = useState('');
  useSiteVersion();
  const hero = getSiteContent().hero;

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
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#c9a44a]/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 w-[380px] h-[380px] rounded-full bg-[#641629]/10 blur-3xl" />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 relative grid md:grid-cols-[1.05fr_.95fr] gap-8 items-center [&>*]:min-w-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="min-w-0">
          <span className="inline-flex items-center gap-1.5 bg-[#221114] text-[#e8c66a] text-[10.5px] font-bold tracking-[0.16em] rounded-full px-3.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8c66a]" /> THE FESTIVE EDIT · LIVE
          </span>
          <h1 className="font-display font-black tracking-tight text-balance text-[30px] min-[400px]:text-[34px] sm:text-[46px] leading-[1.05] mt-3">
            {hero.titleA}
            <br />
            <span className="font-display-i font-normal text-[#641629]">{hero.titleB}</span>
          </h1>
          <p className="text-[#6f5b6a] max-w-xl text-[13.5px] sm:text-[15px] leading-relaxed mt-3">
            {hero.subtitle.includes('{price}') ? (
              <>
                {hero.subtitle.split('{price}')[0]}
                <b className="text-[#221114]">{hero.minPrice}</b>
                {hero.subtitle.split('{price}').slice(1).join('{price}')}
              </>
            ) : hero.subtitle}
          </p>

          <form onSubmit={onSearch} className="mt-4 flex items-center gap-2 bg-white rounded-2xl p-1.5 pl-4 max-w-lg shadow-[0_20px_45px_-24px_rgba(34,17,20,.35)] ring-1 ring-black/10">
            <Search size={17} className="text-black/35 shrink-0" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="What are you looking for? — mirror, red, blouse…"
              className="flex-1 bg-transparent outline-none text-[14px] text-black placeholder:text-black/35 min-w-0" />
            <button type="submit" className="bg-[#221114] text-white text-[12.5px] sm:text-[13px] font-bold rounded-xl px-4 sm:px-5 py-2.5 shrink-0 hover:bg-black transition">Search</button>
          </form>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[12.5px] font-semibold text-[#3d2b36]">
            <span className="flex items-center gap-1.5"><Star size={14} className="fill-[#c9960a] text-[#c9960a]" /> 4.9 rated</span>
            <span className="flex items-center gap-1.5"><Truck size={14} className="text-emerald-700" /> Same-day delivery</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-700" /> Refundable deposit</span>
            <span className="flex items-center gap-1.5"><Lock size={14} className="text-emerald-700" /> 100% Secure payments</span>
          </div>
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#3d0a26] via-[#641629] to-[#8e1a4f] text-white px-5 py-4 shadow-[0_20px_45px_-20px_rgba(61,10,38,.6)] ring-1 ring-white/10">
            <p className="font-display font-black text-[22px] min-[400px]:text-[26px] sm:text-[32px] leading-tight tracking-tight break-words text-balance">100% Refundable Deposit</p>
            <p className="text-white/70 text-[12.5px] sm:text-[13px] mt-1.5">Returned via UPI/cash within 24 hours of return — no deductions on normal wear</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative hidden md:block"
        >
          <div className="rounded-[2rem] overflow-hidden ring-1 ring-black/10 shadow-[0_40px_80px_-40px_rgba(34,17,20,.45)]">
            <img src="/images/g-hero.webp" alt="Mirror-work Chaniya Choli" fetchPriority="high" className="w-full h-72 object-cover" />
          </div>
          <div className="absolute -bottom-5 -left-5 w-40 rounded-2xl overflow-hidden ring-4 ring-[#FAF5EC] shadow-xl">
            <img src="/images/g-chaniya2.webp" alt="Golden diva choli" className="w-full h-48 object-cover" />
          </div>
          <div className="absolute -top-4 -right-2 bg-white rounded-2xl ring-1 ring-black/10 shadow-xl px-4 py-3 flex items-center gap-2.5">
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
