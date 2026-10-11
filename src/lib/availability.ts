// Slot availability — pure helpers (zero imports, testable) + fetchers.
// Rental 1-day hai, isliye overlap sirf same event_date par hota hai.
// Cancelled bookings kabhi block nahi karte.

export interface BookingSlotRow {
  event_date: string | null;
  status?: string | null;
  items?: any[] | null;
}

/** Kisi product ke liye ek date par kitni qty already booked hai. */
export function countBookedOn(productId: string, dateISO: string, rows: BookingSlotRow[]): number {
  if (!productId || !dateISO) return 0;
  let n = 0;
  for (const b of rows) {
    if (!b || b.status === 'cancelled') continue;
    if (String(b.event_date || '') !== dateISO) continue;
    if (!Array.isArray(b.items)) continue;
    for (const it of b.items) {
      if (String(it?.id || '') === productId) n += Number(it?.qty) || 1;
    }
  }
  return n;
}

/** YYYY-MM-DD validate (aaj ya future). */
export function isPickableDate(dateISO: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO || '')) return false;
  const d = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime();
}
