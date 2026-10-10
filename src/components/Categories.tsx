import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { categoriesEvent, getCategories, type ShopCategory } from '../lib/categories';
import { useStore } from '../store/useStore';

/** Shop by category — photo cards, tap karte hi filtered collection. */
export default function ShopByCategory() {
  const [cats, setCats] = useState<ShopCategory[]>(() => getCategories());
  const setSearch = useStore((s) => s.setSearch);
  const setCategory = useStore((s) => s.setCategory);
  const activeCat = useStore((s) => s.activeCat);
  const setActiveCat = useStore((s) => s.setActiveCat);

  useEffect(() => {
    const refresh = () => setCats(getCategories());
    const evt = categoriesEvent();
    window.addEventListener(evt, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(evt, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (!cats.length) return null;

  const go = (c: ShopCategory) => {
    // Dress category = dresses filter · Item category = SIRF single items (dress mix nahi)
    setActiveCat({ id: c.id, label: c.label, kind: c.kind, query: c.query });
    setCategory('all');
    setSearch('');
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };

  const showAll = () => {
    setActiveCat(null);
    setCategory('all');
    setSearch('');
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="bg-white border-b border-black/[.06]">
      <div className="container-x pt-6 pb-5">
        <div className="flex items-end gap-3">
          <div>
            <p className="eyebrow">Shop by category</p>
            <h2 className="premium-heading font-display font-black text-xl sm:text-2xl mt-1 text-black">Jo chahiye, seedha tap karo</h2>
          </div>
          <button onClick={showAll}
            className="ml-auto shrink-0 text-[12.5px] font-semibold text-black/60 hover:text-black underline underline-offset-4">
            Sab dekho →
          </button>
        </div>
        <div className="flex gap-2.5 sm:gap-3 mt-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {cats.map((c, i) => (
            <motion.button
              key={c.id}
              onClick={() => go(c)}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }} transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
              className={`group relative shrink-0 snap-start text-left rounded-2xl overflow-hidden w-[128px] sm:w-[160px] h-[150px] sm:h-[180px] border bg-[#f4f1ea] card-hover transition ${activeCat?.id === c.id ? 'border-[#c9273a] ring-2 ring-[#c9273a]/60' : 'border-black/10'}`}
            >
              <img src={c.img} alt={c.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-[1.07]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 text-white">
                <b className="block text-[13px] sm:text-[14px] leading-tight">{c.label}</b>
                <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-semibold text-[#e8c66a] mt-0.5">Dekho <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" /></span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
