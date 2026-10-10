// Website content — Admin panel → Website tab se sab kuch badlo, Tumhe code haath nahi lagana padega.
// Store number, banner, hero, features, promo codes, steps, photos, FAQs, booking panel, footer.
// Save karte hi website par live (is browser me). Products/Categories wali tarah localStorage me rehta hai.

import { useEffect, useState } from 'react';

export interface StoreInfo {
  brand: string;
  /** mobile number — 10 digit ya +91 ke saath, display format apne aap banta hai */
  phone: string;
  email: string;
  city: string;
  addressShort: string;
  addressLong: string;
  hours: string;
  hoursShort: string;
  /** QR payment ke liye dukandaar ki UPI ID (jaise name@okhdfc) — Admin → Website → Store se badlo */
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
  footer: { about: string; delivery: string };
  shopNote: string;
}

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
  features: ['Dry-cleaned & Sanitized', '100% Refundable Security Deposit', '100% Secure QR Payments', 'Live Availability Tracking'],
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
    { q: 'Is the deposit refundable?', a: 'Yes, 100%. Refunded via UPI/cash within 24 hours of return and quality check. Normal wear is never charged.' },
    { q: 'What about stains or minor damage?', a: 'Light dry-cleanable stains are on us. Major damage is charged at repair cost only — optional ₹199 damage cover removes the worry.' },
    { q: 'Where do you deliver?', a: '1-2 hours delivery in Indore. Free delivery on bulk orders.' },
    { q: 'Can I buy instead of renting?', a: 'Yes — every design is available for purchase at roughly 2.5× the rental price. Message “BUY” with the product ID on WhatsApp.' },
  ],
  booking: {
    title: 'Reserve your outfit in two minutes',
    subtitle: 'Fill the form — it opens your email app with everything pre-written. Send it and your outfit enquiry is locked.',
    points: ['Free size available', 'Same-day slots in Indore', 'Refundable deposit, no hidden fees'],
  },
  footer: {
    about: 'Designer Garba outfits on rent — perfect fitting, doorstep delivery, easy return.',
    delivery: 'Online only — no walk-in store',
  },
  shopNote: '1-day rentals · 100% refundable deposit · 100% secure QR payments',
};

const KEY = 'raasleela-site-content';
const EVT = 'raasleela-site-updated';

function valid(c: any): c is SiteContent {
  return !!c && typeof c === 'object' && !!c.store && typeof c.store.phone === 'string' && Array.isArray(c.promos) && Array.isArray(c.faqs);
}

function normalize(c: SiteContent): SiteContent {
  const savedStore = c.store || {};
  const savedHero = c.hero || {};
  const savedLooks = c.looks || {};
  // Purana default hero subtitle (menswear mention) ho to naya ladies-only subtitle
  const OLD_SUB = 'Chaniya Choli, Kediyu-Dhoti and bridal couture';
  const heroSubtitle =
    typeof savedHero.subtitle === 'string' && savedHero.subtitle.includes(OLD_SUB)
      ? savedHero.subtitle.replace(OLD_SUB, 'Designer Chaniya Choli, bridal couture and jewellery')
      : typeof savedHero.subtitle === 'string' && savedHero.subtitle.trim()
        ? savedHero.subtitle
        : DEFAULT_CONTENT.hero.subtitle;
  // Purani saved photos me mens/kids/combo images hon to hata do
  const BANNED_IMG = /combo|kids|boys|kediya|kedia|angarkha|girls1/i;
  const looksImgs = Array.isArray(savedLooks.imgs)
    ? savedLooks.imgs.filter((s) => typeof s === 'string' && s.trim() && !BANNED_IMG.test(s))
    : [...DEFAULT_CONTENT.looks.imgs];
  // Purani saved content ko naye defaults par migrate karo (client ka likha hua safe)
  const savedFeatures: string[] = Array.isArray((c as any).features)
    ? (c as any).features.map((t: any) => String(t ?? ''))
    : [...DEFAULT_CONTENT.features];
  if (!savedFeatures.some((t) => /secure/i.test(t))) savedFeatures.push('100% Secure QR Payments');
  const savedAnn = (c as any).announcement || {};
  const annMsg = savedAnn.msg === 'Rent from ₹799 · Same-day delivery'
    ? DEFAULT_CONTENT.announcement.msg
    : (savedAnn.msg ?? DEFAULT_CONTENT.announcement.msg);
  const savedMinPrice = (c as any).hero?.minPrice;
  const minPrice = savedMinPrice === '₹799' ? DEFAULT_CONTENT.hero.minPrice : (savedMinPrice ?? DEFAULT_CONTENT.hero.minPrice);
  const rawNote = typeof (c as any).shopNote === 'string' && (c as any).shopNote.trim()
    ? (c as any).shopNote.replace(/\s*[·•|]\s*Codes:.*$/i, '').replace(/1-day, 3-day or 9-day rentals/i, '1-day rentals').trim()
    : '';
  const shopNote = rawNote || DEFAULT_CONTENT.shopNote;
  return {
    ...DEFAULT_CONTENT,
    ...c,
    store: {
      ...DEFAULT_CONTENT.store,
      ...savedStore,
      // Purana brand naam ho to naya kar do
      brand: !savedStore.brand || savedStore.brand === 'TheKissa.co.in'
        ? DEFAULT_CONTENT.store.brand
        : savedStore.brand,
      // UPI khaali / purani ho to default (pehle save ho chuki value migrate)
      upi: savedStore.upi?.trim() && savedStore.upi.trim() !== '9425417744@ptaxis' ? savedStore.upi : DEFAULT_CONTENT.store.upi,
      // Purana default email ho to naya admin email kar do
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
      // Purana "Presize available" point ho to "Free size available" kar do
      points: Array.isArray((c as any).booking?.points)
        ? (c as any).booking.points.map((t: any) =>
            String(t ?? '').replace(/presize available/gi, 'Free size available'))
        : [...DEFAULT_CONTENT.booking.points],
    },
    footer: { ...DEFAULT_CONTENT.footer, ...(c.footer || {}) },
    // Purani saved FAQ line hata do ("wrong size..." sentence)
    faqs: Array.isArray(c.faqs)
      ? c.faqs.map((f: any) => ({
          q: String(f?.q ?? ''),
          a: String(f?.a ?? '').replace(/ — a wrong size gets exchanged at your doorstep\./g, ''),
        }))
      : [...DEFAULT_CONTENT.faqs],
    // Purani saved line me "Codes: ..." ho to hata do, purana plan text ho to 1-day kar do
    shopNote,
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

/** Website components me lagao taaki Admin se save karte hi screen apne aap update ho. */
export function useSiteVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV((x) => x + 1);
    const evt = siteEvent();
    window.addEventListener(evt, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(evt, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);
  return v;
}

/** "NAVRATRI20, GROUP25" jaisi list — placeholder aur notes ke liye */
export function promoCodesText(): string {
  return getSiteContent().promos.map((p) => p.code).join(' / ') || '—';
}
