import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MyOrder } from './myOrders';
import { getRefundablePct } from './order';

const MAROON: [number, number, number] = [77, 15, 31];
const ESPRESSO: [number, number, number] = [43, 7, 14];
const GOLD: [number, number, number] = [176, 138, 46];
const GOLD_LIGHT: [number, number, number] = [240, 215, 140];
const INK: [number, number, number] = [34, 17, 20];
const MUTED: [number, number, number] = [120, 110, 105];

const inr = (n: number) => `Rs. ${(Number(n) || 0).toLocaleString('en-IN')}`;

function paymentLabel(mode: string, token: number, total: number): string {
  if (mode === 'upi-qr-full') return `Full payment ${inr(token)} via UPI QR (verification pending)`;
  if (mode === 'upi-qr-half')
    return `Half payment ${inr(token)} via UPI QR (verification pending) + Balance ${inr(total - token)} on delivery`;
  if (mode === 'upi-qr') return `Token ${inr(token)} via UPI QR (verification pending)`;
  return 'Pay on delivery';
}

/**
 * Designer invoice PDF — one tap download.
 * Premium look: maroon band, gold rules, clean item table. English only.
 */
export function downloadInvoicePDF(o: MyOrder, opts?: {
  brand?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentId?: string;
}) {
  const brand = opts?.brand || 'TheKissa.co';
  const storePhone = opts?.phone || '';
  const storeEmail = opts?.email || '';
  const storeAddr = opts?.address || 'Online-only rental studio, Indore, Madhya Pradesh';

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 44;
  let y = 0;

  // Top maroon band
  doc.setFillColor(...ESPRESSO);
  doc.rect(0, 0, W, 118, 'F');
  // Gold base rule of the band
  doc.setFillColor(...GOLD);
  doc.rect(0, 118, W, 3, 'F');

  doc.setTextColor(...GOLD_LIGHT);
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.text(brand, M, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(232, 198, 106);
  doc.text('G A R B A   &   F E S T I V E   R E N T A L S', M, 70);
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', M, 92);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...GOLD_LIGHT);
  doc.text(o.id, W - M, 52, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const dateStr = (() => { try { return new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } })();
  doc.text(`Date: ${dateStr}`, W - M, 70, { align: 'right' });
  doc.text(`Event: ${o.event || 'TBD'}`, W - M, 86, { align: 'right' });

  y = 152;

  // Billed-to block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('BILLED TO', M, y);
  doc.setTextColor(...INK);
  doc.setFontSize(13);
  doc.text(String(o.name || 'Customer'), M, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 70, 70);
  doc.text(`Mobile: ${o.phone || '-'}`, M, y + 34);

  // Payment box (right) — height text lines ke hisaab se (fixed box se text bahar nahi niklega)
  const boxX = W - M - 220;
  const payLines = doc.splitTextToSize(paymentLabel(o.mode, o.token, o.total), 196).slice(0, 3);
  const boxH = 34 + payLines.length * 13;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.roundedRect(boxX, y - 12, 220, boxH, 6, 6, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('PAYMENT', boxX + 12, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(payLines, boxX + 12, y + 19);

  // Items table — Billed-to block aur payment box dono ke neeche se shuru
  y = Math.max(y + 62, y - 12 + boxH + 14);

  // Items table
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['#', 'Item', 'Detail', 'Qty', 'Amount']],
    body: o.items.map((it, i) => [
      String(i + 1),
      String(it.name || ''),
      String(it.detail || ''),
      String(it.qty ?? 1),
      inr(Number(it.price) || 0),
    ]),
    styles: { font: 'helvetica', fontSize: 9.5, textColor: INK, cellPadding: 7, lineColor: [235, 225, 205], lineWidth: 0.5 },
    headStyles: { fillColor: MAROON, textColor: GOLD_LIGHT, fontStyle: 'bold', fontSize: 9.5 },
    alternateRowStyles: { fillColor: [253, 249, 240] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 36 },
      4: { halign: 'right', cellWidth: 78, fontStyle: 'bold' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 18;
  const H = doc.internal.pageSize.getHeight();
  const FH = 64;
  // Lambi item list ho to totals naya page par (footer se takrayenge nahi)
  if (y > H - FH - 150) { doc.addPage(); y = 60; }

  // Totals — label chhote rakhe hain taaki value se takrayein nahi (pehle lambi
  // line "Refundable extra 30% (30% of Rs.X rent)" value ke upar chadh jaati thi)
  const labelX = W - M - 220;
  const valX = W - M;
  const row = (label: string, value: string, bold = false, color: [number, number, number] = INK) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10.5);
    doc.setTextColor(...color);
    doc.text(label, labelX, y);
    doc.text(value, valX, y, { align: 'right' });
    y += bold ? 20 : 17;
  };
  row('Total', inr(o.total), true);
  row(o.mode === 'upi-qr-full' ? 'Paid now' : 'Paid now', inr(o.token));
  // Full me token me extra bhi hai — rent balance kabhi negative nahi
  const rentBal = o.mode === 'upi-qr-full' ? 0 : Math.max(0, o.total - o.token);
  const extraDue = o.mode === 'upi-qr-full' ? 0 : o.deposit;
  row('Balance on delivery', inr(rentBal + extraDue));
  if (o.deposit > 0) {
    // Order ke time jo rate laga tha wahi bill par — purane bill rate badalne par bhi sahi rahen.
    // deposit = rate% of rent, isliye stored values se wapas nikalo; na mile to current rate.
    let billPct = 0;
    try { billPct = getRefundablePct(); } catch { billPct = 30; }
    if (o.total > 0) {
      const derived = Math.round((o.deposit / o.total) * 100);
      if (derived >= 0 && derived <= 90) billPct = derived;
    }
    row(`Refundable extra ${billPct}%`, inr(o.deposit), true, [22, 120, 70]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`${billPct}% of ${inr(o.total)} — back on return`, labelX, y);
    y += 16;
  }
  row('Total collection', inr(o.total + o.deposit), true);
  if (opts?.paymentId) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`UTR / Txn ID: ${opts.paymentId}`, valX, y, { align: 'right' });
    y += 15;
  }

  // Gold divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(M, y + 4, W - M, y + 4);
  y += 22;

  // Notes — footer se takrayein to naya page
  if (y > H - FH - 70) { doc.addPage(); y = 60; }

  // Notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const notes = o.deposit > 0 ? [
    `Refundable extra ${inr(o.deposit)} — you will get it back via UPI/cash within 24 hours of return and quality check.`,
    'Rentals are 1 day (pickup / event / return). Buy items are yours forever — no return needed.',
    'Thank you for shopping with us! For help, contact us on call or WhatsApp.',
  ] : [
    'Buy order — yours forever, no return needed.',
    'Thank you for shopping with us! For help, contact us on call or WhatsApp.',
  ];
  notes.forEach((n) => {
    const lines = doc.splitTextToSize(`•  ${n}`, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 12 + 2;
  });

  // Footer band — lamba address/contact wrap hokar center me (kat-ta nahi)
  const fh = FH;
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...ESPRESSO);
  doc.rect(0, pageH - fh, W, fh, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, pageH - fh, W, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const addrLines = doc.splitTextToSize(storeAddr, W - M * 2).slice(0, 2);
  const contactLines = doc.splitTextToSize(`${storePhone}${storePhone && storeEmail ? '   •   ' : ''}${storeEmail}`, W - M * 2).slice(0, 1);
  const footCount = addrLines.length + contactLines.length;
  const footY = pageH - fh + (fh - footCount * 12) / 2 + 9;
  doc.setTextColor(247, 234, 208);
  doc.text(addrLines, W / 2, footY, { align: 'center' });
  doc.setTextColor(232, 198, 106);
  doc.text(contactLines, W / 2, footY + addrLines.length * 12, { align: 'center' });

  doc.save(`TheKissa-Invoice-${o.id}.pdf`);
}
