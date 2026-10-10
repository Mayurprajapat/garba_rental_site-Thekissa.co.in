import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { useRef } from 'react';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { useStore } from '../store/useStore';

type Cat = (typeof CATEGORIES)[number];

function StackCard({ c, i, total, progress }: { c: Cat; i: number; total: number; progress: MotionValue<number> }) {
  const setCategory = useStore((s) => s.setCategory);
  const isLast = i === total - 1;
  const targetScale = isLast ? 1 : 1 - (total - 1 - i) * 0.05;
  const scale = useTransform(progress, [i / total, 1], [1, targetScale]);
  const dim = useTransform(progress, [i / total, 1], [0, isLast ? 0 : 0.55]);

  const list = c.id === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === c.id);
  const minPrice = list.length ? Math.min(...list.map((p) => p.rent3)) : 0;

  const go = () => {
    setCategory(c.id);
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="sticky mb-5 md:mb-6" style={{ top: `calc(76px + ${i * 14}px)` }}>
      <motion.div
        style={{ scale, willChange: 'transform' }}
        className="relative h-[380px] md:h-[420px] rounded-[28px] overflow-hidden border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.35)] [transform-style:preserve-3d]"
      >
        <img src={c.img} alt={c.label} loading={i === 0 ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 text-white">
          <span className="inline-block bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-bold px-3 py-1.5 rounded-full">
            ONLY GARBA
          </span>
          <h3 className="font-display font-black text-2xl md:text-4xl mt-2.5">{c.label}</h3>
          <div className="flex items-center gap-2 mt-2 text-[13px]">
            <span className="bg-emerald-500 text-white font-bold text-[11px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
              <Star size={10} className="fill-white" />4.9
            </span>
            <span className="opacity-80">{c.note}</span>
            <span className="opacity-80">•</span>
            <span className="font-bold">Rent from ₹{minPrice.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={go}
            className="mt-4 bg-[#ffc93c] text-black font-bold text-sm px-6 py-3 rounded-full flex items-center gap-2 hover:gap-3 transition-all"
          >
            Explore Garba Looks <ArrowRight size={15} />
          </button>
        </div>
        <motion.div style={{ opacity: dim }} className="absolute inset-0 bg-black pointer-events-none" />
      </motion.div>
    </div>
  );
}

/** Sticky stacking category cards — scroll par ek ke upar ek jamte hai. */
export default function StackCards() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  return (
    <div ref={ref} className="[perspective:1400px]">
      {CATEGORIES.map((c, i) => (
        <StackCard key={c.id} c={c} i={i} total={CATEGORIES.length} progress={scrollYProgress} />
      ))}
    </div>
  );
}
