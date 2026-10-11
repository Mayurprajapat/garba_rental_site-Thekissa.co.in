// Order helpers — professional booking flow ke liye
// Order ID format: RL-2026-XXXX (human readable + invoice friendly)

export function makeOrderId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `RL-${year}-${rand}`;
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

/** Refundable extra — har dress par rent ka 30%, return par wapas. */
export const REFUNDABLE_PCT = 30;

export function refundableExtra(rent: number): number {
  if (!(rent > 0)) return 0;
  return Math.round((rent * REFUNDABLE_PCT) / 100);
}

export function formatINR(n: number): string {
  return `₹${(n || 0).toLocaleString('en-IN')}`;
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''));
}
