// The Kissa — single source of truth for store contact details.
// Client ka real phone/address mile to SIRF YAHI badlo — poori site + admin + invoice apne aap update.
export const STORE = {
  name: 'The Kissa Garba Rental',
  brand: 'The Kissa',
  tagline: 'GARBA RENTAL',
  // WhatsApp + call — same number, digits only for wa.me
  phoneDisplay: '+91 98765 43210',
  phoneShort: '98765 43210',
  phoneHref: 'tel:+919876543210',
  waNumber: '919876543210',
  email: 'hello@thekissa.in',
  addressShort: 'Online only · Doorstep delivery in Indore',
  addressLong: 'Online-only rental studio · Indore, Madhya Pradesh, India (no walk-in store — doorstep delivery & pickup)',
  hours: '10 AM – 9 PM daily (Navratri: till 10 PM)',
  hoursShort: '10 AM – 9 PM',
  city: 'Indore',
} as const;

export const waLink = (msg: string) =>
  `https://wa.me/${STORE.waNumber}?text=${encodeURIComponent(msg)}`;
