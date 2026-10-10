import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { PRODUCTS } from '../data/products';

const NAMES = ['Priya', 'Amit', 'Kinjal', 'Rahul', 'Sneha', 'Hetal', 'Pooja', 'Karan', 'Divya', 'Jignesh'];
const AREAS = ['Vijay Nagar', 'Palasia', 'Rajwada', 'Sapna Sangeeta', 'Annapurna', 'Sudama Nagar', 'Tilak Nagar', 'Bholaram'];
const MINS = [2, 4, 6, 8, 11, 14, 17, 21];

/** Live booking ticker — "X ne Y book kiya • N min ago", har 4s rotate. */
export default function LiveTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => v + 1), 4000);
    return () => clearInterval(t);
  }, []);
  const p = PRODUCTS[(i * 7) % PRODUCTS.length];

  return (
    <div className="max-w-7xl mx-auto px-4 mt-3">
      <div className="bg-white border border-[#4a0e2e]/15 rounded-full shadow-sm px-4 py-1.5 flex items-center gap-2.5 overflow-hidden">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-extrabold text-emerald-600 tracking-wide shrink-0">LIVE</span>
        <div className="relative flex-1 h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 text-[12.5px] text-black/60 truncate leading-5"
            >
              <b className="text-black">{NAMES[i % NAMES.length]}</b> ({AREAS[(i + 2) % AREAS.length]}) booked{' '}
              <b className="text-black">{p.name}</b> • {MINS[(i + 4) % MINS.length]} min ago
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
