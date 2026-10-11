// UTR genuineness guards — pure (zero imports, testable).
// Note: typed UTR ki 100% authenticity sirf payment gateway de sakta hai;
// ye guards lazy/fake aur reuse wale UTR turant pakadte hain.

/** Sequential / repeated / placeholder 12-digit UTR jo real kabhi nahi hota. */
export function looksFakeUtr(utr: string): boolean {
  const s = String(utr || '').trim();
  if (!/^\d{12}$/.test(s)) return true;
  if (/^(\d)\1{11}$/.test(s)) return true; // 000... / 777... etc
  const asc = '01234567890123456789';
  const desc = '98765432109876543210';
  if (asc.includes(s) || desc.includes(s)) return true; // 1234... / 9876...
  // 123456789xxx / 987654321xxx jaise gade hue number (pehle 9 digit sequence)
  const head9 = s.slice(0, 9);
  if (asc.includes(head9) || desc.includes(head9)) return true;
  return false;
}
