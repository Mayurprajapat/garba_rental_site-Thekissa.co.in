// Invoice layout smoke test — 4 payment modes + lambe naam/items/address ke saath
// asli PDF generate karta hai (crash/overlap check). Chalao: node scripts/test-invoice.mjs
import { downloadInvoicePDF } from '../src/lib/invoice.ts';
import { jsPDF } from 'jspdf';
import fs from 'node:fs';

const base = {
  id: 'RL-2026-TEST',
  date: new Date().toISOString(),
  name: 'Priya Sharma With A Very Long Name For Wrapping',
  phone: '9876543210',
  event: '2026-10-20',
  deposit: 360,
  items: [
    { name: 'Mirror-Work Rainbow Chaniya Choli With Extra Long Name', detail: '1-day · Free size x1 + Oxidised jhumka, Kamarbandh (tagdi)', qty: 1, price: 1199 },
    { name: 'Wine Koti-Style Lehenga', detail: '1-day · Free size x2', qty: 2, price: 2998 },
    { name: 'Oxidised Jhumka - Pearl Drop', detail: 'RL-17 look · without dress', qty: 3, price: 387 },
    { name: 'Item 4', detail: 'detail', qty: 1, price: 500 },
    { name: 'Item 5', detail: 'detail', qty: 1, price: 500 },
    { name: 'Item 6', detail: 'detail', qty: 1, price: 500 },
    { name: 'Item 7', detail: 'detail', qty: 1, price: 500 },
    { name: 'Item 8', detail: 'detail', qty: 1, price: 500 },
  ],
  total: 7584,
};
const modes = [
  { mode: 'upi-qr-full', token: 7944 },
  { mode: 'upi-qr-half', token: 3792 },
  { mode: 'upi-qr', token: 499 },
  { mode: 'pay-on-delivery', token: 0 },
];
const opts = {
  brand: 'TheKissa.co',
  phone: '+91 62683 05900',
  email: 'support.thekissa.co.in@gmail.com',
  address: 'Online-only rental studio with a deliberately very long address line to test footer wrapping, Indore, Madhya Pradesh, India',
  paymentId: '123456789012',
};

// 1) Totals label collision check — har label apne font me 220pt column me fit hona chahiye
{
  const d = new jsPDF({ unit: 'pt', format: 'a4' });
  const labels = [
    ['Total rent', 12, 'bold'], ['Paid now (rent + extra)', 10.5, 'normal'],
    ['Paid now', 10.5, 'normal'], ['Balance on delivery', 10.5, 'normal'],
    ['Refundable extra 30%', 12, 'bold'], ['Total collection', 12, 'bold'],
  ];
  let bad = 0;
  for (const [t, size, style] of labels) {
    d.setFont('helvetica', style); d.setFontSize(size);
    const w = d.getTextWidth(t);
    const valW = 70; // value ke liye jagah
    if (w > 220 - valW) { console.log(`OVERLAP RISK: "${t}" = ${w.toFixed(0)}pt`); bad++; }
  }
  console.log(bad ? `labels: ${bad} FAIL` : 'labels: sab fit (PASS)');
  if (bad) process.exitCode = 1;
}

// 2) Chaaro mode me PDF banao — crash nahi hona chahiye, size > 0
for (const m of modes) {
  const file = `${process.cwd()}/invoice-test-${m.mode}.pdf`;
  try { fs.rmSync(file); } catch { /* ignore */ }
  downloadInvoicePDF({ ...base, mode: m.mode, token: m.token }, opts);
  const hits = fs.readdirSync(process.cwd()).filter((f) => f.startsWith('TheKissa-Invoice-RL-2026-TEST'));
  const st = hits.length ? fs.statSync(`${process.cwd()}/${hits[0]}`) : null;
  if (st && st.size > 2000) {
    console.log(`${m.mode}: PDF ok (${(st.size / 1024).toFixed(1)} KB) (PASS)`);
    fs.renameSync(`${process.cwd()}/${hits[0]}`, file);
  } else {
    console.log(`${m.mode}: PDF missing/empty (FAIL)`);
    process.exitCode = 1;
  }
}
console.log(process.exitCode ? 'RESULT: FAIL' : 'RESULT: sab invoice layout ok');
