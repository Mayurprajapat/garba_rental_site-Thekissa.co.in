import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PRODUCTS } from '../data/products';

const NAMES = ['Priya', 'Amit', 'Kinjal', 'Rahul', 'Sneha', 'Hetal', 'Pooja', 'Karan', 'Divya', 'Jignesh'];
const AREAS = ['Vijay Nagar', 'Palasia', 'Rajwada', 'Sapna Sangeeta', 'Annapurna', 'Sudama Nagar', 'Tilak Nagar', 'Bholaram'];
const MINS = [2, 4, 6, 8, 11, 14, 17, 21];

/** Live booking ticker — "X booked Y • N min ago", rotates every 4s. */
export default function LiveTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => v + 1), 4000);
    return () => clearInterval(t);
  }, []);
  const p = PRODUCTS[(i * 7) % PRODUCTS.length];

  return (
    <div className="max-w-7xl mx-auto px-4 mt-3">
      <div className="mandala-bg bg-gradient-to-r from-[#1c0d12] via-[#2b141b] to-[#1c0d12] border border-[#c9a44a]/40 rounded-full shadow-[0_12px_28px_-18px_rgba(34,17,20,.7)] px-4 py-1.5 flex items-center gap-2.5 overflow-hidden">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-extrabold text-[#e8c66a] tracking-[0.14em] shrink-0">LIVE</span>
        <div className="relative flex-1 h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 text-[12.5px] text-white/90 truncate leading-5"
            >
              <b className="text-[#f7ead0]">{NAMES[i % NAMES.length]}</b> ({AREAS[(i + 2) % AREAS.length]}) booked{' '}
              <b className="text-[#f7ead0]">{p.name}</b> • {MINS[(i + 4) % MINS.length]} min ago
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
