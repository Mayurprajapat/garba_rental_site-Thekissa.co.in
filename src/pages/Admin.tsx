import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  CalendarDays,
  Eye,
  EyeOff,
  Globe,
  IndianRupee,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  Store,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  ADMIN_PATH,
  adminLockRemaining,
  clearAdminFails,
  deleteLocalBooking,
  getLocalBookings,
  getLocalProducts,
  hasCustomPassword,
  isLocalAdmin,
  recordAdminFail,
  saveLocalProducts,
  setAdminPassword,
  setLocalAdmin,
  updateLocalBooking,
  verifyAdminPassword,
  type LocalBooking,
} from '../lib/localAdmin';
import { dataUrlToBlob, fileToCompressedDataUrl } from '../lib/proof';
import { categoriesEvent, dressInTile, getCategories, itemInTile, pullCategoriesFromCloud, pushCategoriesToCloud, resetCategories, saveCategories, type ShopCategory } from '../lib/categories';
import type { Accessory } from '../data/products';
import { ALL_SIZES, normalizeSizes, normalizeTags } from '../data/products';
import { singlesFor } from '../components/Shop';
import type { LiveProduct } from '../lib/ProductsContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import DeliveriesPanel from './admin/DeliveriesPanel';
import Reports from './admin/Insights';
import { RevenueCard, StatusDonutCard, TopProductsCard } from './admin/Charts';
import WebsitePanel from './admin/WebsitePanel';
import Logo from '../components/Logo';

type ProductRow = LiveProduct & { badge: string };
type BookingRow = LocalBooking & { [k: string]: any };

const emptyProduct: ProductRow = {
  id: '', name: '', hindi: '', category: 'women',
  rent1: 899, rent3: 1299, rent9: 2499, buy: 4299, deposit: 2000,
  rating: 4.8, reviews: 0,
  sizes: [...ALL_SIZES], colors: ['Multicolor'],
  img: '/images/g-hero.webp', badge: '', desc: '', fabric: 'Cotton', stock: 5, active: true,
} as ProductRow;

const STATUSES = ['new', 'confirmed', 'onway', 'delivered', 'returned', 'cancelled'] as const;
const useCloud = isSupabaseConfigured && !!supabase;

