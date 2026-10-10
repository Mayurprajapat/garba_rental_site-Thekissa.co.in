// TheKissa.co.in — single source of truth for store contact details.
// Client ka real phone/address mile to SIRF YAHI badlo — poori site + admin + invoice apne aap update.
export const STORE = {
  name: 'TheKissa.co.in Garba Rental',
  brand: 'TheKissa.co.in',
  tagline: 'GARBA RENTAL',
  // WhatsApp + call — same number, digits only for wa.me
  phoneDisplay: '+91 62683 05900',
  phoneShort: '62683 05900',
  phoneHref: 'tel:+916268305900',
  waNumber: '916268305900',
  email: 'hello@thekissa.in',
  addressShort: 'Online only · Doorstep delivery in Indore',
  addressLong: 'Online-only rental studio · Indore, Madhya Pradesh, India (no walk-in store — doorstep delivery & pickup)',
  hours: 'Delivery 9 AM – 10 PM daily (Navratri day 3–6: 4 PM – 10 PM)',
  hoursShort: '9 AM – 10 PM',
  city: 'Indore',
} as const;

export const waLink = (msg: string) =>
  `https://wa.me/${STORE.waNumber}?text=${encodeURIComponent(msg)}`;
