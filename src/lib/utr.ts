// UTR genuineness guards — pure (zero imports, testable).
// Note: only the payment gateway can prove a typed UTR's 100% authenticity;
// these guards catch lazy/fake and reused UTRs instantly.

/** Sequential / repeated / placeholder 12-digit UTRs that are never real. */
export function looksFakeUtr(utr: string): boolean {
  const s = String(utr || '').trim();
  if (!/^\d{12}$/.test(s)) return true;
  if (/^(\d)\1{11}$/.test(s)) return true; // 000... / 777... etc
  const asc = '01234567890123456789';
  const desc = '98765432109876543210';
  if (asc.includes(s) || desc.includes(s)) return true; // 1234... / 9876...
  // Fabricated numbers like 123456789xxx / 987654321xxx (first 9 digits sequential)
  const head9 = s.slice(0, 9);
  if (asc.includes(head9) || desc.includes(head9)) return true;
  return false;
}