const statusStyle: Record<string, string> = {
  new: 'bg-amber-50 text-amber-800 border border-amber-300 ring-1 ring-amber-200/50',
  confirmed: 'bg-blue-50 text-blue-800 border border-blue-200',
  onway: 'bg-orange-50 text-orange-800 border border-orange-300 ring-1 ring-orange-200/50',
  delivered: 'bg-violet-50 text-violet-800 border border-violet-200',
  returned: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-800 border border-rose-200',
};

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const heads = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  // Excel formula-injection guard — prefix cells starting with = + - @ as text
  const esc = (v: any) => {
    let s = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return '﻿' + [heads.join(','), ...rows.map((r) => heads.map((h) => esc(r[h])).join(','))].join('\n');
}
function downloadCSV(name: string, rows: Record<string, any>[]) {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Send the order decision to the customer on WhatsApp — number from the booking, pre-made message */
function waCustomerLink(b: BookingRow): string | null {
  const digits = String(b.phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(digits)) return null;
  return `https://wa.me/91${digits}?text=${encodeURIComponent(buildNotifyMsg('update', b))}`;
}

const inr = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** Category tile photo preview — toot/broken link ho to seedha warning (admin ko turant pata chale). */
function CatImg({ src }: { src: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-16 h-[76px] rounded-xl border bg-black/5 grid place-items-center text-center text-[10px] leading-tight text-[#8a7584] shrink-0 px-1">
        {src ? 'Photo load nahi hui — link check karo' : 'No photo'}
      </div>
    );
  }
  return <img src={src} alt="" onError={() => setErr(true)} className="w-16 h-[76px] object-contain rounded-xl border shrink-0" />;
}

/** Booking items in a short line — "Lehenga x1, Blouse" */
function itemsShort(b: BookingRow): string {
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return 'your festive outfit';
  const parts = items.slice(0, 2).map((it: any) => `${it?.name || it?.id || 'Outfit'}${it?.qty > 1 ? ` x${it.qty}` : ''}`);
  return parts.join(', ') + (items.length > 2 ? ` +${items.length - 2} more` : '');
}

export type NotifyKind = 'update' | 'verified' | 'dispatched' | 'ready';

/** Admin → customer ready-made WhatsApp messages (auto-filled from booking data) */
export function buildNotifyMsg(kind: NotifyKind, b: BookingRow): string {
  const nm = b.name || 'Customer';
  const oid = b.order_id || '';
  const paid = Number(b.token_amount || 0);
  const utr = String(b.payment_id || '').trim();
  const bal = Number(b.total || b.subtotal || 0) - paid;
  if (kind === 'verified') {
    const payLine = utr
      ? `✅ Your payment of ${inr(paid)} (UTR: ${utr}) for Order ${oid} has been VERIFIED.`
      : `✅ Your payment of ${inr(paid)} for Order ${oid} has been VERIFIED.`;
    return `Hello ${nm}!\n\n${payLine}\n\nThank you for choosing TheKissa.co!`;
  }
  if (kind === 'dispatched') {
    const addr = String(b.address || '').trim() || 'Delivery address to be confirmed.';
    return `Hello ${nm}!\n\n📦 Your festive outfit (${itemsShort(b)}) has been packed and DISPATCHED for doorstep delivery!\n\n📍 Address: ${addr}\n\nThank you for choosing TheKissa.co!`;
  }
  if (kind === 'ready') {
    const when = b.ready_date ? ` (available by ${b.ready_date})` : '';
    const balLine = bal > 0 ? `\n\n💰 Balance of ${inr(bal)} due on delivery.` : '';
    return `Hello ${nm}!\n\n✅ Your order ${oid} is READY${when}!${balLine}\n\nThank you for choosing TheKissa.co!`;
  }
  const decision = b.status === 'confirmed' ? 'Confirmed — we will deliver your outfit.'
    : b.status === 'onway' ? 'Your outfit is ON THE WAY — arriving soon!'
    : b.status === 'cancelled' ? 'We are sorry — we cannot fulfil this order.'
    : b.status === 'delivered' ? 'Your outfit has been delivered. Enjoy!'
    : 'We have received your order and will update you shortly.';
  const parts = [`Hello ${nm}! TheKissa.co — update on your order ${oid}:`, decision];
  if (b.admin_note) parts.push(String(b.admin_note));
  if (b.ready_date) parts.push(`Available by: ${b.ready_date}.`);
  return parts.join(' ');
}

/** Per-booking reply cell — give or not + reason + WhatsApp notify */
function ReplyCell({ b, reload, notify }: { b: BookingRow; reload: () => void; notify: (m: string) => void }) {
  const [note, setNote] = useState(String(b.admin_note || ''));
  useEffect(() => { setNote(String(b.admin_note || '')); }, [b.id, b.admin_note]);

  const saveNote = async (v: string) => {
    setNote(v);
    if (useCloud && supabase) {
      try {
        const { error } = await supabase.from('bookings').update({ admin_note: v }).eq('id', b.id);
        if (error) throw error;
      } catch {
        notify('Could not save reply — run supabase/migration_admin_note.sql in the SQL Editor.');
        return;
      }
    } else {
      updateLocalBooking(b.id, { admin_note: v || null });
    }
    reload();
    notify(v ? 'Reply saved — customer will see it in My Orders.' : 'Reply cleared.');
  };

  const setDecision = async (status: 'confirmed' | 'cancelled') => {
    if (useCloud && supabase) {
      await supabase.from('bookings').update({ status }).eq('id', b.id);
    } else {
      updateLocalBooking(b.id, { status });
    }
    reload();
    notify(status === 'confirmed' ? 'Order accepted — customer will see "Confirmed".' : 'Order rejected — customer will see "Not available".');
  };

  const wa = waCustomerLink(b);
  const [kind, setKind] = useState<NotifyKind>('update');
  const [msg, setMsgText] = useState(() => buildNotifyMsg('update', b));
  useEffect(() => { setMsgText(buildNotifyMsg(kind, b)); }, [kind, b]);
  return (
    <div className="min-w-[150px] max-w-[182px] space-y-1.5">
      <div className="grid grid-cols-2 gap-1">
        <button onClick={() => setDecision('confirmed')} className={`text-[10.5px] font-bold rounded-lg px-1 py-1 border transition ${b.status === 'confirmed' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white'}`}>✓ Will give</button>
        <button onClick={() => setDecision('cancelled')} className={`text-[10.5px] font-bold rounded-lg px-1 py-1 border transition ${b.status === 'cancelled' ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-300 text-rose-700 hover:bg-rose-600 hover:text-white'}`}>✕ Can't give</button>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {['Available — will deliver', 'Out of stock', 'Not available on this date'].map((r) => (
          <button key={r} onClick={() => saveNote(r)} title="Send this reason to the customer" className="text-[10px] font-semibold bg-white border rounded-lg px-2 py-1 hover:border-black text-left transition">{r}</button>
        ))}
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} onBlur={(e) => { if (e.target.value !== String(b.admin_note || '')) saveNote(e.target.value); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        placeholder="Message for customer…" className="admin-input !py-1 !text-[11.5px]" />
      <label className="label-pro block !text-[10.5px]">Notify template
        <select value={kind} onChange={(e) => setKind(e.target.value as NotifyKind)} className="admin-input mt-0.5 !py-1 !text-[11.5px]">
          <option value="update">Order update</option>
          <option value="verified">Payment verified ✅</option>
          <option value="dispatched">Packed & dispatched 📦</option>
          <option value="ready">Ready for delivery ✅</option>
        </select>
      </label>
      <textarea value={msg} onChange={(e) => setMsgText(e.target.value)} rows={2} title="Preview — you can edit before sending"
        className="admin-input !text-[11px] !py-1 leading-snug resize-y" />
      {wa
        ? <a href={`https://wa.me/91${String(b.phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')}?text=${encodeURIComponent(msg)}`} target="_blank" className="flex items-center justify-center gap-1 text-[11px] font-bold text-white bg-[#1e9e52] rounded-full px-2 py-1 hover:brightness-110 transition">Send on WhatsApp →</a>
        : <span className="block text-[11px] text-[#8a7584]">No valid mobile — can't WhatsApp.</span>}
    </div>
  );
}

export default function Admin() {
  const [cloudUser, setCloudUser] = useState<any>(null);
  const [localAuth, setLocalAuth] = useState(isLocalAdmin());
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [view, setView] = useState<'overview' | 'products' | 'categories' | 'website' | 'bookings' | 'deliveries' | 'reports' | 'settings'>('overview');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [cats, setCats] = useState<ShopCategory[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [prodStatus, setProdStatus] = useState<'all' | 'live' | 'oos' | 'hidden'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bq, setBq] = useState('');
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pwCur, setPwCur] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwCustom, setPwCustom] = useState(() => hasCustomPassword());
  // Order photo preview (large photo on thumbnail tap in the Bookings list)
  const [preview, setPreview] = useState<{ src: string; name: string } | null>(null);
  // Booking item → photo: saved img → single img → catalog lookup (id/pid/name)
  const bookingImgFor = (it: any): string | undefined => {
    try {
      if (it?.img) return String(it.img);
      if (it?.single?.img) return String(it.single.img);
      const pid = String(it?.id || it?.pid || '').trim();
      if (pid) {
        const byId = products.find((p) => p.id === pid);
        if (byId?.img) return byId.img;
      }
      const nm = String(it?.name || '').trim();
      if (nm) {
        const byName = products.find((p) => p.name === nm);
        if (byName?.img) return byName.img;
      }
    } catch { /* ignore */ }
    return undefined;
  };
  // New-booking alert — sound + banner as soon as a new order arrives (additive only, old flow unchanged)
  const [alertsOn, setAlertsOn] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const knownIds = useRef<Set<string> | null>(null);

  const changePw = async () => {
    setPwMsg('');
    if (pwNew !== pwConfirm) { setPwMsg('New passwords do not match.'); return; }
    const err = await setAdminPassword(pwCur, pwNew);
    if (err) { setPwMsg(err); return; }
    setPwCur(''); setPwNew(''); setPwConfirm('');
    setPwCustom(true);
    setMsg('Password updated — old password no longer works.');
    setTimeout(() => setMsg(''), 3000);
  };

  const loggedIn = useCloud ? !!cloudUser : localAuth;

  useEffect(() => {
    if (!useCloud || !supabase) return;
    supabase.auth.getSession().then(({ data }) => setCloudUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setCloudUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadProducts = async () => {
    if (useCloud && supabase) {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data) setProducts((data as any[]).map((r: any) => ({ ...r, sizes: normalizeSizes(r?.sizes) })) as ProductRow[]);
    } else {
      setProducts((getLocalProducts() as ProductRow[]).map((p) => ({ ...p, sizes: normalizeSizes((p as any)?.sizes) })));
    }
  };
  const loadBookings = async () => {
    if (useCloud && supabase) {
      const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(200);
      if (data) setBookings(data as any);
    } else {
      setBookings(getLocalBookings() as BookingRow[]);
    }
  };

  useEffect(() => { if (loggedIn) { loadProducts(); loadBookings(); setCats(getCategories()); pullCategoriesFromCloud().then((changed) => { if (changed) setCats(getCategories()); }); } }, [loggedIn]);
  // Cloud/dusre tab se tile badle to admin list bhi turant refresh
  useEffect(() => {
    const refresh = () => setCats(getCategories());
    const evt = categoriesEvent();
    window.addEventListener(evt, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(evt, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Live bookings — the customer's new order / status change shows instantly.
  // Same-tab event → instant, other tab → storage event, tab-switch → focus refresh.
  // 45s poll is only a fallback (edits safe, display-only).
  useEffect(() => {
    if (!loggedIn) return;
    const onLive = () => { loadBookings(); };
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadBookings();
    };
    const t = setInterval(() => { loadBookings(); }, 45000);
    window.addEventListener('raasleela-bookings-updated', onLive);
    window.addEventListener('storage', onLive);
    window.addEventListener('focus', onLive);
    document.addEventListener('visibilitychange', onVisible);
    // Cloud mode: new bookings / status instantly (Supabase Realtime)
    let cleanupRealtime: (() => void) | undefined;
    const sb = supabase;
    if (useCloud && sb) {
      try {
        const ch = sb
          .channel('bookings-live')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadBookings())
          .subscribe();
        cleanupRealtime = () => {
          try { sb.removeChannel(ch); } catch { /* ignore */ }
        };
      } catch { /* if realtime is unavailable, event+poll fallback is enough */ }
    }
    return () => {
      clearInterval(t);
      window.removeEventListener('raasleela-bookings-updated', onLive);
      window.removeEventListener('storage', onLive);
      window.removeEventListener('focus', onLive);
      document.removeEventListener('visibilitychange', onVisible);
      cleanupRealtime?.();
    };
  }, [loggedIn]);

  // Count incoming new bookings + sound (treat the first load as the baseline)
  useEffect(() => {
    const ids = new Set(bookings.map((b) => String(b.id)));
    if (knownIds.current === null) { knownIds.current = ids; return; }
    let fresh = 0;
    ids.forEach((id) => { if (!knownIds.current!.has(id)) fresh++; });
    knownIds.current = ids;
    if (fresh > 0 && alertsOn) {
      setNewCount((c) => c + fresh);
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880; g.gain.value = 0.07;
          o.start(); o.stop(ctx.currentTime + 0.3);
          setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, 500);
        }
      } catch { /* if audio is blocked, only the banner shows */ }
    }
  }, [bookings, alertsOn]);

  // Never let the admin route be indexed in search
  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    return () => { document.head.removeChild(m); };
  }, []);

  // Close the photo preview with Escape
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreview(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview]);

  const catsPushTimer = useRef<number | null>(null);
  const [catImgBusy, setCatImgBusy] = useState<string | null>(null);

  // Website jaisa bada Save button — photo/naam/keyword badlo, phir Save dabao = sab devices par live
  const [catSaving, setCatSaving] = useState(false);
  const saveCatsToCloud = async () => {
    if (catSaving) return;
    setCatSaving(true);
    const list = getCategories();
    setCats(list);
    const saved = saveCategories(list);
    if (!saved.ok) {
      setMsg(saved.error || 'Save fail ho gaya.');
      setTimeout(() => setMsg(''), 9000);
      setCatSaving(false);
      return;
    }
    if (!useCloud || !supabase) {
      setMsg('Local mode — tiles isi browser me saved hain. Live website par dikhane ke liye live admin link use karo.');
      setTimeout(() => setMsg(''), 6000);
    } else {
      setMsg('Cloud (live shop) me bhej rahe hain…');
      const r = await pushCategoriesToCloud(list);
      setMsg(r.ok ? 'Saved — live on website ✓ (3 category cards sab devices par update)' : `CLOUD fail: ${r.error || ''}`);
      setTimeout(() => setMsg(''), r.ok ? 6000 : 12000);
    }
    setCatSaving(false);
  };

  const persistCats = (list: ShopCategory[]) => {
    setCats(list);
    const saved = saveCategories(list);
    if (!saved.ok) {
      setMsg(saved.error || 'Save fail ho gaya.');
      setTimeout(() => setMsg(''), 9000);
      return;
    }
    // Cloud ho to thoda rukkar push karo (har keystroke par nahi) — sab devices par live tiles
    if (useCloud && supabase) {
      setMsg('Category saved — cloud (live shop) me bhej rahe hain…');
      if (catsPushTimer.current) window.clearTimeout(catsPushTimer.current);
      catsPushTimer.current = window.setTimeout(async () => {
        const r = await pushCategoriesToCloud(getCategories());
        setMsg(r.ok ? 'Category saved — live on website ✓' : `Phone me saved ✓, par CLOUD fail: ${r.error || ''}`);
        setTimeout(() => setMsg(''), r.ok ? 2500 : 9000);
      }, 1200);
    } else {
      setMsg('Category saved — isi browser me live (live website par dikhane ke liye live admin link use karo).');
      setTimeout(() => setMsg(''), 5000);
    }
  };

  const stats = useMemo(() => {
    const live = products.filter((p) => p.active).length;
    const lowStock = products.filter((p) => (p.stock ?? 0) <= 2).length;
    const fresh = bookings.filter((b) => b.status === 'new').length;
    const revenue = bookings.filter((b) => b.status !== 'cancelled').reduce((a, b) => a + (b.total || b.subtotal || 0), 0);
    return { live, lowStock, fresh, revenue, total: bookings.length };
  }, [products, bookings]);

  // Har category tile me abhi kitne dresses/items match ho rahe hain — admin ko turant dikhe
  const catCounts = useMemo(() => {
    const singles = singlesFor(products);
    const m = new Map<string, number>();
    cats.forEach((c) => {
      if (c.kind === 'item') {
        m.set(c.id, singles.filter((it) => {
          const parent = products.find((p) => p.id === it.productId);
          return itemInTile(it.name, parent ?? {}, c);
        }).length);
      } else {
        m.set(c.id, products.filter((p) => dressInTile(p, c)).length);
      }
    });
    return m;
  }, [products, cats]);

  const filteredProducts = products.filter((p) => {
    const okQ = q.trim() ? `${p.id} ${p.name} ${p.hindi}`.toLowerCase().includes(q.toLowerCase()) : true;
    const okC = catFilter === 'all' ? true : p.category === catFilter;
    const okS = prodStatus === 'all' ? true : prodStatus === 'live' ? p.active && (p.stock ?? 0) > 0 : prodStatus === 'oos' ? (p.stock ?? 0) <= 0 : !p.active;
    return okQ && okC && okS;
  });
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    const s = bq.trim().toLowerCase();
    if (!s) return true;
    const items = Array.isArray(b.items) ? b.items.map((it: any) => `${it?.name || ''} ${it?.id || ''}`).join(' ') : '';
    return `${b.order_id || ''} ${b.id || ''} ${b.name || ''} ${b.phone || ''} ${b.address || ''} ${b.admin_note || ''} ${b.note || ''} ${b.payment_id || ''} ${items}`.toLowerCase().includes(s);
  });

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const locked = adminLockRemaining();
    if (locked > 0) {
      setMsg(`Too many wrong attempts — try again after ${Math.ceil(locked / 60000)} min.`);
      return;
    }
    if (useCloud && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        recordAdminFail();
        setMsg('Login failed: ' + error.message);
      } else {
        clearAdminFails();
      }
    } else if (await verifyAdminPassword(pass)) {
      clearAdminFails();
      setLocalAdmin(true);
      setLocalAuth(true);
    } else {
      const left = recordAdminFail();
      setMsg(left > 0 ? 'Too many wrong attempts — try again after 15 min.' : 'Incorrect password.');
    }
  };

  const logout = async () => {
    if (useCloud && supabase) await supabase.auth.signOut();
    else { setLocalAdmin(false); setLocalAuth(false); }
  };

  const persistProducts = (list: ProductRow[]) => {
    setProducts(list);
    if (!useCloud) {
      // saveLocalProducts sends the live event itself (same-tab + other tabs)
      saveLocalProducts(list);
    }
  };

  // In cloud mode, the website is notified instantly when a product changes (same browser).
  // For other devices, Supabase Realtime is attached on the website (ProductsContext).
  const emitProductsLive = () => {
    try {
      window.dispatchEvent(new Event('raasleela-products-updated'));
    } catch { /* ignore */ }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.id.trim() || !editing.name.trim()) { setMsg('Product ID and name are required.'); return; }
    // Clean complete-look rows — drop lines with empty names (max 30)
    const cleanLook: Accessory[] = (editing.accessories ?? [])
      .map((a) => {
        const out: Accessory = { name: a.name.trim().slice(0, 80), tag: a.tag };
        if (a.tag === 'addon') out.price = Math.max(0, Math.round(Number(a.price) || 0));
        if (typeof a.x === 'number' && typeof a.y === 'number') { out.x = a.x; out.y = a.y; }
        return out;
      })
      .filter((a) => !!a.name)
      .slice(0, 30);
    // Sizes — kabhi empty/undefined save mat karo, warna website par gayab lagega
    const cleanSizes = normalizeSizes(editing.sizes);
    // Shop tiles — lowercase tile ids, max 10. Khaali = keyword auto-match.
    const cleanTags = normalizeTags((editing as any).tags);
    const toSave = { ...editing, sizes: cleanSizes, accessories: cleanLook, tags: cleanTags };
    if (useCloud && supabase) {
      const { error } = await supabase.from('products').upsert({ ...toSave, badge: toSave.badge || null }, { onConflict: 'id' });
      if (error && /column|schema cache|does not exist/i.test(error.message)) {
        // Old cloud schema (without accessories/images/rent1/tags columns) — retry without them
        const { accessories: _a, images: _i, rent1: _r, tags: _t, ...legacy } = toSave as any;
        const { error: err2 } = await supabase.from('products').upsert({ ...legacy, badge: toSave.badge || null }, { onConflict: 'id' });
        if (!err2 && (cleanLook.length || (toSave.images ?? []).length || (editing as any).rent1 != null || cleanTags.length)) {
          setMsg('Product saved, but Complete look / photos / 1-day rent / tiles did not save — run supabase/SETUP_ONCE.sql in Supabase (one-time), then save again.');
        } else {
          setMsg(err2 ? 'Error: ' + err2.message : 'Product saved — live on website (sizes: ' + cleanSizes.join(', ') + ').');
        }
        if (!err2) { setEditing(null); loadProducts(); emitProductsLive(); }
        return;
      }
      setMsg(error ? 'Error: ' + error.message : 'Product saved — live on website (sizes: ' + cleanSizes.join(', ') + ').');
      if (!error) { setEditing(null); loadProducts(); emitProductsLive(); }
    } else {
      const i = products.findIndex((p) => p.id === toSave.id);
      const next = [...products];
      if (i >= 0) next[i] = toSave; else next.unshift(toSave);
      persistProducts(next);
      setEditing(null);
      setMsg('Product saved — live on website (sizes: ' + cleanSizes.join(', ') + ').');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    // Phone se 3-4MB photo aati hai — pehle compress (~1200px, JPEG) taaki
    // website phone par fast khule aur storage full na ho.
    const small = await fileToCompressedDataUrl(file, 1200, 0.78);
    if (useCloud && supabase) {
      setUploading(true);
      const blob = (small ? dataUrlToBlob(small) : null) ?? (file.type.startsWith('image/') ? file : null);
      const name = `p-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('product-images').upload(name, blob as Blob, { contentType: 'image/jpeg', upsert: true });
      setUploading(false);
      if (error) { setMsg('Upload failed: ' + error.message); return null; }
      return supabase.storage.from('product-images').getPublicUrl(name).data.publicUrl;
    }
    if (small) return small;
    return await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => res(null);
      r.readAsDataURL(file);
    });
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2 bg-[#14101a]">
        <div className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#1a0f1e,#3d0a26 70%)' }}>
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="w-10 h-10" />
            <span className="font-display text-xl">TheKissa.co</span>
          </Link>
          <div>
            <p className="text-[11px] tracking-[0.24em] text-[#e8c66a] font-bold">STORE MANAGER</p>
            <h1 className="font-display font-black text-5xl leading-[1.02] mt-3">Run your rental<br />business calmly.</h1>
            <p className="text-white/60 text-sm mt-4 max-w-sm leading-relaxed">Products, pricing, stock and bookings — everything in one clean dashboard. Changes go live on the website instantly.</p>
            <div className="grid grid-cols-3 gap-3 mt-8 max-w-sm">
              {[['Live sync', 'Website updates'], ['Bookings', 'Status tracking'], ['Stock', 'Low-stock alerts']].map(([a, b]) => (
                <div key={a} className="bg-white/[.07] border border-white/10 rounded-2xl p-3.5"><b className="text-sm block">{a}</b><span className="text-[11px] text-white/55">{b}</span></div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-white/40">© 2026 TheKissa.co Garba Rental · Indore</p>
        </div>
        <div className="grid place-items-center p-6 bg-[#f7f3ea]">
          <form onSubmit={login} className="w-full max-w-sm admin-card p-8">
            <Link to="/" className="text-xs font-semibold text-[#8a7584] hover:text-black">← Back to website</Link>
            <h2 className="font-display font-black text-[28px] mt-3 text-[#1a0f1e]">Welcome back</h2>
            <p className="text-[13px] text-[#6f5b6a] mt-1">Sign in to manage your store.</p>
            {useCloud && <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" className="admin-input mt-5" required />}
            <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder={useCloud ? 'Password' : 'Admin password'} className="admin-input mt-3" required />
            {msg && <p className="text-[12.5px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mt-3">{msg}</p>}
            <button className="w-full bg-[#1a0f1e] hover:bg-[#3d0a26] text-white font-semibold rounded-full py-3 text-sm mt-4 transition">Sign in to dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  const nav: { id: typeof view; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'website', label: 'Website', icon: Globe },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'deliveries', label: 'Deliveries · Map', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen admin-shell text-[#1a0f1e]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[264px] shrink-0 flex-col bg-[#0e0a12] text-white p-5 sticky top-0 h-screen border-r border-[#e8c66a]/15">
          <Link to="/" className="flex items-center gap-2.5 px-1">
            <Logo className="w-9 h-9" />
            <span className="leading-tight"><b className="font-display block text-[17px]">TheKissa.co</b><small className="text-[9.5px] tracking-[0.24em] text-[#e8c66a]/80 font-bold">STUDIO · ADMIN</small></span>
          </Link>
          <div className="hairline-light my-5" />
          <nav className="space-y-1">
            {nav.map((n) => (
              <button key={n.id} onClick={() => setView(n.id)}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition ${view === n.id ? 'bg-[#e8c66a] text-[#1a0f1e] font-semibold shadow-lg' : 'text-white/60 hover:bg-white/[.07] hover:text-white'}`}>
                <n.icon size={16} /> {n.label}
                {n.id === 'bookings' && stats.fresh > 0 && <span className={`ml-auto text-[11px] font-bold rounded-full px-2 py-0.5 ${view === n.id ? 'bg-[#1a0f1e] text-[#e8c66a]' : 'bg-[#e8c66a] text-[#1a0f1e]'}`}>{stats.fresh}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-6 rounded-2xl border border-[#e8c66a]/20 bg-[#e8c66a]/[.06] p-4">
            <p className="text-[10px] tracking-[0.18em] font-bold text-[#e8c66a]">CONCIERGE TIP</p>
            <p className="text-[12px] text-white/65 mt-1.5 leading-relaxed">Hide low-stock pieces (≤2) to build a waiting list — demand grows.</p>
          </div>
          <div className="mt-auto space-y-3">
            <a href="/" className="flex items-center gap-2 text-[13px] text-white/65 hover:text-white px-3"><Store size={15} /> View website</a>
            <button onClick={logout} className="w-full flex items-center gap-2 text-[13px] font-semibold bg-white/10 hover:bg-white/15 rounded-xl px-3.5 py-2.5"><LogOut size={15} /> Sign out</button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 bg-[#f7f3ea]/90 backdrop-blur border-b border-[#1a0f1e]/8">
            <div className="px-4 sm:px-8 py-4 flex items-center gap-3">
              <div>
                <h1 className="font-display font-black text-xl sm:text-2xl capitalize">{view}</h1>
                <p className="text-xs text-[#8a7584]">{useCloud ? 'Cloud connected · Supabase' : 'Local mode · sirf isi browser me live'}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden sm:inline text-xs font-semibold bg-white border rounded-full px-3 py-1.5">{useCloud ? cloudUser?.email : 'Store owner'}</span>
                <button onClick={logout} className="md:hidden text-xs font-bold border rounded-full px-3 py-1.5">Logout</button>
              </div>
            </div>
            <div className="md:hidden flex gap-1.5 px-4 pb-3 overflow-x-auto">
              {nav.map((n) => (
                <button key={n.id} onClick={() => setView(n.id)} className={`text-xs font-bold rounded-full px-3.5 py-1.5 border whitespace-nowrap ${view === n.id ? 'bg-[#1a0f1e] text-white' : 'bg-white'}`}>{n.label}</button>
              ))}
            </div>
          </header>

          <main className="px-4 sm:px-8 py-6 max-w-6xl">
            {!useCloud && (
              <p className="text-[13px] bg-amber-50 text-amber-900 border border-amber-300 rounded-xl px-4 py-2.5 mb-4">
                <b>⚠ Local mode:</b> ye changes sirf isi laptop/browser me dikhenge. Customer website (phones) par dikhane ke liye <b>live admin link</b> kholo — apni live domain par <span className="font-mono font-bold">/{ADMIN_PATH}</span> (jaise thekissa.co.in/{ADMIN_PATH}) — wahan login karke badlo, turant live hoga.
              </p>
            )}
            {msg && <p className="text-sm bg-white border rounded-xl px-4 py-2.5 mb-4">{msg}</p>}

            {view === 'overview' && (
              <div>
                {newCount > 0 && (
                  <div className="admin-card p-4 mb-4 flex flex-wrap items-center gap-2 border-emerald-300 bg-emerald-50/60">
                    <BellRing size={17} className="text-emerald-700" />
                    <b className="text-[14px] text-emerald-900">🔔 {newCount} new booking{newCount === 1 ? '' : 's'} arrived</b>
                    <span className="flex gap-2 ml-auto">
                      <button onClick={() => { setNewCount(0); setView('bookings'); }} className="text-[12.5px] font-bold bg-emerald-600 text-white rounded-full px-4 py-1.5">Review now</button>
                      <button onClick={() => setNewCount(0)} className="text-[12.5px] font-bold border rounded-full px-4 py-1.5 bg-white">Dismiss</button>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setAlertsOn((v) => !v)} title="Sound + banner on new orders"
                    className={`flex items-center gap-1.5 text-[12px] font-bold rounded-full px-3.5 py-1.5 border transition ${alertsOn ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-black/60'}`}>
                    <BellRing size={13} /> New-order alert {alertsOn ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { l: 'Live products', v: stats.live, icon: Package, s: `${products.length} total · atelier pressed`, d: '▲ curated' },
                    { l: 'Low stock', v: stats.lowStock, icon: Eye, s: '≤ 2 pieces · act fast', d: stats.lowStock ? '● needs attention' : '○ healthy' },
                    { l: 'New bookings', v: stats.fresh, icon: Users, s: `${stats.total} total enquiries`, d: '▲ live demand' },
                    { l: 'Booking value', v: '₹' + stats.revenue.toLocaleString('en-IN'), icon: IndianRupee, s: 'excl. cancelled', d: '▲ Navratri peak' },
                  ].map((c) => (
                    <div key={c.l} className="admin-card p-4 sm:p-5 relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#e8c66a] to-[#8e1a4f]" />
                      <div className="w-9 h-9 rounded-xl grid place-items-center bg-[#1a0f1e] text-[#e8c66a]"><c.icon size={17} /></div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a7584] mt-3">{c.l}</p>
                      <b className="font-display text-2xl sm:text-[28px]">{c.v}</b>
                      <p className="text-[11.5px] text-[#8a7584]">{c.s}</p>
                      <p className="text-[11px] font-bold text-emerald-700 mt-1">{c.d}</p>
                    </div>
                  ))}
                </div>
                <div className="grid lg:grid-cols-3 gap-4 mt-4">
                  <div className="lg:col-span-2 min-w-0"><RevenueCard bookings={bookings} /></div>
                  <div className="min-w-0"><StatusDonutCard bookings={bookings} /></div>
                </div>
                <div className="mt-4"><TopProductsCard bookings={bookings} /></div>
                <div className="grid lg:grid-cols-2 gap-4 mt-4">
                  <div className="admin-card p-5">
                    <b>Quick actions</b>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button onClick={() => { setEditing({ ...emptyProduct, id: `RL-${Date.now().toString().slice(-4)}` }); setView('products'); }} className="text-[13px] font-semibold bg-[#1a0f1e] text-white rounded-full px-4 py-2.5 flex items-center gap-1.5"><Plus size={14} /> Add product</button>
                      <button onClick={() => setView('bookings')} className="text-[13px] font-semibold border rounded-full px-4 py-2.5">Review bookings ({stats.fresh})</button>
                      <button onClick={() => { loadProducts(); loadBookings(); }} className="text-[13px] font-semibold border rounded-full px-4 py-2.5">Refresh data</button>
                    </div>
                  </div>
                  <div className="admin-card p-5">
                    <b>Latest bookings</b>
                    <div className="mt-3 space-y-2">
                      {bookings.slice(0, 4).map((b) => (
                        <div key={b.id} className="flex items-center gap-2 text-[13px] border-t border-[#1a0f1e]/5 pt-2 first:border-0 first:pt-0">
                          <b>#{String(b.id).slice(-6)}</b><span className="truncate">{b.name}</span>
                          <span className={`status-pill ml-auto ${statusStyle[b.status] || ''}`}>{b.status}</span>
                        </div>
                      ))}
                      {bookings.length === 0 && <p className="text-[13px] text-[#8a7584]">No bookings yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <label className="flex-1 flex items-center gap-2 bg-white border rounded-xl px-3.5">
                    <Search size={15} className="text-[#8a7584]" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="py-2.5 outline-none w-full text-sm bg-transparent" />
                  </label>
                  <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="admin-input !w-auto">
                    {['all', 'women', 'premium'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => setEditing({ ...emptyProduct, id: `RL-${Date.now().toString().slice(-4)}` })} className="bg-[#1a0f1e] text-white text-[13px] font-semibold rounded-xl px-4 py-2.5 flex items-center justify-center gap-1.5"><Plus size={14} /> New product</button>
                  <button onClick={() => downloadCSV('products.csv', filteredProducts)} className="text-[13px] font-semibold border rounded-xl px-4 py-2.5">Export CSV</button>
                  <button
                    title={`Apply sizes ${ALL_SIZES.join(', ')} to every product`}
                    onClick={async () => {
                      if (!products.length) { setMsg('No products to update.'); return; }
                      if (!confirm(`Apply sizes ${ALL_SIZES.join(', ')} to all ${products.length} products?`)) return;
                      if (useCloud && supabase) {
                        const { error } = await supabase.from('products').update({ sizes: ALL_SIZES }).neq('id', '__none__');
                        if (error) { setMsg('Error: ' + error.message); return; }
                        loadProducts(); emitProductsLive();
                      } else {
                        persistProducts(products.map((p) => ({ ...p, sizes: [...ALL_SIZES] })));
                      }
                      setMsg(`All sizes (${ALL_SIZES.join(', ')}) set on ${products.length} products — live on website.`);
                      setTimeout(() => setMsg(''), 4000);
                    }}
                    className="text-[13px] font-semibold border border-emerald-300 text-emerald-800 rounded-xl px-4 py-2.5 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition"
                  >All sizes on all</button>
                </div>
                <div className="flex gap-1.5 flex-wrap items-center mt-3">
                  {(['all', 'live', 'oos', 'hidden'] as const).map((s) => (
                    <button key={s} onClick={() => setProdStatus(s)} className={`text-xs font-bold rounded-full px-3.5 py-1.5 border ${prodStatus === s ? 'bg-[#1a0f1e] text-white border-[#1a0f1e]' : 'bg-white'}`}>
                      {s === 'all' ? `All · ${products.length}` : s === 'live' ? `Live · ${products.filter((p) => p.active && (p.stock ?? 0) > 0).length}` : s === 'oos' ? `Out of stock · ${products.filter((p) => (p.stock ?? 0) <= 0).length}` : `Hidden · ${products.filter((p) => !p.active).length}`}
                    </button>
                  ))}
                </div>

                <div className="admin-card mt-4 overflow-x-auto">
                  <table className="w-full min-w-[820px]">
                    <thead><tr className="border-b border-[#1a0f1e]/8"><th className="admin-th">Product</th><th className="admin-th">Category</th><th className="admin-th">Rent / Buy</th><th className="admin-th">Stock</th><th className="admin-th">Status</th><th className="admin-th text-right">Actions</th></tr></thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-[#faf7ef]">
                          <td className="admin-td">
                            <div className="flex items-center gap-2.5">
                              <img src={p.img} alt="" className="w-11 h-13 h-[52px] object-contain rounded-lg border" />
                              <div><b className="block text-[13px]">{p.name}</b><span className="text-[11.5px] text-[#8a7584]">{p.id}</span></div>
                            </div>
                          </td>
                          <td className="admin-td capitalize text-[#3d2b36]">{p.category}</td>
                          <td className="admin-td font-semibold">₹{((p as any).rent1 ?? p.rent3).toLocaleString('en-IN')} <span className="font-normal text-[#8a7584]">rent</span><span className="block text-[12px] text-[#641629]">₹{(p.buy ?? 0).toLocaleString('en-IN')} <span className="font-normal text-[#8a7584]">buy</span></span></td>
                          <td className="admin-td"><span className={`font-bold ${p.stock <= 2 ? 'text-rose-700' : ''}`}>{p.stock}</span>
                            <span className="block w-20 h-1.5 bg-black/10 rounded-full mt-1.5 overflow-hidden"><span className={`block h-full rounded-full ${p.stock <= 2 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (p.stock / 10) * 100)}%` }} /></span>
                          </td>
                          <td className="admin-td"><span className={`status-pill ${!p.active ? 'bg-black/5 text-black/50 border' : (p.stock ?? 0) <= 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>{!p.active ? 'Hidden' : (p.stock ?? 0) <= 0 ? 'Out of stock' : 'Live'}</span></td>
                          <td className="admin-td">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setEditing({ ...p, sizes: normalizeSizes((p as any)?.sizes) })} title="Edit" className="w-8 h-8 grid place-items-center rounded-lg border hover:bg-[#1a0f1e] hover:text-white transition"><Pencil size={13} /></button>
                              <button onClick={async () => {
                                const nextStock = (p.stock ?? 0) > 0 ? 0 : 5;
                                if (useCloud && supabase) { await supabase.from('products').update({ stock: nextStock }).eq('id', p.id); loadProducts(); emitProductsLive(); }
                                else persistProducts(products.map((x) => (x.id === p.id ? { ...x, stock: nextStock } : x)));
                              }} title={(p.stock ?? 0) > 0 ? 'Mark out of stock (stock → 0)' : 'Restock (stock → 5)'} className={`h-8 px-2 flex items-center gap-1 rounded-lg border text-[10.5px] font-bold transition ${(p.stock ?? 0) > 0 ? 'border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white'}`}>{(p.stock ?? 0) > 0 ? 'OOS' : '+5'}</button>
                              <button onClick={async () => {
                                if (useCloud && supabase) { await supabase.from('products').update({ active: !p.active }).eq('id', p.id); loadProducts(); emitProductsLive(); }
                                else persistProducts(products.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
                              }} title="Show/Hide" className="w-8 h-8 grid place-items-center rounded-lg border hover:bg-[#1a0f1e] hover:text-white transition">{p.active ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                              <button onClick={async () => {
                                if (!confirm(`Delete ${p.id}?`)) return;
                                if (useCloud && supabase) {
                                  const { error } = await supabase.from('products').delete().eq('id', p.id);
                                  setMsg(error ? 'Error: ' + error.message : 'Product deleted.');
                                  if (!error) { loadProducts(); emitProductsLive(); }
                                } else {
                                  persistProducts(products.filter((x) => x.id !== p.id));
                                }
                              }} title="Delete" className="w-8 h-8 grid place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white transition"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProducts.length === 0 && <p className="text-center text-sm text-[#8a7584] py-10">No products found.</p>}
                </div>
              </div>
            )}

            {view === 'categories' && (
              <div>
                <div className="admin-card p-4 text-[13px] text-[#3d2b36] leading-relaxed">
                  <b>Shop by category</b> — the website shows photo tiles (one per dress / item). Tap = collection filter.
                  Default tiles match <b>sirf naam se</b> (description wale shabd leak nahi karte — mixing zero).
                  <b>Dress</b> = dresses · <b>Item</b> = single-rent items only (jhumka, kamarbandh — without a dress).
                  Keyword comma (,) means <b>OR</b> (e.g. <code>dupatta, bandhani</code>); words inside one comma part must all match (e.g. <code>oxidised jhumka</code>).
                  Empty keyword = all products in that group.
                  <b>Strict</b> ON = tile me <b>sirf tick kiye products</b> — keyword matching band, mixing zero (Blouse/Jewellery ke liye best).
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => persistCats([{ id: `cat-${Date.now().toString(36)}`, label: 'New category', query: '', img: '/images/g-hero.webp', kind: 'dress' }, ...cats])} className="bg-[#1a0f1e] text-white text-[13px] font-semibold rounded-xl px-4 py-2.5 flex items-center gap-1.5"><Plus size={14} /> New category</button>
                  <button onClick={() => { if (confirm('Reset to default categories?')) persistCats(resetCategories()); }} className="text-[13px] font-semibold border rounded-xl px-4 py-2.5">Reset defaults</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {cats.map((c) => (
                    <div key={c.id} className="admin-card p-4 flex gap-3">
                      <CatImg key={c.img} src={c.img} />
                      <div className="flex-1 min-w-0 space-y-2">
                        <label className="label-pro block">Name<input value={c.label} onChange={(e) => persistCats(cats.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)))} className="admin-input mt-1" /></label>
                        {(() => {
                          const n = catCounts.get(c.id) ?? 0;
                          const unit = c.kind === 'item' ? (n === 1 ? 'item' : 'items') : (n === 1 ? 'dress' : 'dresses');
                          return n > 0
                            ? <p className="text-[11.5px] font-bold text-emerald-700">✓ {n} {unit} match — website par dikhega{c.strict ? ' (Strict)' : ''}</p>
                            : <p className="text-[11.5px] font-bold text-amber-700">⚠ 0 match — {c.strict ? 'Strict ON hai, product me ye tile tick karo' : 'keyword badlo ya product me ye tile tick karo'}</p>;
                        })()}
                        <div className="grid grid-cols-2 gap-2">
                          <label className="label-pro block">Type
                            <select value={c.kind} onChange={(e) => persistCats(cats.map((x) => (x.id === c.id ? { ...x, kind: e.target.value as 'dress' | 'item', cats: undefined } : x)))} className="admin-input mt-1">
                              <option value="dress">Dress</option>
                              <option value="item">Item</option>
                            </select>
                          </label>
                          <label className="label-pro block">Keyword<input value={c.query} onChange={(e) => persistCats(cats.map((x) => (x.id === c.id ? { ...x, query: e.target.value.toLowerCase() } : x)))} placeholder="blouse" className="admin-input mt-1" /></label>
                        </div>
                        <label className="flex items-center gap-2 text-[12.5px] font-bold text-[#3d2b36]">
                          <input type="checkbox" checked={!!c.strict} onChange={(e) => persistCats(cats.map((x) => (x.id === c.id ? { ...x, strict: e.target.checked } : x)))} className="w-4 h-4 accent-[#3d0a26]" />
                          Strict — sirf tick kiye products (mixing band)
                        </label>
                        {c.kind === 'dress' && (
                          <div>
                            <p className="label-pro">Dress group (unticked = all groups)</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {(['women', 'premium'] as const).map((g) => {
                                const has = c.cats?.includes(g) ?? false;
                                return (
                                  <button type="button" key={g} onClick={() => {
                                    const cur = c.cats ?? [];
                                    const next = has ? cur.filter((x) => x !== g) : [...cur, g];
                                    persistCats(cats.map((x) => (x.id === c.id ? { ...x, cats: next.length ? next : undefined } : x)));
                                  }} className={`text-[11.5px] font-bold rounded-full px-3 py-1 border capitalize ${has ? 'bg-[#1a0f1e] text-white border-[#1a0f1e]' : 'bg-white text-[#3d2b36] hover:border-black'}`}>{g}</button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-1.5">
                          <input value={c.img} onChange={(e) => persistCats(cats.map((x) => (x.id === c.id ? { ...x, img: e.target.value } : x)))} placeholder="/images/… or URL" className="admin-input" />
                          <label title="Upload photo" className="shrink-0 grid place-items-center w-10 rounded-lg border cursor-pointer hover:bg-black hover:text-white transition text-sm">
                            {catImgBusy === c.id ? '…' : '⇪'}
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              if (!f) return;
                              if (!f.type.startsWith('image/')) { setMsg('Sirf JPG/PNG photo lagao.'); setTimeout(() => setMsg(''), 4000); return; }
                              setCatImgBusy(c.id);
                              try {
                                const url = await uploadImage(f);
                                if (url) {
                                  persistCats(cats.map((x) => (x.id === c.id ? { ...x, img: url } : x)));
                                } else {
                                  setMsg('Photo lagi nahi — chhoti (2MB se kam) JPG try karo, ya net check karke dobara lagao.');
                                  setTimeout(() => setMsg(''), 8000);
                                }
                              } finally {
                                setCatImgBusy(null);
                              }
                            }} />
                          </label>
                          <button title="Delete" onClick={() => { if (confirm(`Delete "${c.label}"?`)) persistCats(cats.filter((x) => x.id !== c.id)); }} className="shrink-0 w-10 grid place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white transition"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {cats.length === 0 && <p className="text-center text-sm text-[#8a7584] py-10">No categories — no strip will show on the website. Add or Reset.</p>}
                <div className="sticky bottom-3 mt-4 bg-white/95 backdrop-blur border rounded-2xl p-3 shadow-xl">
                  <button onClick={saveCatsToCloud} disabled={catSaving} className="w-full bg-[#1a0f1e] text-white font-semibold rounded-full py-3 text-sm disabled:opacity-60">
                    {catSaving ? 'Saving…' : 'Save — live on website'}
                  </button>
                  <p className="text-[11.5px] text-[#8a7584] text-center mt-1.5">Photo/naam badlo → <b>Save dabao</b> → green ✓ aaye to 3 cards phones par live</p>
                </div>
              </div>
            )}

            {view === 'bookings' && (
              <div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex-1 flex items-center gap-2 bg-[#fffdf9] border border-[#c9a44a]/35 rounded-xl px-3.5 shadow-[0_8px_20px_-14px_rgba(60,30,40,.35)] focus-within:border-[#8a6d1f] focus-within:ring-2 focus-within:ring-[#c9a44a]/25 transition">
                    <Search size={15} className="text-[#8a6d1f] shrink-0" />
                    <input value={bq} onChange={(e) => setBq(e.target.value)} placeholder="Search name, order ID, mobile, address…" className="py-2.5 outline-none w-full text-sm bg-transparent" />
                    {bq && <button onClick={() => setBq('')} title="Clear search" className="text-[#8a7584] hover:text-black text-lg leading-none">×</button>}
                  </label>
                  <button onClick={() => downloadCSV('bookings.csv', filteredBookings)} className="text-xs font-bold rounded-xl px-4 py-2.5 bg-gradient-to-b from-[#2b141b] to-[#1c0d12] text-[#f7ead0] ring-1 ring-[#c9a44a]/40 shadow-[0_10px_20px_-12px_rgba(34,17,20,.6)] hover:brightness-125 transition shrink-0">Export CSV</button>
                </div>
                {bq.trim() && <p className="text-[12px] text-[#8a7584] mt-2">{filteredBookings.length} result{filteredBookings.length === 1 ? '' : 's'} for “{bq.trim()}” <button onClick={() => setBq('')} className="underline hover:text-black">clear</button></p>}
                <div className="flex gap-1.5 flex-wrap items-center mt-2.5">
                  {['all', ...STATUSES].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs font-bold rounded-full px-3.5 py-1.5 border capitalize transition ${statusFilter === s ? 'bg-gradient-to-b from-[#2b141b] to-[#1c0d12] text-[#f7ead0] border-transparent ring-1 ring-[#c9a44a]/50 shadow-[0_8px_18px_-10px_rgba(34,17,20,.6)]' : 'bg-white hover:border-[#8a6d1f]/60'}`}>{s} {s !== 'all' ? `· ${bookings.filter((b) => b.status === s).length}` : ''}</button>
                  ))}
                </div>
                <div className="admin-card mt-4 overflow-x-auto relative ring-1 ring-[#c9a44a]/25 !rounded-2xl shadow-[0_24px_50px_-30px_rgba(60,30,40,.35)]">
                  <div aria-hidden className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#e8c66a] via-[#c9a44a] to-[#8e1a4f] rounded-t-2xl" />
                  <table className="w-full min-w-[1040px]">
                    <thead className="bg-gradient-to-b from-[#fbf3df] to-[#f7efe0]"><tr className="border-b border-[#c9a44a]/30"><th className="admin-th">Order</th><th className="admin-th">Customer</th><th className="admin-th">Event / Ready</th><th className="admin-th">Amount</th><th className="admin-th">Payment</th><th className="admin-th">Status</th><th className="admin-th">Customer reply</th><th className="admin-th text-right">Actions</th></tr></thead>
                    <tbody>
                      {filteredBookings.map((b, bi) => (
                        <tr key={b.id} className={`transition hover:bg-[#faf3e2] ${bi % 2 === 1 ? 'bg-[#fffdf6]' : ''}`}>
                          <td className="admin-td !px-2.5 !py-2 font-bold text-[#4d0f1f] max-w-[230px]">{b.order_id || `#${String(b.id).slice(-6)}`}<span className="block text-[11px] font-normal text-[#8a7584]">#{String(b.id).slice(-6)}</span>
                            {Array.isArray(b.items) && b.items.length > 0 && (
                              <>
                                {/* Order photos — what was bought/rented, at a glance */}
                                <span className="flex gap-1 mt-1.5 flex-wrap">
                                  {b.items.slice(0, 4).map((it: any, i: number) => {
                                    const src = bookingImgFor(it);
                                    if (!src) return null;
                                    return (
                                      <button key={i} onClick={() => setPreview({ src, name: String(it?.name || it?.id || 'Outfit') })} title={`${String(it?.name || it?.id || 'Outfit')} — tap to view`}
                                        className="relative group shrink-0">
                                        <img src={src} alt={String(it?.name || '')} loading="lazy" className="w-9 h-11 object-contain rounded-lg border border-black/10 group-hover:opacity-85 transition" />
                                        {Number(it?.qty) > 1 && <span className="absolute -bottom-1 -right-1 text-[9px] font-black bg-black text-white rounded-full px-1.5 py-px">×{it.qty}</span>}
                                      </button>
                                    );
                                  })}
                                  {b.items.length > 4 && <span className="self-center text-[10px] font-bold text-[#8a7584]">+{b.items.length - 4}</span>}
                                </span>
                                <span className="block text-[11.5px] font-semibold text-[#3d2b36] mt-1 leading-snug">
                                  {b.items.slice(0, 2).map((it: any) => `${it?.plan === 'buy' ? '[BUY] ' : ''}${it?.name || it?.id || 'Outfit'}${it?.qty > 1 ? ` ×${it.qty}` : ''}`).join(' · ')}
                                  {b.items.length > 2 ? ` +${b.items.length - 2} more` : ''}
                                </span>
                                <details className="mt-1">
                                  <summary className="text-[11px] font-bold text-[#8e1a4f] cursor-pointer hover:underline">All {b.items.length} items ⌄</summary>
                                  <ul className="mt-1 space-y-1 text-[11.5px] font-normal text-[#3d2b36]">
                                    {b.items.map((it: any, i: number) => {
                                      const src = bookingImgFor(it);
                                      return (
                                      <li key={i} className="leading-snug flex gap-1.5 items-center">
                                        {src
                                          ? <button onClick={() => setPreview({ src, name: String(it?.name || it?.id || 'Outfit') })} title="Tap to view" className="shrink-0"><img src={src} alt="" loading="lazy" className="w-7 h-9 object-contain rounded-md border border-black/10 hover:opacity-85 transition" /></button>
                                          : null}
                                        <span>• {it?.plan === 'buy' ? <b className="text-[#641629]">BUY</b> : <b className="text-blue-700">RENT</b>} {it?.name || it?.id || 'Outfit'}{it?.qty > 1 ? ` ×${it.qty}` : ''}{Array.isArray(it?.addons) && it.addons.length ? ` (+${it.addons.join(', ')})` : ''}{it?.size ? ` · ${it.size}` : ''}</span>
                                      </li>
                                      );
                                    })}
                                  </ul>
                                </details>
                              </>
                            )}</td>
                          <td className="admin-td !px-2.5 !py-2"><b className="block text-[13px]">{b.name}</b><a href={`tel:${b.phone}`} className="text-[12px] text-blue-700 hover:underline">{b.phone}</a>{b.address && <span className="block text-[11.5px] text-[#3d2b36] mt-0.5 max-w-[180px]">📍 {String(b.address)}</span>}</td>
                          <td className="admin-td !px-2.5 !py-2 text-[12.5px] text-[#3d2b36]">
                            <b>{b.event_date || '—'}</b>
                            <span className="block text-[#8a7584] text-[11.5px]">{b.category} · {b.size}</span>
                            <input type="date" value={b.ready_date || ''} title="Set the date by which this order will be ready — the customer sees it in My Orders"
                              onChange={async (e) => {
                                const v = e.target.value || null;
                                if (useCloud && supabase) {
                                  try {
                                    const { error } = await supabase.from('bookings').update({ ready_date: v }).eq('id', b.id);
                                    if (error) throw error;
                                  } catch {
                                    setMsg('Could not save ready date — run supabase/migration_ready_date.sql in the SQL Editor.');
                                    setTimeout(() => setMsg(''), 4000);
                                    return;
                                  }
                                } else {
                                  updateLocalBooking(b.id, { ready_date: v });
                                }
                                loadBookings();
                                setMsg(v ? `Ready date set — customer will see "Available by ${v}".` : 'Ready date cleared.');
                                setTimeout(() => setMsg(''), 3000);
                              }}
                              className="admin-input !w-[128px] !py-1 !text-[11.5px] mt-1" />
                            {b.ready_date && <span className="block text-[11px] text-emerald-700 font-semibold mt-0.5">✓ shown in My Orders</span>}
                          </td>
                          <td className="admin-td !px-2.5 !py-2">
                            <b className="block text-[14px]">₹{(b.total || b.subtotal || 0).toLocaleString('en-IN')}</b>
                            {!!b.token_amount && <span className="block text-[11px] font-normal text-emerald-700">{b.payment_mode === 'upi-qr-full' ? `full ₹${Number(b.token_amount).toLocaleString('en-IN')}` : (b.payment_mode === 'upi-qr-half' ? `half ₹${Number(b.token_amount).toLocaleString('en-IN')}` : `token ₹${Number(b.token_amount).toLocaleString('en-IN')}`)}</span>}
                            <span className="block text-[11.5px] mt-1">Extra 30% <b>₹{Number(b.deposit || 0).toLocaleString('en-IN')}</b></span>
                            <button
                              title="Change deposit status (tap)"
                              onClick={async () => {
                                const next = b.deposit_status === 'collected' ? 'refunded' : b.deposit_status === 'refunded' ? 'pending' : 'collected';
                                if (useCloud && supabase) {
                                  try {
                                    const { error } = await supabase.from('bookings').update({ deposit_status: next }).eq('id', b.id);
                                    if (error) throw error;
                                  } catch (e: any) {
                                    setMsg('Could not save deposit status: ' + (e?.message || 'unknown error'));
                                    setTimeout(() => setMsg(''), 4000);
                                    return;
                                  }
                                } else {
                                  updateLocalBooking(b.id, { deposit_status: next });
                                }
                                loadBookings();
                              }}
                              className={`text-[10.5px] font-bold rounded-full px-2 py-0.5 border mt-1 ${b.deposit_status === 'refunded' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : b.deposit_status === 'collected' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                            >
                              {b.deposit_status === 'refunded' ? 'refunded ✓' : b.deposit_status === 'collected' ? 'collected ✓' : 'pending'}
                            </button>
                          </td>
                          <td className="admin-td !px-2.5 !py-2"><span className="text-[11.5px] font-semibold">{b.payment_mode || 'pending'}</span><span className="block text-[11px] text-[#8a7584]">{b.payment_status || ''}{b.payment_id ? ` · ${String(b.payment_id).slice(0, 14)}` : ''}</span>
                            {(b.payment_mode === 'upi-qr' || b.payment_mode === 'upi-qr-full' || b.payment_mode === 'upi-qr-half') && (
                              <button
                                title="Match with the bank statement, then tap to verify payment"
                                onClick={async () => {
                                  const next = b.payment_status === 'verified' ? 'unverified' : 'verified';
                                  if (useCloud && supabase) {
                                    try {
                                      const { error } = await supabase.from('bookings').update({ payment_status: next }).eq('id', b.id);
                                      if (error) throw error;
                                    } catch (e: any) {
                                      setMsg('Could not save payment status: ' + (e?.message || 'unknown error'));
                                      setTimeout(() => setMsg(''), 4000);
                                      return;
                                    }
                                  } else {
                                    updateLocalBooking(b.id, { payment_status: next });
                                  }
                                  loadBookings();
                                }}
                                className={`text-[10.5px] font-bold rounded-full px-2 py-0.5 border mt-1 ${b.payment_status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                              >
                                {b.payment_status === 'verified' ? 'verified ✓' : 'tap to verify'}
                              </button>
                            )}
                          </td>
                          <td className="admin-td !px-2.5 !py-2"><span className={`status-pill ${statusStyle[b.status] || ''}`}>{b.status}</span></td>
                          <td className="admin-td !px-2.5 !py-2"><ReplyCell b={b} reload={loadBookings} notify={(m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); }} /></td>
                          <td className="admin-td !px-2.5 !py-2">
                            <div className="min-w-[186px]">
                              <div className="grid grid-cols-3 gap-1">
                              {STATUSES.map((s) => (
                                <button key={s} onClick={async () => {
                                  if (useCloud && supabase) {
                                    try {
                                      const { error } = await supabase.from('bookings').update({ status: s }).eq('id', b.id);
                                      if (error) throw error;
                                    } catch (e: any) {
                                      setMsg('Could not save status: ' + (e?.message || 'unknown error'));
                                      setTimeout(() => setMsg(''), 4000);
                                      return;
                                    }
                                    loadBookings();
                                  }
                                  else { updateLocalBooking(b.id, { status: s }); loadBookings(); }
                                }} className={`text-[10.5px] font-bold rounded-lg px-1 py-1.5 border capitalize transition ${b.status === s ? 'bg-gradient-to-b from-[#2b141b] to-[#1c0d12] text-[#f7ead0] border-transparent ring-1 ring-[#c9a44a]/50' : 'bg-white hover:border-[#8a6d1f]/60'}`}>{s}</button>
                              ))}
                              </div>
                              <button onClick={async () => {
                                if (!confirm(`Delete ${b.order_id || 'this booking'} (${b.name || 'customer'}) permanently? This cannot be undone.`)) return;
                                if (useCloud && supabase) {
                                  try {
                                    const { error } = await supabase.from('bookings').delete().eq('id', b.id);
                                    if (error) throw error;
                                  } catch (e: any) {
                                    setMsg('Could not delete: ' + (e?.message || 'unknown error'));
                                    setTimeout(() => setMsg(''), 4000);
                                    return;
                                  }
                                  loadBookings();
                                  setMsg('Booking deleted permanently.');
                                  setTimeout(() => setMsg(''), 3000);
                                } else { deleteLocalBooking(b.id); loadBookings(); }
                              }} title="Delete this booking permanently" className="mt-1 w-full flex items-center justify-center gap-1 rounded-lg border border-rose-200 text-rose-700 text-[10.5px] font-bold px-2 py-1.5 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition"><Trash2 size={12} /> Delete booking</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredBookings.length === 0 && <p className="text-center text-sm text-[#8a7584] py-10">{bq.trim() ? `No bookings match “${bq.trim()}”.` : 'No bookings in this view.'}</p>}
                </div>
              </div>
            )}

            {view === 'deliveries' && <DeliveriesPanel bookings={bookings} />}

            {view === 'reports' && <Reports bookings={bookings} reload={loadBookings} />}

            {view === 'website' && <WebsitePanel />}

            {view === 'settings' && (
              <>
              <div className="admin-card p-6 max-w-2xl">
                <b>Store settings</b>
                <p className="text-[13px] text-[#6f5b6a] mt-1">{useCloud ? 'Supabase cloud connected. Data syncs across all devices.' : 'Local mode — data is stored in this browser. For multi-device sync, connect Supabase (optional).'}</p>
                <button onClick={() => setView('website')} className="mt-4 text-[13px] font-semibold bg-[#1a0f1e] text-white rounded-full px-4 py-2.5">Edit website text, number & photos →</button>
                <div className="mt-4 text-[13px] space-y-2 bg-[#faf7ef] border rounded-xl p-4">
                  <p><b>Website:</b> <Link to="/" className="underline">Open storefront</Link></p>
                  <p><b>Mode:</b> {useCloud ? 'Cloud (Supabase)' : 'Local (browser storage)'}</p>
                  <p><b>Products:</b> {products.length} · <b>Bookings:</b> {bookings.length}</p>
                </div>
                <button onClick={() => { if (confirm('Reset demo data?')) { localStorage.removeItem('raasleela-admin-products'); localStorage.removeItem('raasleela-admin-bookings'); localStorage.removeItem('raasleela-seeded'); loadProducts(); loadBookings(); } }} className="mt-4 text-[13px] font-semibold text-rose-700 border border-rose-200 rounded-full px-4 py-2">Reset local demo data</button>
              </div>
              <div className="admin-card p-6 max-w-2xl mt-4">
                <b>Admin password</b>
                <p className="text-[13px] mt-1">
                  {pwCustom
                    ? <span className="text-emerald-700 font-semibold">Custom password is ON — the default password no longer works anywhere.</span>
                    : <span className="text-amber-700 font-semibold">Default password is active — set your own now to lock out the old one.</span>}
                </p>
                <div className="grid gap-2.5 mt-3 max-w-sm">
                  <label className="label-pro">Current password<input type="password" value={pwCur} onChange={(e) => setPwCur(e.target.value)} className="admin-input mt-1.5" autoComplete="current-password" /></label>
                  <label className="label-pro">New password (min 6 characters)<input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} className="admin-input mt-1.5" autoComplete="new-password" /></label>
                  <label className="label-pro">Confirm new password<input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} className="admin-input mt-1.5" autoComplete="new-password" /></label>
                </div>
                {pwMsg && <p className="text-[12.5px] text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mt-3 max-w-sm">{pwMsg}</p>}
                <button onClick={changePw} className="mt-3 text-[13px] font-semibold bg-[#1a0f1e] text-white rounded-full px-5 py-2.5">Update password</button>
                <p className="text-[11.5px] text-[#8a7584] mt-3">The password is stored only in this browser — repeat this on each device you use. If you forget it, clear this site's browser data to start over with the default.</p>
              </div>
              </>
            )}
          </main>
        </div>
      </div>

      {editing && (
        <form onSubmit={saveProduct} className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b px-6 py-4 flex items-center gap-3">
              <b className="font-display text-lg">{editing.id || 'New product'}</b>
              <span className="text-[11px] font-bold bg-black/5 rounded-full px-2.5 py-1">{editing.category}</span>
              <button type="button" onClick={() => setEditing(null)} className="ml-auto text-sm text-[#8a7584] hover:text-black">Close ✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="label-pro">Product ID<input value={editing.id} onChange={(e) => setEditing({ ...editing, id: e.target.value })} className="admin-input mt-1.5" placeholder="RL-17" required /></label>
                <label className="label-pro">Category
                  <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as any })} className="admin-input mt-1.5">
                    {['women', 'premium'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <label className="label-pro block">Name<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="admin-input mt-1.5" placeholder="Mirror-work Chaniya Choli" required /></label>
              <div>
                <p className="label-pro">Shop tiles — ye dress kin tiles me dikhega</p>
                {cats.length === 0 ? (
                  <p className="text-[12px] text-[#8a7584] mt-1.5">Pehle Categories tab me tiles banao — phir yahan tick kar paoge.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {cats.map((t) => {
                      const cur = normalizeTags((editing as any).tags);
                      const id = t.id.toLowerCase();
                      const on = cur.includes(id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEditing({ ...editing, tags: on ? cur.filter((x) => x !== id) : [...cur, id] } as any)}
                          title={on ? 'Tap to remove from this tile' : 'Tap to show in this tile'}
                          className={`text-[12px] font-bold rounded-full px-3 py-1.5 border capitalize transition ${on ? 'bg-[#1a0f1e] text-white border-[#1a0f1e]' : 'bg-white text-[#3d2b36] hover:border-black'}`}
                        >{t.label} · {t.kind}</button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11.5px] text-[#8a7584] mt-1.5">Kuch tick nahi = naam/description se auto (jaise abhi) · Tick kiya = SIRF wahi tiles me dikhega, keyword ignore. Single-rent items (jewellery wagera) bhi parent dress ke tick se us tile me aayenge.</p>
              </div>
              <label className="label-pro block">Tagline<input value={editing.hindi} onChange={(e) => setEditing({ ...editing, hindi: e.target.value })} className="admin-input mt-1.5" /></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([['rent1', 'Rent ₹ — website Rent button'], ['buy', 'Buy ₹ — website Buy button'], ['deposit', 'Deposit']] as const).map(([k, l]) => (
                  <label key={k} className="label-pro">{l}<input type="number" min={0} value={(editing as any)[k]} onChange={(e) => setEditing({ ...editing, [k]: Number(e.target.value) } as any)} className="admin-input mt-1.5" /></label>
                ))}
              </div>
              <p className="text-[11.5px] text-[#8a7584]">Rent aur Buy dono website par live hain — customer dress page par Rent / Buy choose karta hai. Price badlo → Save → turant live.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="label-pro">Sizes — customers will see these on the website ({normalizeSizes(editing.sizes).length} selected)</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {Array.from(new Set([...ALL_SIZES, ...normalizeSizes(editing.sizes).filter((s) => !ALL_SIZES.includes(s))])).map((s) => {
                      const cur = normalizeSizes(editing.sizes);
                      const on = cur.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            if (on && cur.length <= 1) return;
                            setEditing({ ...editing, sizes: on ? cur.filter((x) => x !== s) : [...cur, s] });
                          }}
                          title={on ? 'Tap to remove' : 'Tap to add'}
                          className={`min-w-11 px-3.5 py-2 rounded-xl text-[13px] font-bold border transition ${on ? 'bg-[#1a0f1e] text-white border-[#1a0f1e]' : 'bg-white hover:border-black text-black/50'}`}
                        >{s}</button>
                      );
                    })}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <input
                      placeholder="Custom size (e.g. XXS), then + Add"
                      className="admin-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const el = e.target as HTMLInputElement;
                          const v = el.value.trim().toUpperCase().slice(0, 10);
                          const cur = normalizeSizes(editing.sizes);
                          if (v && !cur.includes(v)) setEditing({ ...editing, sizes: [...cur, v] });
                          el.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const wrap = (e.currentTarget as HTMLElement).closest('div');
                        const inp = wrap?.querySelector('input') as HTMLInputElement | null;
                        const v = inp?.value.trim().toUpperCase().slice(0, 10) ?? '';
                        const cur = normalizeSizes(editing.sizes);
                        if (v && !cur.includes(v)) setEditing({ ...editing, sizes: [...cur, v] });
                        if (inp) inp.value = '';
                      }}
                      className="shrink-0 text-[12.5px] font-bold border rounded-xl px-3.5 hover:bg-black hover:text-white transition"
                    >+ Add</button>
                  </div>
                </div>
                <label className="label-pro">Stock<input type="number" min={0} value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} className="admin-input mt-1.5" /></label>
              </div>
              <div>
                <p className="label-pro">Photos — first = main photo, rest = angles (tap ✕ to remove, + to add more)</p>
                {(() => {
                  const all = [editing.img, ...(editing.images ?? [])].filter(Boolean);
                  const dropAt = (idx: number) => {
                    const next = all.filter((_, j) => j !== idx);
                    setEditing({ ...editing, img: next[0] ?? '', images: next.slice(1) });
                  };
                  const addUrls = (urls: string[]) => {
                    const next = [...all, ...urls.filter(Boolean)].slice(0, 12);
                    setEditing({ ...editing, img: next[0] ?? '', images: next.slice(1) });
                  };
                  return (
                    <div className="mt-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {all.map((src, i) => (
                          <div key={`${src}-${i}`} className="relative">
                            <img src={src} alt="" className={`w-14 h-16 object-contain rounded-xl border-2 ${i === 0 ? 'border-black' : 'border-black/10'}`} />
                            {i === 0 && <span className="absolute top-0.5 left-0.5 text-[8.5px] font-black bg-black text-white rounded-full px-1.5 py-0.5">MAIN</span>}
                            <button type="button" onClick={() => dropAt(i)} title="Remove photo" className="absolute -top-1.5 -right-1.5 w-5 h-5 grid place-items-center rounded-full bg-rose-600 text-white text-[11px] font-bold">✕</button>
                          </div>
                        ))}
                        <label title="Add photos" className="w-14 h-16 grid place-items-center rounded-xl border-2 border-dashed border-black/25 cursor-pointer hover:border-black hover:bg-black/5 transition text-xl font-bold text-black/40">+
                          <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                            const files = [...(e.target.files ?? [])].slice(0, Math.max(0, 12 - all.length));
                            if (!files.length) return;
                            setUploading(true);
                            try {
                              const urls: string[] = [];
                              for (const f of files) {
                                const url = await uploadImage(f);
                                if (url) urls.push(url);
                              }
                              if (urls.length) addUrls(urls);
                            } finally {
                              setUploading(false);
                              e.target.value = '';
                            }
                          }} />
                        </label>
                      </div>
                      {uploading && <span className="text-xs">Uploading…</span>}
                      <div className="flex gap-1.5 mt-2">
                        <input placeholder="Paste photo link, then + Add" className="admin-input" onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); const el = e.target as HTMLInputElement; if (el.value.trim()) { addUrls([el.value.trim()]); el.value = ''; } }
                        }} />
                        <button type="button" onClick={(e) => {
                          const wrap = (e.currentTarget as HTMLElement).closest('div');
                          const inp = wrap?.querySelector('input') as HTMLInputElement | null;
                          if (inp?.value.trim()) { addUrls([inp.value.trim()]); inp.value = ''; }
                        }} className="shrink-0 text-[12.5px] font-bold border rounded-xl px-3.5 hover:bg-black hover:text-white transition">+ Add</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="label-pro">Badge (optional)<input value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} placeholder="BESTSELLER" className="admin-input mt-1.5" /></label>
                <label className="label-pro">Fabric<input value={editing.fabric} onChange={(e) => setEditing({ ...editing, fabric: e.target.value })} className="admin-input mt-1.5" /></label>
              </div>
              <label className="label-pro block">Description<textarea value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} className="admin-input mt-1.5" rows={3} /></label>
              <div>
                <p className="label-pro">Complete look — what the model wore <span className="font-normal text-[#8a7584]">({(editing.accessories ?? []).length} items)</span></p>
                <div className="space-y-1.5 mt-1.5">
                  {(editing.accessories ?? []).map((a, i) => (
                    <div key={i} className="flex gap-1.5 items-center">
                      <input
                        value={a.name}
                        onChange={(e) => setEditing({ ...editing, accessories: (editing.accessories ?? []).map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                        placeholder={`Item ${i + 1} — e.g. Oxidised jhumka`}
                        maxLength={80}
                        className="admin-input flex-1 min-w-0"
                      />
                      <select
                        value={a.tag}
                        onChange={(e) => setEditing({ ...editing, accessories: (editing.accessories ?? []).map((x, j) => (j === i ? { ...x, tag: e.target.value as Accessory['tag'], price: e.target.value === 'addon' ? (x.price ?? 0) : undefined } : x)) })}
                        className="admin-input !w-auto shrink-0"
                        title="Included = included with the dress · Free = free gift · Paid = charged separately"
                      >
                        <option value="included">Included</option>
                        <option value="free">Free</option>
                        <option value="addon">Paid ₹</option>
                      </select>
                      {a.tag === 'addon' && (
                        <input
                          type="number" min={0} max={99999}
                          value={a.price ?? 0}
                          onChange={(e) => setEditing({ ...editing, accessories: (editing.accessories ?? []).map((x, j) => (j === i ? { ...x, price: Math.max(0, Number(e.target.value) || 0) } : x)) })}
                          className="admin-input !w-24 shrink-0"
                          title="Rent price (₹)"
                        />
                      )}
                      <button
                        type="button"
                        title="Remove item"
                        onClick={() => setEditing({ ...editing, accessories: (editing.accessories ?? []).filter((_, j) => j !== i) })}
                        className="shrink-0 w-10 h-10 grid place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white transition"
                      ><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
                {(editing.accessories ?? []).length >= 30
                  ? <p className="text-[12px] font-semibold text-amber-700 mt-2">Max 30 items — more won't fit the website box.</p>
                  : <button
                      type="button"
                      onClick={() => setEditing({ ...editing, accessories: [...(editing.accessories ?? []), { name: '', tag: 'included' as const }] })}
                      className="mt-2 text-[12.5px] font-bold border rounded-full px-3.5 py-1.5 flex items-center gap-1 hover:bg-black hover:text-white transition"
                    ><Plus size={13} /> Add item</button>}
                <p className="text-[11.5px] text-[#8a7584] mt-1.5">Included = dress ke saath · Free = muft gift · Paid = customer tick karke jodega. Khaali chhodo to Website → Complete look wale default items lagenge. Save karte hi website par live.</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="w-4 h-4 accent-[#3d0a26]" /> Show on website</label>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-[#1a0f1e] text-white font-semibold rounded-full py-3 text-sm">Save product</button>
                <button type="button" onClick={() => setEditing(null)} className="flex-1 border font-semibold rounded-full py-3 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </form>
      )}
      {/* Order photo full-view — Bookings list thumbnail tap par */}
      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={() => setPreview(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={preview.src} alt={preview.name} className="w-full max-h-[70vh] object-contain bg-black" />
            <div className="flex items-center gap-2 p-3">
              <b className="text-[13px] flex-1 min-w-0 truncate">{preview.name}</b>
              <button onClick={() => setPreview(null)} aria-label="Close photo" className="w-9 h-9 grid place-items-center rounded-full bg-black/5 hover:bg-black hover:text-white transition shrink-0">✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
