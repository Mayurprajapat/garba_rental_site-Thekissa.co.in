import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

function useCountdown() {
  const [t, setT] = useState({ d: '00', h: '00', m: '00', s: '00' });
  useEffect(() => {
    const target = new Date('2026-10-12T00:00:00').getTime();
    const f = () => {
      const diff = Math.max(0, target - Date.now());
      const p = (n: number) => String(n).padStart(2, '0');
      setT({
        d: p(Math.floor(diff / 86400000)),
        h: p(Math.floor((diff / 3600000) % 24)),
        m: p(Math.floor((diff / 60000) % 60)),
        s: p(Math.floor((diff / 1000) % 60)),
      });
    };
    f();
    const id = setInterval(f, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function Hero() {
  const t = useCountdown();
  const setSearch = useStore((s) => s.setSearch);
  const setCategory = useStore((s) => s.setCategory);
  const [q, setQ] = useState('');

  const goShop = () => {
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCategory('all');
    setSearch(q.trim());
    goShop();
  };

  return (
    <section id="top" className="hero-vignette bg-gradient-to-b from-[#641629] via-[#4d0f1f] to-[#2b070e] text-white relative overflow-hidden scroll-mt-28">
      <div className="max-w-6xl mx-auto px-4 py-5 sm:py-6 md:py-8 relative grid md:grid-cols-[1.15fr_.85fr] gap-5 items-center [&>*]:min-w-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="min-w-0">
          <span className="inline-block border border-white/20 text-white/75 text-[10px] sm:text-[10.5px] font-bold tracking-[0.12em] sm:tracking-[0.14em] rounded-full px-3 py-1.5 tabular-nums bg-white/[.04] backdrop-blur max-w-full">NAVRATRI IN {t.d}d : {t.h}h : {t.m}m</span>
          <h1 className="premium-heading font-semibold tracking-tight text-balance text-[24px] min-[400px]:text-[27px] sm:text-[42px] leading-[1.1] mt-2.5">
            Rent designer Garba looks.
            <br />
            <span className="font-display-i bg-gradient-to-r from-[#f3dfa4] via-[#e8c66a] to-[#c9a44a] bg-clip-text text-transparent">Return easily.</span>
          </h1>
          <p className="text-white/60 max-w-xl text-[13px] sm:text-[13.5px] leading-relaxed mt-2">
            Chaniya Choli, Kediyu-Dhoti and bridal couture — on rent from <b className="text-white">₹799</b>. Sanitised, steam-pressed, same-day delivery.
          </p>

          {/* Search — seedha yahin se dhoondho */}
          <form onSubmit={onSearch} className="mt-3.5 flex items-center gap-2 bg-white rounded-full p-1.5 pl-4 max-w-lg shadow-[0_20px_50px_-20px_rgba(0,0,0,.8)] ring-1 ring-white/20">
            <Search size={17} className="text-black/35 shrink-0" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Kya dhoondh rahe ho? — kediyu, mirror, red…"
              className="flex-1 bg-transparent outline-none text-[14px] text-black placeholder:text-black/35 min-w-0" />
            <button type="submit" className="bg-gradient-to-r from-[#d92b3f] to-[#641629] text-white text-[12.5px] sm:text-[13px] font-bold rounded-full px-4 sm:px-5 py-2.5 shrink-0 hover:brightness-110 transition ring-1 ring-white/20">Search</button>
          </form>

          <p className="text-[11px] text-white/45 mt-3.5">Sanitised · Same-day delivery · Refundable deposit</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="relative hidden md:block"
        >
          <div className="rounded-3xl overflow-hidden ring-1 ring-white/15 bg-white/[.05] backdrop-blur shadow-[0_40px_80px_-40px_rgba(0,0,0,.9)]">
            <img src="/images/g-hero.webp" alt="Mirror-work Chaniya Choli" className="w-full h-52 object-cover" />
            <div className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.18em] text-[#e8c66a] font-bold">SIGNATURE · N°01</p>
                <p className="text-[13px] font-medium mt-0.5">Mirror-work Chaniya Choli</p>
              </div>
              <div className="text-right"><b className="text-lg">₹1,499</b><p className="text-[11px] text-white/35 line-through">₹4,999</p></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
