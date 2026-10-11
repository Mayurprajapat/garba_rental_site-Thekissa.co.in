import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MyOrder } from './myOrders';

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
  doc.text('TAX INVOICE / RENTAL BILL', M, 92);

  doc.setFontSize(10);
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

  // Payment box (right)
  const boxX = W - M - 220;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.roundedRect(boxX, y - 12, 220, 52, 6, 6, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('PAYMENT', boxX + 12, y + 4);
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  const payLines = doc.splitTextToSize(paymentLabel(o.mode, o.token, o.total), 196);
  doc.text(payLines.slice(0, 2), boxX + 12, y + 19);

  y += 62;

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

  // Totals
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
  row('Total rent', inr(o.total), true);
  row('Paid now', inr(o.token));
  row('Balance on delivery', inr(Math.max(0, o.total - o.token)));
  row('Refundable deposit (you get back)', inr(o.deposit), true, [22, 120, 70]);
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

  // Notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const notes = [
    `You will get ${inr(o.deposit)} back via UPI/cash within 24 hours of return and quality check.`,
    'Every rental is 1 day (pickup / event / return). Late returns are charged per extra day.',
    'Thank you for renting with us! For help, contact us on call or WhatsApp.',
  ];
  notes.forEach((n) => {
    const lines = doc.splitTextToSize(`•  ${n}`, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 12 + 2;
  });

  // Footer band
  const fh = 64;
  doc.setFillColor(...ESPRESSO);
  doc.rect(0, doc.internal.pageSize.getHeight() - fh, W, fh, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, doc.internal.pageSize.getHeight() - fh, W, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(247, 234, 208);
  const fy = doc.internal.pageSize.getHeight() - fh + 22;
  doc.text(`${storeAddr}`, W / 2, fy, { align: 'center' });
  doc.setTextColor(232, 198, 106);
  doc.text(`${storePhone}${storePhone && storeEmail ? '   •   ' : ''}${storeEmail}`, W / 2, fy + 15, { align: 'center' });

  doc.save(`TheKissa-Invoice-${o.id}.pdf`);
}
