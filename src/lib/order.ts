// Order helpers — professional booking flow ke liye
// Order ID format: RL-2026-XXXX (human readable + invoice friendly)

export function makeOrderId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `RL-${year}-${rand}`;
}

import { getSiteContent } from './siteContent';

// Refundable extra percentage — read from Admin → Website → Store settings.
// Falls back to 30 if not set (legacy installations).
// NOTE: always call this fresh — admin can change it from the panel,
// so never cache it in a module-level const.
export function getRefundablePct(): number {
  try {
    const c = getSiteContent();
    if (c && typeof c.refundablePct === 'number' && Number.isFinite(c.refundablePct)) {
      const v = Math.round(c.refundablePct);
      if (v >= 0 && v <= 90) return v;
    }
  } catch { /* ignore */ }
  return 30;
}

export function tokenAdvance(total: number): number {
  if (total <= 0) return 0;
  // Legacy: 20% ya minimum ₹499 — jo bada ho, total se zyada nahi
  // (purane orders ke display ke liye rakha hai; naya flow halfAdvance use karta hai)
  return Math.min(total, Math.max(499, Math.round(total * 0.2)));
}

/** Half payment — order ke time 50% advance, baaki 50% delivery par. */
export function halfAdvance(total: number): number {
  if (total <= 0) return 0;
  return Math.round(total / 2);
}

/** Refundable extra — har dress par rent ka {pct}%, return par wapas. Admin panel se badalta hai. */
export function refundablePct(): number {
  return getRefundablePct();
}

/** @deprecated Use getRefundablePct() — this const goes stale after admin changes the rate. */
export const REFUNDABLE_PCT = 30;

export function refundableExtra(rent: number): number {
  if (!(rent > 0)) return 0;
  return Math.round((rent * getRefundablePct()) / 100);
}

export function formatINR(n: number): string {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''));
}
