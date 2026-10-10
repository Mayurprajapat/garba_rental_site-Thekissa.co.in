// UPI QR payment — bina gateway ke, seedha dukandaar ke UPI account me.
// Customer QR scan karke apne UPI app (GPay/PhonePe/Paytm/BHIM) se token pay karta hai,
// phir UTR number dalta hai. Owner Admin → Bookings me payment verify karta hai.

import { getSiteContent } from './siteContent';

/** Dukandaar ki UPI ID (Admin → Website → Store/Contact se set hoti hai) */
export function merchantUpi(): string {
  return (getSiteContent().store.upi || '').trim();
}

export function isValidVpa(vpa: string): boolean {
  return /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test((vpa || '').trim());
}

/** UPI intent URL — QR me ye encode hota hai, mobile par link se app khulti hai */
export function upiUrl(pa: string, name: string, amount: number, note: string): string {
  const am = Math.max(0, amount).toFixed(2);
  const q = new URLSearchParams({ pa: pa.trim(), pn: name, am, cu: 'INR', tn: note.slice(0, 80) });
  return `upi://pay?${q.toString()}`;
}

/** UTR / UPI transaction ID — 12 digit hota hai, khaali bhi chalega (owner verify karega) */
export function isValidUtr(utr: string): boolean {
  const t = (utr || '').trim();
  return t === '' || /^\d{12}$/.test(t);
}
