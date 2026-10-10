import { Heart, MessageCircle, Phone, Search, ShoppingBasket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { waLink } from '../data/products';
import { STORE } from '../data/store';
import { getSiteContent, useSiteVersion } from '../lib/siteContent';
import { useStore } from '../store/useStore';

export default function Navbar() {
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const wishOnly = useStore((s) => s.wishOnly);
  const setWishOnly = useStore((s) => s.setWishOnly);
  const setSearch = useStore((s) => s.setSearch);
  const setActiveCat = useStore((s) => s.setActiveCat);
  const pushToast = useStore((s) => s.pushToast);
  const [scrolled, setScrolled] = useState(false);
  const count = cart.reduce((a, c) => a + c.qty, 0);
  useSiteVersion();
  const site = getSiteContent();

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  const toggleWishlist = () => {
    if (!wishlist.length) {
      pushToast('Wishlist is empty — tap ♥ on any dress to save it');
      return;
    }
    const next = !wishOnly;
    setWishOnly(next);
    if (next) {
      setSearch('');
      setActiveCat(null);
      pushToast(`${wishlist.length} dresses in your wishlist`);
    }
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
  };

  const links: [string, string][] = [
    ['Collection', '#shop'],
    ['How it works', '#process'],
    ['Reviews', '#faq'],
    ['Contact', '#contact'],
  ];

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'shadow-[0_16px_40px_-20px_rgba(0,0,0,.35)]' : ''}`}>
      {site.announcement.show && (
        <div className="bg-gradient-to-r from-[#4d0f1f] via-[#641629] to-[#4d0f1f] text-white">
          <div className="container-x flex items-center justify-center gap-2.5 py-2 text-[11px] sm:text-xs tracking-wide">
            <span className="glow-green inline-flex items-center gap-1 rounded-full border border-emerald-300/70 bg-emerald-500/15 text-emerald-200 text-[10px] sm:text-[10.5px] font-bold tracking-[0.08em] px-2.5 py-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> {site.announcement.badge}
            </span>
            <p className="truncate font-medium text-[#f7ead0]">{site.announcement.msg}</p>
          </div>
        </div>
      )}

      <div className="glass border-b border-black/[.07]">
        <div className="container-x h-[60px] sm:h-[68px] flex items-center justify-between gap-1.5 sm:gap-3">
          <a href="#top" className="flex items-center gap-2 group min-w-0">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl grid place-items-center font-semibold text-white text-base sm:text-lg bg-gradient-to-br from-[#d92b3f] to-[#641629] ring-1 ring-[#641629]/20 shadow-[inset_0_1px_0_rgba(255,255,255,.25)] group-hover:scale-105 transition shrink-0">{STORE.brand.charAt(0).toUpperCase()}</span>
            <span className="leading-tight min-w-0 shrink-0">
              <b className="font-display font-black text-[15px] min-[400px]:text-[19px] sm:text-[22px] block text-[#c9273a] tracking-tight whitespace-nowrap">{STORE.brand}</b>
              <small className="hidden min-[400px]:block text-[8.5px] sm:text-[9px] tracking-[0.2em] text-[#8a6d00] font-bold">GARBHA & FESTIVE RENTALS</small>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-6 text-[13.5px] font-medium text-neutral-500">
            {links.map(([l, h]) => (
              <a key={l} href={h} className="hover:text-[#641629] transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-[#c9273a] after:transition-all hover:after:w-full">{l}</a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a href={STORE.phoneHref} className="hidden xl:flex items-center gap-1.5 text-[13px] font-semibold text-black border border-black/10 rounded-full px-4 py-2 hover:bg-black hover:text-white transition">
              <Phone size={14} /> {STORE.phoneShort}
            </a>
            <a href={waLink('Hi TheKissa.co.in! I need help with a rental.')} target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 text-[12.5px] font-bold text-white rounded-full px-4 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e9e52] shadow-[0_8px_20px_-10px_rgba(46,204,113,.7)] hover:brightness-110 transition">
              <MessageCircle size={14} /> WhatsApp Support
            </a>
            <button onClick={() => {
                document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-10 h-10 hidden min-[380px]:grid place-items-center rounded-full border border-black/10 bg-white hover:border-black hover:shadow-[0_8px_20px_-10px_rgba(0,0,0,.3)] transition" title="Browse collection" aria-label="Browse collection">
              <Search size={16} />
            </button>
            <button onClick={toggleWishlist} title={wishOnly ? 'Show all outfits' : 'Show wishlist only'} aria-label="Wishlist"
              className={`relative w-10 h-10 hidden min-[380px]:grid place-items-center rounded-full border bg-white transition ${wishOnly ? 'border-black bg-black text-white shadow-[0_8px_20px_-10px_rgba(0,0,0,.5)]' : 'border-black/10 hover:border-black hover:shadow-[0_8px_20px_-10px_rgba(0,0,0,.3)]'}`}>
              <Heart size={16} className={wishOnly ? 'fill-white text-white' : wishlist.length ? 'fill-black text-black' : 'text-black'} />
              {wishlist.length > 0 && <span className={`absolute -top-1 -right-1 text-[10px] font-bold min-w-5 h-5 px-1 grid place-items-center rounded-full ${wishOnly ? 'bg-white text-black' : 'bg-black text-white'}`}>{wishlist.length}</span>}
            </button>
            <button onClick={() => setCartOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#d92b3f] to-[#641629] text-white text-[13px] font-semibold rounded-full pl-4 pr-1.5 py-1.5 hover:brightness-110 transition ring-1 ring-[#641629]/20 shadow-[0_10px_24px_-12px_rgba(100,22,41,.6)]">
              <ShoppingBasket size={15} />
              <span className="hidden sm:inline">Booking list</span>
              <span className="bg-white text-black text-xs font-bold min-w-7 h-7 px-1.5 grid place-items-center rounded-full">{count}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
