// Admin Reports — Dispatch list, Customers, Payment queue, Calendar, Promo report.
// Additive only: doesn't touch existing views/logic.
// Data comes from the same bookings state (cloud or local) — English labels only.

import { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarDays, CheckCircle2, Copy, Download, Search, Star, Users, Wallet } from 'lucide-react';
import { updateLocalBooking } from '../../lib/localAdmin';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import type { ChartBooking } from './Charts';

type B = ChartBooking & { [k: string]: any };

const inr = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const digits10 = (p: any) => String(p || '').replace(/\D/g, '').slice(-10);

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function copyText(t: string): boolean {
  try {
    if (navigator.clipboard) { navigator.clipboard.writeText(t); return true; }
  } catch { /* fallback below */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return true;
  } catch { return false; }
}

function downloadFile(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function itemsShort(b: B): string {
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return String(b.note || b.category || 'outfit').slice(0, 60);
  return items.slice(0, 3).map((it: any) => `${it?.name || it?.id || 'Outfit'}${it?.qty > 1 ? ` x${it.qty}` : ''}`).join(', ');
}

/* ============ 1. Dispatch day-list ============ */
function Dispatch({ bookings }: { bookings: B[] }) {
  const [day, setDay] = useState(todayKey());
  const list = useMemo(
    () => bookings.filter((b) => b && b.event_date === day && b.status !== 'cancelled')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
    [bookings, day]
  );
  const pretty = (() => { try { return new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return day; } })();

  const text = `Dispatch list — ${pretty} (${list.length} deliveries)\n` + list.map((b, i) => {
    // Full orders include the refundable extra in the token (rate admin panel se lagta hai); old full orders include rent only
    const extraInToken = String(b.payment_mode) === 'upi-qr-full' ? Math.max(0, Number(b.token_amount || 0) - Number(b.total || b.subtotal || 0)) : 0;
    const rentBal = String(b.payment_mode) === 'upi-qr-full' ? 0 : Math.max(0, Number(b.total || b.subtotal || 0) - Number(b.token_amount || 0));
    const extraDue = Math.max(0, Number(b.deposit || 0) - extraInToken);
    const due = rentBal + extraDue;
    return `${i + 1}. ${b.name} — ${b.phone}${b.address ? ` — ${b.address}` : ''} — ${itemsShort(b)} — Total ${inr(b.total || b.subtotal)}${due > 0 ? `, Collect ${inr(due)}${rentBal > 0 ? ` (rent ${inr(rentBal)})` : ''}${extraDue > 0 ? ` (extra ${inr(extraDue)})` : ''}` : ', Paid full'}`;
  }).join('\n');

  return (
    <div className="admin-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <b>Dispatch day-list</b>
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="admin-input !w-auto ml-auto" />
      </div>
      <p className="text-[12.5px] text-[#8a7584] mt-1">{pretty} — {list.length} deliver{list.length === 1 ? 'y' : 'ies'} (cancelled excluded)</p>
      {list.length === 0 ? (
        <p className="text-[13px] text-[#8a7584] mt-3">No deliveries on this date.</p>
      ) : (
        <>
          <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto">
            {list.map((b) => {
              const extraInToken = String(b.payment_mode) === 'upi-qr-full' ? Math.max(0, Number(b.token_amount || 0) - Number(b.total || b.subtotal || 0)) : 0;
              const rentBal = String(b.payment_mode) === 'upi-qr-full' ? 0 : Math.max(0, Number(b.total || b.subtotal || 0) - Number(b.token_amount || 0));
              const extraDue = Math.max(0, Number(b.deposit || 0) - extraInToken);
              const due = rentBal + extraDue;
              return (
                <div key={b.id} className="border border-[#1a0f1e]/8 rounded-xl p-3 text-[13px]">
                  <div className="flex items-center gap-2">
                    <b>{b.name}</b>
                    <a href={`tel:${b.phone}`} className="text-blue-700 hover:underline">{b.phone}</a>
                    <b className="ml-auto">{inr(b.total || b.subtotal)}</b>
                  </div>
                  <p className="text-[#3d2b36] mt-0.5">{itemsShort(b)}</p>
                  {b.address && <p className="text-[#3d2b36] mt-0.5">📍 {String(b.address)}</p>}
                  <p className="text-[12px] text-[#8a7584] mt-0.5">
                    {due > 0 ? `Collect ${inr(due)}${rentBal > 0 ? ` (rent ${inr(rentBal)})` : ''}${extraDue > 0 ? ` (extra ${inr(extraDue)})` : ''}` : 'Paid full — extra already received'}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => copyText(text)} className="text-[13px] font-semibold border rounded-xl px-4 py-2.5 flex items-center gap-1.5 hover:bg-black hover:text-white transition"><Copy size={14} /> Copy list</button>
            <button onClick={() => downloadFile(`dispatch-${day}.txt`, text)} className="text-[13px] font-semibold border rounded-xl px-4 py-2.5 flex items-center gap-1.5 hover:bg-black hover:text-white transition"><Download size={14} /> Download .txt</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============ 2. Customer list ============ */
function Customers({ bookings }: { bookings: B[] }) {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const m = new Map<string, { phone: string; name: string; orders: number; revenue: number; last: string }>();
    for (const b of bookings) {
      const p = digits10(b?.phone);
      if (p.length < 10) continue;
      const r = m.get(p) || { phone: p, name: '', orders: 0, revenue: 0, last: '' };
      r.orders += 1;
      if (b.status !== 'cancelled') r.revenue += Number(b.total ?? b.subtotal ?? 0);
      if (String(b.created_at || '') > r.last) { r.last = String(b.created_at || ''); r.name = String(b.name || r.name); }
      m.set(p, r);
    }
    const s = q.trim().toLowerCase();
    return [...m.values()]
      .filter((r) => !s || r.name.toLowerCase().includes(s) || r.phone.includes(s.replace(/\D/g, '')))
      .sort((a, b) => b.revenue - a.revenue);
  }, [bookings, q]);

  return (
    <div className="admin-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <b>Customers</b>
        <span className="text-[12px] text-[#8a7584]">{rows.length} unique</span>
        <label className="ml-auto flex items-center gap-2 bg-white border rounded-xl px-3.5">
          <Search size={15} className="text-[#8a7584] shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or mobile…" className="py-2 outline-none w-44 sm:w-56 text-sm bg-transparent" />
        </label>
      </div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-[#8a7584] mt-3">No customers yet.</p>
      ) : (
        <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto">
          {rows.map((r) => (
            <div key={r.phone} className="flex items-center gap-2.5 border border-[#1a0f1e]/8 rounded-xl p-3 text-[13px]">
              <span className="w-9 h-9 rounded-full grid place-items-center bg-[#1a0f1e] text-[#e8c66a] shrink-0"><Users size={15} /></span>
              <div className="min-w-0">
                <b className="block truncate">{r.name || 'Customer'}</b>
                <a href={`tel:${r.phone}`} className="text-blue-700 hover:underline">{r.phone}</a>
                <span className="text-[#8a7584]"> · {r.orders} order{r.orders === 1 ? '' : 's'}</span>
              </div>
              <div className="ml-auto text-right shrink-0">
                <b className="block">{inr(r.revenue)}</b>
                <a href={`https://wa.me/91${r.phone}?text=${encodeURIComponent(`Hello ${r.name || 'Customer'}! TheKissa.co — new festive outfits have arrived. Reply HI to see them.`)}`} target="_blank" className="text-[12px] font-bold text-emerald-700 hover:underline">WhatsApp →</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ 3. Payment verification queue ============ */
const QR_MODES = ['upi-qr', 'upi-qr-full', 'upi-qr-half'];

function Payments({ bookings, reload }: { bookings: B[]; reload: () => void }) {
  const [busy, setBusy] = useState<number | string | null>(null);
  const [msg, setMsg] = useState('');
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const list = useMemo(
    () => bookings.filter((b) => b && QR_MODES.includes(String(b.payment_mode)) && b.payment_status !== 'verified')
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || ''))),
    [bookings]
  );

  const setPayStatus = async (b: B, next: 'verified' | 'rejected') => {
    setBusy(b.id);
    setMsg('');
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('bookings').update({ payment_status: next }).eq('id', b.id);
        if (error) throw error;
      } else {
        updateLocalBooking(Number(b.id), { payment_status: next });
      }
      setMsg(next === 'verified' ? `Payment verified for ${b.order_id || b.name}.` : `Payment flagged as wrong for ${b.order_id || b.name} — customer sees it in My Orders.`);
      reload();
    } catch (e: any) {
      setMsg('Could not save: ' + (e?.message || 'unknown error'));
    } finally {
      setBusy(null);
    }
  };

  const copyUtr = (b: B) => {
    if (copyText(String(b.payment_id || ''))) {
      setCopiedId(b.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <div className="admin-card p-5">
      <div className="flex items-baseline gap-2">
        <b>Payment verification queue</b>
        <span className="ml-auto text-[12px] font-bold text-amber-700">{list.length} pending</span>
      </div>
      {msg && <p className="text-[12.5px] bg-white border rounded-xl px-3 py-2 mt-2">{msg}</p>}
      {list.length === 0 ? (
        <p className="text-[13px] text-[#8a7584] mt-3">All QR payments verified. 🎉</p>
      ) : (
        <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto">
          {list.map((b) => (
            <div key={b.id} className="border border-amber-200 bg-amber-50/50 rounded-xl p-3 text-[13px]">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0">
                  <b>{b.order_id || `#${String(b.id).slice(-6)}`}</b>
                  <span className="text-[#3d2b36]"> · {b.name} · </span>
                  <a href={`tel:${b.phone}`} className="text-blue-700 hover:underline">{b.phone}</a>
                </div>
                <b className="ml-auto">{inr(b.token_amount)}</b>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[12px] text-[#8a7584]">{b.payment_mode} · UTR:</span>
                <b className="text-[12.5px]">{b.payment_id || 'not shared'}</b>
                {b.payment_id && (
                  <button onClick={() => copyUtr(b)} title="Copy UTR — paste it in your bank/UPI app to check"
                    className="text-[11.5px] font-bold border rounded-full px-2.5 py-1 bg-white hover:bg-black hover:text-white transition flex items-center gap-1">
                    <Copy size={11} /> {copiedId === b.id ? 'Copied ✓' : 'Copy UTR'}
                  </button>
                )}
              </div>
              {b.payment_proof ? (
                <a href={String(b.payment_proof)} target="_blank" title="Open full screenshot" className="flex items-center gap-2.5 mt-2 border border-black/10 bg-white rounded-xl p-2 hover:border-black transition w-fit">
                  <img src={String(b.payment_proof)} alt="Payment screenshot" className="w-14 h-14 object-contain rounded-lg border" />
                  <span className="text-[12px] font-bold underline pr-2">View screenshot →</span>
                </a>
              ) : (
                <p className="text-[12px] text-amber-700 font-semibold mt-2">No screenshot attached to this order.</p>
              )}
              <div className="mt-2">
                <a href={`https://wa.me/91${digits10(b.phone)}?text=${encodeURIComponent(`Hello ${b.name || 'Customer'}! TheKissa.co — for order ${b.order_id || ''} (${inr(b.token_amount)} via QR), please share your payment screenshot here. Thank you!`)}`} target="_blank"
                  title="Ask customer for payment screenshot on WhatsApp"
                  className="text-[11.5px] font-bold border border-emerald-300 text-emerald-700 rounded-full px-2.5 py-1 hover:bg-emerald-600 hover:text-white transition">
                  Ask screenshot →
                </a>
              </div>
              <div className="flex gap-1.5 mt-2">
                <button disabled={busy === b.id} onClick={() => setPayStatus(b, 'verified')} title="Press when the amount + UTR match the bank statement"
                  className="flex-1 text-[12px] font-bold bg-emerald-600 text-white rounded-full px-3 py-1.5 disabled:opacity-50 hover:brightness-110 transition flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} /> {busy === b.id ? '…' : '✓ Correct — Verify'}
                </button>
                <button disabled={busy === b.id} onClick={() => setPayStatus(b, 'rejected')} title="Press if the UTR is wrong / payment not received — the customer will be notified"
                  className="flex-1 text-[12px] font-bold border border-rose-300 text-rose-700 rounded-full px-3 py-1.5 disabled:opacity-50 hover:bg-rose-600 hover:text-white transition">
                  {busy === b.id ? '…' : '✕ Wrong — Flag'}
                </button>
              </div>
              {b.payment_status === 'rejected' && <p className="text-[11.5px] text-rose-700 font-semibold mt-1.5">Flagged wrong — customer sees “payment needs attention” in My Orders.</p>}
            </div>
          ))}
        </div>
      )}
      <p className="text-[11.5px] text-[#8a7584] mt-2">Flow: Copy UTR → check it in your bank/UPI app → Correct = Verify, Wrong = Flag. Copy the UTR from here.</p>
    </div>
  );
}

/* ============ 4. Event calendar ============ */
function EventCalendar({ bookings }: { bookings: B[] }) {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState(todayKey());
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bookings) {
      if (!b || !b.event_date || b.status === 'cancelled') continue;
      m.set(String(b.event_date), (m.get(String(b.event_date)) || 0) + 1);
    }
    return m;
  }, [bookings]);
  const first = new Date(ym.y, ym.m, 1);
  const startPad = (first.getDay() + 7 - 1) % 7; // Monday-first
  const dim = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(startPad).fill(null)];
  for (let d = 1; d <= dim; d++) cells.push(`${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  const title = first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const dayList = bookings.filter((b) => b && b.event_date === sel);

  return (
    <div className="admin-card p-5">
      <div className="flex items-center gap-2">
        <b>Event calendar</b>
        <div className="ml-auto flex gap-1">
          <button onClick={() => setYm((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: v.m === 0 ? 11 : v.m - 1 }))} className="w-8 h-8 grid place-items-center rounded-lg border hover:bg-black hover:text-white transition">‹</button>
          <span className="text-[13px] font-bold px-2 self-center whitespace-nowrap">{title}</span>
          <button onClick={() => setYm((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: v.m === 11 ? 0 : v.m + 1 }))} className="w-8 h-8 grid place-items-center rounded-lg border hover:bg-black hover:text-white transition">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mt-3 text-center text-[10.5px] font-bold text-[#8a7584]">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-1">
        {cells.map((k, i) => {
          if (!k) return <span key={`e${i}`} />;
          const n = counts.get(k) || 0;
          const dnum = Number(k.slice(-2));
          return (
            <button key={k} onClick={() => setSel(k)}
              className={`rounded-lg py-1.5 text-[12.5px] font-semibold border transition ${sel === k ? 'bg-[#1a0f1e] text-white border-[#1a0f1e]' : n ? 'bg-[#e8c66a]/25 border-[#e8c66a]/60 hover:border-black' : 'bg-white hover:border-black/30'}`}>
              {dnum}
              {n > 0 && <span className={`block text-[10px] font-bold ${sel === k ? 'text-[#e8c66a]' : 'text-[#8e1a4f]'}`}>{n}</span>}
            </button>
          );
        })}
      </div>
      <p className="text-[12.5px] font-bold mt-3">{dayList.length} booking{dayList.length === 1 ? '' : 's'} on {sel}</p>
      <div className="mt-1.5 space-y-1.5 max-h-[220px] overflow-y-auto">
        {dayList.map((b) => (
          <div key={b.id} className="flex items-center gap-2 text-[13px] border-t border-[#1a0f1e]/5 pt-1.5">
            <b>{b.order_id || `#${String(b.id).slice(-6)}`}</b>
            <span className="truncate">{b.name}</span>
            <span className="ml-auto text-[11px] font-bold capitalize text-[#8a7584]">{b.status}</span>
          </div>
        ))}
        {dayList.length === 0 && <p className="text-[13px] text-[#8a7584]">Nothing booked this day.</p>}
      </div>
    </div>
  );
}

/* ============ 5. Promo report ============ */
function Promos({ bookings }: { bookings: B[] }) {
  const rows = useMemo(() => {
    const m = new Map<string, { code: string; orders: number; revenue: number }>();
    for (const b of bookings) {
      const code = String(b?.promo_code || '').trim().toUpperCase() || 'NO CODE';
      const r = m.get(code) || { code, orders: 0, revenue: 0 };
      r.orders += 1;
      if (b.status !== 'cancelled') r.revenue += Number(b.total ?? b.subtotal ?? 0);
      m.set(code, r);
    }
    return [...m.values()].sort((a, b) => b.orders - a.orders);
  }, [bookings]);

  return (
    <div className="admin-card p-5">
      <b>Promo report</b>
      <p className="text-[12px] text-[#8a7584] mt-0.5">Code tracking runs on new orders — older orders show as “No code”.</p>
      {rows.length === 0 ? (
        <p className="text-[13px] text-[#8a7584] mt-3">No orders yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {rows.map((r) => (
            <div key={r.code} className="flex items-center gap-2.5 border border-[#1a0f1e]/8 rounded-xl p-3 text-[13px]">
              <span className={`font-bold rounded-full px-3 py-1 text-[12px] tracking-wide ${r.code === 'NO CODE' ? 'bg-black/5 text-black/50' : 'bg-[#1a0f1e] text-[#e8c66a]'}`}>{r.code}</span>
              <span className="text-[#3d2b36]">{r.orders} order{r.orders === 1 ? '' : 's'}</span>
              <b className="ml-auto">{inr(r.revenue)}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ 6. Photo reviews moderation ============ */
interface CloudReview {
  id: number | string;
  product_id: string;
  name: string;
  rating: number;
  text: string;
  photo_url: string;
  status: string;
  created_at: string;
}

function ReviewsAdmin() {
  const [rows, setRows] = useState<CloudReview[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState<number | string | null>(null);
  const cloud = isSupabaseConfigured && !!supabase;

  const load = async () => {
    if (!cloud || !supabase) return;
    try {
      const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(100);
      if (Array.isArray(data)) setRows(data as any);
    } catch { /* ignore */ }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: number | string, status: 'approved' | 'rejected') => {
    if (!supabase) return;
    setBusy(id);
    try {
      const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
      if (error) throw error;
      setMsg(status === 'approved' ? 'Review approved — live on the website.' : 'Review rejected.');
      load();
    } catch (e: any) {
      setMsg('Could not save: ' + (e?.message || 'unknown error'));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: number | string) => {
    if (!supabase) return;
    if (!confirm('Delete this review permanently?')) return;
    setBusy(id);
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      load();
    } catch (e: any) {
      setMsg('Could not delete: ' + (e?.message || 'unknown error'));
    } finally {
      setBusy(null);
    }
  };

  if (!cloud) {
    return (
      <div className="admin-card p-5">
        <b>Photo reviews</b>
        <p className="text-[13px] text-[#8a7584] mt-2">Shared reviews need the cloud database. Customers on this device can still save their own reviews (visible on their device only).</p>
      </div>
    );
  }

  const pending = rows.filter((r) => r.status === 'pending');
  const live = rows.filter((r) => r.status === 'approved');
  const card = (r: CloudReview) => (
    <div key={r.id} className="border border-[#1a0f1e]/8 rounded-xl p-3 text-[13px]">
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={11} className={i <= Number(r.rating) ? 'fill-[#c9960a] text-[#c9960a]' : 'text-black/20'} />
          ))}
        </span>
        <b>{r.name}</b>
        <span className="text-[#8a7584] text-[11.5px]">{r.product_id}</span>
      </div>
      <p className="text-[#3d2b36] mt-1">{r.text}</p>
      {r.photo_url && <a href={r.photo_url} target="_blank"><img src={r.photo_url} alt="Customer Garba look" loading="lazy" className="mt-1.5 w-16 h-16 object-contain rounded-xl border hover:opacity-90 transition" /></a>}
      <div className="flex gap-1.5 mt-2">
        {r.status === 'pending' && (
          <button disabled={busy === r.id} onClick={() => setStatus(r.id, 'approved')} className="text-[12px] font-bold bg-emerald-600 text-white rounded-full px-3.5 py-1.5 disabled:opacity-50">Approve</button>
        )}
        {r.status === 'pending' && (
          <button disabled={busy === r.id} onClick={() => setStatus(r.id, 'rejected')} className="text-[12px] font-bold border border-rose-300 text-rose-700 rounded-full px-3.5 py-1.5 disabled:opacity-50">Reject</button>
        )}
        <button disabled={busy === r.id} onClick={() => remove(r.id)} className="ml-auto text-[12px] font-bold text-rose-700 underline disabled:opacity-50">Delete</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {msg && <p className="text-[12.5px] bg-white border rounded-xl px-3 py-2">{msg}</p>}
      <div className="admin-card p-5">
        <div className="flex items-baseline gap-2">
          <b>Pending approval</b>
          <span className="ml-auto text-[12px] font-bold text-amber-700">{pending.length} waiting</span>
        </div>
        <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto">
          {pending.map(card)}
          {pending.length === 0 && <p className="text-[13px] text-[#8a7584]">Nothing waiting. 🎉</p>}
        </div>
      </div>
      <div className="admin-card p-5">
        <b>Live on website ({live.length})</b>
        <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto">
          {live.map(card)}
          {live.length === 0 && <p className="text-[13px] text-[#8a7584]">No approved reviews yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* ============ Reports shell with sub-tabs ============ */
type Tab = 'dispatch' | 'customers' | 'payments' | 'calendar' | 'promos' | 'reviews';

export default function Reports({ bookings, reload }: { bookings: B[]; reload: () => void }) {
  const [tab, setTab] = useState<Tab>('dispatch');
  const pending = bookings.filter((b) => b && QR_MODES.includes(String(b.payment_mode)) && b.payment_status !== 'verified').length;
  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'dispatch', label: 'Dispatch', icon: CalendarDays },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'payments', label: 'Payments', icon: Wallet, badge: pending || undefined },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'promos', label: 'Promos', icon: BellRing },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];
  return (
    <div>
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-xs font-bold rounded-full px-3.5 py-1.5 border flex items-center gap-1.5 ${tab === t.id ? 'bg-[#1a0f1e] text-white border-[#1a0f1e]' : 'bg-white'}`}>
            <t.icon size={13} /> {t.label}
            {t.badge ? <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5">{t.badge}</span> : null}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tab === 'dispatch' && <Dispatch bookings={bookings} />}
        {tab === 'customers' && <Customers bookings={bookings} />}
        {tab === 'payments' && <Payments bookings={bookings} reload={reload} />}
        {tab === 'calendar' && <EventCalendar bookings={bookings} />}
        {tab === 'promos' && <Promos bookings={bookings} />}
        {tab === 'reviews' && <ReviewsAdmin />}
      </div>
      <p className="text-[11.5px] text-[#8a7584] mt-3 flex items-center gap-1.5"><Search size={12} /> Reports only read data — nothing here edits or deletes bookings.</p>
    </div>
  );
}
