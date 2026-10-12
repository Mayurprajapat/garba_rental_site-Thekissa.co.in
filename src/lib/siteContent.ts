// Website content — change everything from the Admin panel → Website tab, no code changes needed.
// Store number, banner, hero, features, promo codes, steps, photos, FAQs, booking panel, footer.
// Goes live on the website as soon as you save (in this browser). Stored in localStorage like Products/Categories.

import { useEffect, useState } from 'react';
import type { Accessory, Category } from '../data/products';

export interface StoreInfo {
  brand: string;
  /** mobile number — 10 digits or with +91, display format is generated automatically */
  phone: string;
  email: string;
  city: string;
  addressShort: string;
  addressLong: string;
  hours: string;
  hoursShort: string;
  /** Shop's UPI ID for QR payments (e.g. name@okhdfc) — change via Admin → Website → Store */
  upi: string;
}

export interface Promo {
  code: string;
  percent: number;
}

export interface ProcStep {
  n: string;
  h: string;
  p: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface SiteContent {
  store: StoreInfo;
  announcement: { show: boolean; badge: string; msg: string };
  hero: { titleA: string; titleB: string; subtitle: string; minPrice: string };
  features: string[];
  promos: Promo[];
  process: { title: string; steps: ProcStep[] };
  looks: { title: string; subtitle: string; note: string; imgs: string[] };
  faqs: Faq[];
  booking: { title: string; subtitle: string; points: string[] };
  footer: { about: string; delivery: string; credit: string; refundablePct: number };
  shopNote: string;
  /** Refundable extra % — Admin → Website se badalta hai. Default 30. */
  refundablePct: number;
  /** Dress QuickView card — "THE MODEL WORE THIS" box. Editable from Admin → Website. */
  completeLook: CompleteLook;
}

export interface CompleteLook {
  title: string;
  subtitle: string;
  /** Short note — the "Tick = joins the dress…" line */
  hint: string;
  /** Category-wise default lines. If a dress has its own `accessories`, those take precedence. */
  defaults: Record<Category, Accessory[]>;
}

export const DEFAULT_COMPLETE_LOOK: CompleteLook = {
  title: 'THE MODEL WORE THIS',
  subtitle: 'The complete look is right here — nothing to search for.',
  hint: 'Tick = joins the dress · Only this = rent the item alone, without the dress.',
  defaults: {
    women: [
      { name: 'Bandhani dupatta', tag: 'included' },
      { name: 'Latkan + dori', tag: 'included' },
      { name: 'Oxidised jhumka', tag: 'addon', price: 99 },
      { name: 'Kamarbandh (tagdi)', tag: 'addon', price: 149 },
      { name: 'Dandiya pair', tag: 'free' },
    ],
    men: [
      { name: 'Pagdi / safa', tag: 'included' },
      { name: 'Dupatta', tag: 'included' },
      { name: 'Mojari', tag: 'addon', price: 149 },
      { name: 'Brooch set', tag: 'addon', price: 49 },
      { name: 'Dandiya pair', tag: 'free' },
    ],
    kids: [
      { name: 'Dupatta + hair accessory', tag: 'included' },
      { name: 'Latkan', tag: 'included' },
      { name: 'Kids jhumka', tag: 'addon', price: 79 },
      { name: 'Dandiya (small)', tag: 'free' },
    ],
    combo: [
      { name: 'Her dupatta + his pagdi', tag: 'included' },
      { name: 'Couple dandiya set', tag: 'free' },
      { name: 'Jewellery set', tag: 'addon', price: 199 },
    ],
    premium: [
      { name: 'Designer dupatta + latkan', tag: 'included' },
      { name: 'Jewellery set', tag: 'included' },
      { name: 'Kamarbandh (tagdi)', tag: 'addon', price: 149 },
      { name: 'Dandiya pair', tag: 'free' },
    ],
  },
};

export const DEFAULT_CONTENT: SiteContent = {
  store: {
    brand: 'TheKissa.co',
    phone: '6268305900',
    email: 'support.thekissa.co.in@gmail.com',
    city: 'Indore',
    addressShort: 'Online only · Doorstep delivery in Indore',
    addressLong: 'Online-only rental studio · Indore, Madhya Pradesh, India (no walk-in store — doorstep delivery & pickup)',
    hours: 'Delivery 9 AM – 10 PM daily (Navratri day 3–6: 4 PM – 10 PM)',
    hoursShort: '9 AM – 10 PM',
    upi: 'thekissa.co@ptaxis',
  },
  announcement: { show: true, badge: 'NAVRATRI SLOTS OPEN', msg: 'Rent from ₹299 · 100% Secure QR Payments · Same-day delivery' },
  hero: {
    titleA: 'Rent designer Garba looks.',
    titleB: 'Return easily.',
    subtitle: 'Designer Chaniya Choli, bridal couture and jewellery — on rent from {price}. Sanitised, steam-pressed, same-day delivery.',
    minPrice: '₹299',
  },
  features: ['Dry-cleaned & Sanitized', '100% Refundable Extra (30%)', '100% Secure QR Payments', 'Live Availability Tracking'],
  promos: [
    { code: 'NAVRATRI20', percent: 20 },
    { code: 'GROUP25', percent: 25 },
    { code: 'FIRST10', percent: 10 },
  ],
  process: {
    title: 'Renting in 2 quick steps',
    steps: [
      { n: '01', h: 'Pick your look', p: 'Browse the collection or WhatsApp us your size and colour.' },
      { n: '02', h: 'Confirm & delivery', p: 'Pay half now or the full amount. Same-day delivery or store pickup.' },
    ],
  },
  looks: {
    title: 'Worn last Navratri',
    subtitle: 'Customer looks',
    note: 'Swipe → to see more looks',
    imgs: [
      '/images/g-hero.webp', '/images/g-chaniya2.webp',
      '/images/g-girls2.jpg', '/images/g-koti.webp',
      '/images/g-pinkmulti.webp', '/images/g-chaniya1.jpg',
    ],
  },
  faqs: [
    { q: 'How long is the rental period?', a: 'Every rental is 1 day — pickup, event and return. Need it longer? Just re-book for the next day.' },
    { q: 'What if the size doesn’t fit?', a: 'We keep large sizes in stock — get the fitting done from us, and we also provide pins for minor adjustments. Share your size on email or WhatsApp and we confirm fit before dispatch.' },
    { q: 'Is the deposit refundable?', a: 'Yes, 100%. Every dress has a 30% refundable extra over the rent — refunded via UPI/cash within 24 hours of return and quality check. Normal wear is never charged.' },
    { q: 'What about stains or minor damage?', a: 'Light dry-cleanable stains are on us. Major damage is charged at repair cost only — optional ₹199 damage cover removes the worry.' },
    { q: 'Where do you deliver?', a: '1-2 hours delivery in Indore. Free delivery on bulk orders.' },
  ],
  booking: {
    title: 'Reserve your outfit in two minutes',
    subtitle: 'Fill the form — it opens your email app with everything pre-written. Send it and your outfit enquiry is locked.',
    points: ['Free size available', 'Same-day slots in Indore', 'Refundable extra 30%, no hidden fees'],
  },
  footer: {
    about: 'Designer Garba outfits on rent — perfect fitting, doorstep delivery, easy return.',
    delivery: 'Online only — no walk-in store',
    credit: 'Built by Mayur (TEXOWEB.SOLUTIONS)',
    refundablePct: 30,
  },
  /** Refundable extra percentage (of rent) — collected on delivery, refunded on return. Default: 30. */
  refundablePct: 30,
  shopNote: '1-day rentals · 100% refundable 30% extra · 100% secure QR payments',
  completeLook: DEFAULT_COMPLETE_LOOK,
};

const KEY = 'raasleela-site-content';
const EVT = 'raasleela-site-updated';

function valid(c: any): c is SiteContent {
  return !!c && typeof c === 'object' && !!c.store && typeof c.store.phone === 'string' && Array.isArray(c.promos) && Array.isArray(c.faqs);
}

function cleanLookItem(a: any): Accessory | null {
  if (!a || typeof (a as any).name !== 'string' || !(a as any).name.trim()) return null;
  const name = (a as any).name.trim().slice(0, 80);
  const tag = (a as any).tag === 'free' ? 'free' : (a as any).tag === 'addon' ? 'addon' : 'included';
  const out: Accessory = { name, tag };
  if (tag === 'addon') out.price = Math.max(0, Math.round(Number((a as any).price) || 0));
  if (typeof (a as any).x === 'number' && typeof (a as any).y === 'number') {
    out.x = Math.min(95, Math.max(0, (a as any).x));
    out.y = Math.min(95, Math.max(0, (a as any).y));
  }
  return out;
}

function normalizeCompleteLook(raw: any): CompleteLook {
  const d = DEFAULT_COMPLETE_LOOK;
  const saved = raw && typeof raw === 'object' ? raw : {};
  const savedDefaults = saved.defaults && typeof saved.defaults === 'object' ? saved.defaults : {};
  const defaults = {} as Record<Category, Accessory[]>;
  (Object.keys(d.defaults) as Category[]).forEach((cat) => {
    const arr = savedDefaults[cat];
    defaults[cat] = Array.isArray(arr)
      ? arr.map(cleanLookItem).filter((x): x is Accessory => !!x).slice(0, 30)
      : [...d.defaults[cat]];
  });
  const text = (v: any, fb: string) => (typeof v === 'string' && v.trim() ? v : fb);
  return {
    title: text(saved.title, d.title).slice(0, 60),
    subtitle: text(saved.subtitle, d.subtitle).slice(0, 140),
    hint: text(saved.hint, d.hint).slice(0, 160),
    defaults,
  };
}

function normalize(c: SiteContent): SiteContent {
  const savedStore = c.store || {};
  const savedHero = (c as any).hero || {};
  const savedLooks = c.looks || {};
  // If the old default hero subtitle (menswear mention) is present, use the new ladies-only subtitle
  const OLD_SUB = 'Chaniya Choli, Kediyu-Dhoti and bridal couture';
  const heroSubtitle =
    typeof savedHero.subtitle === 'string' && savedHero.subtitle.includes(OLD_SUB)
      ? savedHero.subtitle.replace(OLD_SUB, 'Designer Chaniya Choli, bridal couture and jewellery')
      : typeof savedHero.subtitle === 'string' && savedHero.subtitle.trim()
        ? savedHero.subtitle
        : DEFAULT_CONTENT.hero.subtitle;
  // Remove mens/kids/combo images from previously saved photos
  const BANNED_IMG = /combo|kids|boys|kediya|kedia|angarkha|girls1/i;
  const looksImgs = Array.isArray(savedLooks.imgs)
    ? savedLooks.imgs.filter((s) => typeof s === 'string' && s.trim() && !BANNED_IMG.test(s))
    : [...DEFAULT_CONTENT.looks.imgs];
  // Migrate previously saved content to the new defaults (preserving client-written text)
  const savedFeatures: string[] = Array.isArray((c as any).features)
    ? (c as any).features.map((t: any) => String(t ?? '').replace(/100% Refundable Security Deposit/gi, '100% Refundable Extra (30%)'))
    : [...DEFAULT_CONTENT.features];
  if (!savedFeatures.some((t) => /secure/i.test(t))) savedFeatures.push('100% Secure QR Payments');
  const savedAnn = (c as any).announcement || {};
  const annMsg = savedAnn.msg === 'Rent from ₹799 · Same-day delivery'
    ? DEFAULT_CONTENT.announcement.msg
    : (savedAnn.msg ?? DEFAULT_CONTENT.announcement.msg);
  const savedMinPrice = (c as any).hero?.minPrice;
  const minPrice = savedMinPrice === '₹799' ? DEFAULT_CONTENT.hero.minPrice : (savedMinPrice ?? DEFAULT_CONTENT.hero.minPrice);
  const rawNote = typeof (c as any).shopNote === 'string' && (c as any).shopNote.trim()
    ? (c as any).shopNote.replace(/\s*[·•|]\s*Codes:.*$/i, '').replace(/1-day, 3-day or 9-day rentals/i, '1-day rentals').replace(/100% refundable deposit/i, '100% refundable 30% extra').trim()
    : '';
  const shopNote = rawNote || DEFAULT_CONTENT.shopNote;
  // Refundable extra % — admin sets it (0–90). Invalid/old values fall back to 30.
  // Note: null/undefined/'' = not set → 30. Explicit 0 = no extra (allowed).
  const rawPctIn = (c as any).refundablePct;
  const rawPct = rawPctIn == null || rawPctIn === '' ? NaN : Number(rawPctIn);
  const refundablePct = Number.isFinite(rawPct) ? Math.min(90, Math.max(0, Math.round(rawPct))) : 30;
  return {
    ...DEFAULT_CONTENT,
    ...c,
    refundablePct,
    store: {
      ...DEFAULT_CONTENT.store,
      ...savedStore,
      // Update the old brand name to the new one
      brand: !savedStore.brand || savedStore.brand === 'TheKissa.co.in'
        ? DEFAULT_CONTENT.store.brand
        : savedStore.brand,
      // Use the default if UPI is empty / old (migrate the previously saved value)
      upi: savedStore.upi?.trim() && savedStore.upi.trim() !== '9425417744@ptaxis' ? savedStore.upi : DEFAULT_CONTENT.store.upi,
      // Replace the old default email with the new admin email
      email: !savedStore.email || savedStore.email === 'hello@thekissa.in'
        ? DEFAULT_CONTENT.store.email
        : savedStore.email,
    },
    announcement: { ...DEFAULT_CONTENT.announcement, ...savedAnn, msg: annMsg },
    hero: { ...DEFAULT_CONTENT.hero, ...(c.hero || {}), subtitle: heroSubtitle, minPrice },
    features: savedFeatures,
    process: { ...DEFAULT_CONTENT.process, ...(c.process || {}) },
    looks: { ...DEFAULT_CONTENT.looks, ...(c.looks || {}), imgs: looksImgs },
    booking: {
      ...DEFAULT_CONTENT.booking,
      ...(c.booking || {}),
      // Replace the old "Presize available" point with "Free size available"
      points: Array.isArray((c as any).booking?.points)
        ? (c as any).booking.points.map((t: any) =>
            String(t ?? '').replace(/presize available/gi, 'Free size available'))
        : [...DEFAULT_CONTENT.booking.points],
    },
    footer: { ...DEFAULT_CONTENT.footer, ...(c.footer || {}), credit: typeof (c as any).footer?.credit === 'string' && (c as any).footer.credit.trim() && (c as any).footer.credit.trim() !== 'Built by Mayur' ? (c as any).footer.credit : DEFAULT_CONTENT.footer.credit },
    // Remove the old saved FAQ line ("wrong size..." sentence) + migrate the deposit answer to the 30% extra
    faqs: Array.isArray(c.faqs)
      ? c.faqs
        .filter((f: any) => !/buy instead of renting/i.test(String(f?.q ?? '')))
        .map((f: any) => ({
          q: String(f?.q ?? ''),
          a: String(f?.a ?? '')
            .replace(/ — a wrong size gets exchanged at your doorstep\./g, '')
            .replace(/^Yes, 100%\. Refunded via UPI\/cash within 24 hours of return and quality check\. Normal wear is never charged\.$/, 'Yes, 100%. Every dress has a 30% refundable extra over the rent — refunded via UPI/cash within 24 hours of return and quality check. Normal wear is never charged.'),
        }))
      : [...DEFAULT_CONTENT.faqs],
    // Remove "Codes: ..." from the old saved line, convert old plan text to 1-day
    shopNote,
    completeLook: normalizeCompleteLook((c as any).completeLook),
  };
}

export function getSiteContent(): SiteContent {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (valid(c)) return normalize(c);
    }
  } catch { /* ignore */ }
  return normalize({ ...DEFAULT_CONTENT });
}

export function saveSiteContent(c: SiteContent) {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
    window.dispatchEvent(new Event(EVT));
  } catch { /* ignore */ }
}

export function resetSiteContent(): SiteContent {
  const d = normalize({ ...DEFAULT_CONTENT });
  saveSiteContent(d);
  return d;
}

export function siteEvent(): string {
  return EVT;
}

/** Attach in website components so the screen updates automatically right after saving from Admin. */
export function useSiteVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV((x) => x + 1);
    const onVisible = () => {
      if (document.visibilityState === 'visible') bump();
    };
    const evt = siteEvent();
    window.addEventListener(evt, bump);
    window.addEventListener('storage', bump);
    window.addEventListener('focus', bump);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(evt, bump);
      window.removeEventListener('storage', bump);
      window.removeEventListener('focus', bump);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return v;
}

/** List like "NAVRATRI20, GROUP25" — for placeholders and notes */
export function promoCodesText(): string {
  return getSiteContent().promos.map((p) => p.code).join(' / ') || '—';
}
