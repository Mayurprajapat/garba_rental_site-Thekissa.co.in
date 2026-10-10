// TheKissa.co.in — single source of truth for store contact details.
// NUMBER/EMAIL AB CODE ME NAHI — Admin panel → Website → Store/Contact se badlo.
// Ye object hamesha wahi values deta hai (proxy), isliye save karte hi poori site update.

import { getSiteContent } from '../lib/siteContent';

export interface StoreShape {
  name: string;
  brand: string;
  tagline: string;
  phoneDisplay: string;
  phoneShort: string;
  phoneHref: string;
  waNumber: string;
  email: string;
  addressShort: string;
  addressLong: string;
  hours: string;
  hoursShort: string;
  city: string;
}

function digits(s: string): string {
  const d = (s || '').replace(/\D/g, '');
  // aakhri 10 digit = mobile, usse pehle 91 lagao
  const m = d.slice(-10).padStart(10, '0');
  return `91${m}`;
}

function current(): StoreShape {
  const s = getSiteContent().store;
  const wa = digits(s.phone);
  const m = wa.slice(-10);
  const pretty = `+91 ${m.slice(0, 5)} ${m.slice(5)}`;
  const short = `${m.slice(0, 5)} ${m.slice(5)}`;
  return {
    name: `${s.brand} Garba Rental`,
    brand: s.brand,
    tagline: 'GARBA RENTAL',
    phoneDisplay: pretty,
    phoneShort: short,
    phoneHref: `tel:+${wa}`,
    waNumber: wa,
    email: s.email,
    addressShort: s.addressShort,
    addressLong: s.addressLong,
    hours: s.hours,
    hoursShort: s.hoursShort,
    city: s.city,
  };
}

const FALLBACK: StoreShape = current();

export const STORE: StoreShape = new Proxy(FALLBACK, {
  get(_t, prop: string) {
    const c = current();
    return prop in c ? c[prop as keyof StoreShape] : undefined;
  },
});

export const waLink = (msg: string) =>
  `https://wa.me/${STORE.waNumber}?text=${encodeURIComponent(msg)}`;
