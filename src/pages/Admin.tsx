import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Eye,
  EyeOff,
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
  Users,
} from 'lucide-react';
import { ADMIN_PASSWORD,
  addLocalBooking,
  adminLockRemaining,
  clearAdminFails,
  getLocalBookings,
  getLocalProducts,
  isLocalAdmin,
  recordAdminFail,
  saveLocalProducts,
  setLocalAdmin,
  updateLocalBooking,
  type LocalBooking,
} from '../lib/localAdmin';
import { getCategories, resetCategories, saveCategories, type ShopCategory } from '../lib/categories';
import type { LiveProduct } from '../lib/ProductsContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import DeliveriesPanel from './admin/DeliveriesPanel';

type ProductRow = LiveProduct & { badge: string };
type BookingRow = LocalBooking & { [k: string]: any };

const emptyProduct: ProductRow = {
  id: '', name: '', hindi: '', category: 'women',
  rent3: 1299, rent9: 2499, buy: 4299, deposit: 2000,
  rating: 4.8, reviews: 0,
  sizes: ['S', 'M', 'L', 'XL'], colors: ['Multicolor'],
  img: '/images/g-hero.webp', badge: '', desc: '', fabric: 'Cotton', stock: 5, active: true,
} as ProductRow;

const STATUSES = ['new', 'confirmed', 'delivered', 'returned', 'cancelled'] as const;
const useCloud = isSupabaseConfigured && !!supabase;

const statusStyle: Record<string, string> = {
  new: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
  delivered: 'bg-violet-50 text-violet-700 border border-violet-200',
  returned: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
};

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const heads = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [heads.join(','), ...rows.map((r) => heads.map((h) => esc(typeof r[h] === 'object' ? JSON.stringify(r[h]) : r[h])).join(','))].join('\n');
}
function downloadCSV(name: string, rows: Record<string, any>[]) {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Admin() {
  const [cloudUser, setCloudUser] = useState<any>(null);
  const [localAuth, setLocalAuth] = useState(isLocalAdmin());
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [view, setView] = useState<'overview' | 'products' | 'categories' | 'bookings' | 'deliveries' | 'settings'>('overview');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [cats, setCats] = useState<ShopCategory[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [uploading, setUploading] = useState(false);

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
      if (data) setProducts(data as any);
    } else {
      setProducts(getLocalProducts() as ProductRow[]);
    }
  };
  const loadBookings = async () => {
    if (useCloud && supabase) {
      const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(200);
      if (data) setBookings(data as any);
    } else {
      let all = getLocalBookings();
      if (all.length === 0 && !localStorage.getItem('raasleela-seeded')) {
        localStorage.setItem('raasleela-seeded', '1');
        addLocalBooking({ name: 'Priya Sharma', phone: '9876543210', category: 'Women Chaniya Choli', size: 'M (36)', event_date: '2026-10-15', plan: '3 days (standard)', note: 'RL-01 red', items: [{ id: 'RL-01', qty: 1 }], subtotal: 1499, total: 1499 });
        all = getLocalBookings();
      }
      setBookings(all as BookingRow[]);
    }
  };

  useEffect(() => { if (loggedIn) { loadProducts(); loadBookings(); setCats(getCategories()); } }, [loggedIn]);

  const persistCats = (list: ShopCategory[]) => {
    setCats(list);
    saveCategories(list);
    setMsg('Category saved — live on website.');
    setTimeout(() => setMsg(''), 2500);
  };

  const stats = useMemo(() => {
    const live = products.filter((p) => p.active).length;
    const lowStock = products.filter((p) => (p.stock ?? 0) <= 2).length;
    const fresh = bookings.filter((b) => b.status === 'new').length;
    const revenue = bookings.filter((b) => b.status !== 'cancelled').reduce((a, b) => a + (b.total || b.subtotal || 0), 0);
    return { live, lowStock, fresh, revenue, total: bookings.length };
  }, [products, bookings]);

  const filteredProducts = products.filter((p) => {
    const okQ = q.trim() ? `${p.id} ${p.name} ${p.hindi}`.toLowerCase().includes(q.toLowerCase()) : true;
    const okC = catFilter === 'all' ? true : p.category === catFilter;
    return okQ && okC;
  });
  const filteredBookings = bookings.filter((b) => (statusFilter === 'all' ? true : b.status === statusFilter));

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
    } else if (pass === ADMIN_PASSWORD) {
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
      saveLocalProducts(list);
      window.dispatchEvent(new Event('raasleela-products-updated'));
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.id.trim() || !editing.name.trim()) { setMsg('Product ID and name are required.'); return; }
    if (useCloud && supabase) {
      const { error } = await supabase.from('products').upsert({ ...editing, badge: editing.badge || null }, { onConflict: 'id' });
      if (error && /column|schema cache|does not exist/i.test(error.message)) {
        // Purana cloud schema (bina accessories/images column) — unke bina retry
        const { accessories: _a, images: _i, ...legacy } = editing as any;
        const { error: err2 } = await supabase.from('products').upsert({ ...legacy, badge: editing.badge || null }, { onConflict: 'id' });
        setMsg(err2 ? 'Error: ' + err2.message : 'Product saved. (Note: Run migration_accessories.sql for photos/look columns.)');
        if (!err2) { setEditing(null); loadProducts(); }
        return;
      }
      setMsg(error ? 'Error: ' + error.message : 'Product saved.');
      if (!error) { setEditing(null); loadProducts(); }
    } else {
      const i = products.findIndex((p) => p.id === editing.id);
      const next = [...products];
      if (i >= 0) next[i] = editing; else next.unshift(editing);
      persistProducts(next);
      setEditing(null);
      setMsg('Product saved — live on website.');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (useCloud && supabase) {
      setUploading(true);
      const name = `p-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error } = await supabase.storage.from('product-images').upload(name, file, { upsert: true });
      setUploading(false);
      if (error) { setMsg('Upload failed: ' + error.message); return null; }
      return supabase.storage.from('product-images').getPublicUrl(name).data.publicUrl;
    }
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
            <span className="w-10 h-10 rounded-xl grid place-items-center font-display font-black text-lg bg-white text-[#3d0a26]">K</span>
            <span className="font-display text-xl">TheKissa.co.in</span>
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
          <p className="text-[11px] text-white/40">© 2026 TheKissa.co.in Garba Rental · Indore</p>
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
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'deliveries', label: 'Deliveries · Map', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen admin-shell text-[#1a0f1e]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[264px] shrink-0 flex-col bg-[#0e0a12] text-white p-5 sticky top-0 h-screen border-r border-[#e8c66a]/15">
          <Link to="/" className="flex items-center gap-2.5 px-1">
            <span className="w-9 h-9 rounded-xl grid place-items-center font-display font-black bg-gradient-to-br from-[#e8c66a] to-[#b8860b] text-[#1a0f1e]">K</span>
            <span className="leading-tight"><b className="font-display block text-[17px]">TheKissa.co.in</b><small className="text-[9.5px] tracking-[0.24em] text-[#e8c66a]/80 font-bold">STUDIO · ADMIN</small></span>
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
            <p className="text-[12px] text-white/65 mt-1.5 leading-relaxed">Low-stock pieces (≤2) ko Hide karke waiting list banao — demand badhti hai.</p>
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
                <p className="text-xs text-[#8a7584]">{useCloud ? 'Cloud connected · Supabase' : 'Local mode · changes go live instantly'}</p>
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
            {msg && <p className="text-sm bg-white border rounded-xl px-4 py-2.5 mb-4">{msg}</p>}

            {view === 'overview' && (
              <div>
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
                    {['all', 'women', 'men', 'kids', 'combo', 'premium'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => setEditing({ ...emptyProduct, id: `RL-${Date.now().toString().slice(-4)}` })} className="bg-[#1a0f1e] text-white text-[13px] font-semibold rounded-xl px-4 py-2.5 flex items-center justify-center gap-1.5"><Plus size={14} /> New product</button>
                  <button onClick={() => downloadCSV('products.csv', filteredProducts)} className="text-[13px] font-semibold border rounded-xl px-4 py-2.5">Export CSV</button>
                </div>

                <div className="admin-card mt-4 overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead><tr className="border-b border-[#1a0f1e]/8"><th className="admin-th">Product</th><th className="admin-th">Category</th><th className="admin-th">Rent</th><th className="admin-th">Stock</th><th className="admin-th">Status</th><th className="admin-th text-right">Actions</th></tr></thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-[#faf7ef]">
                          <td className="admin-td">
                            <div className="flex items-center gap-2.5">
                              <img src={p.img} alt="" className="w-11 h-13 h-[52px] object-cover rounded-lg border" />
                              <div><b className="block text-[13px]">{p.name}</b><span className="text-[11.5px] text-[#8a7584]">{p.id}</span></div>
                            </div>
                          </td>
                          <td className="admin-td capitalize text-[#3d2b36]">{p.category}</td>
                          <td className="admin-td font-semibold">₹{p.rent3.toLocaleString('en-IN')} <span className="font-normal text-[#8a7584]">/ ₹{p.rent9.toLocaleString('en-IN')}</span></td>
                          <td className="admin-td"><span className={`font-bold ${p.stock <= 2 ? 'text-rose-700' : ''}`}>{p.stock}</span>
                            <span className="block w-20 h-1.5 bg-black/10 rounded-full mt-1.5 overflow-hidden"><span className={`block h-full rounded-full ${p.stock <= 2 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (p.stock / 10) * 100)}%` }} /></span>
                          </td>
                          <td className="admin-td"><span className={`status-pill ${p.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-black/5 text-black/50 border'}`}>{p.active ? 'Live' : 'Hidden'}</span></td>
                          <td className="admin-td">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setEditing(p)} title="Edit" className="w-8 h-8 grid place-items-center rounded-lg border hover:bg-[#1a0f1e] hover:text-white transition"><Pencil size={13} /></button>
                              <button onClick={async () => {
                                if (useCloud && supabase) { await supabase.from('products').update({ active: !p.active }).eq('id', p.id); loadProducts(); }
                                else persistProducts(products.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)));
                              }} title="Show/Hide" className="w-8 h-8 grid place-items-center rounded-lg border hover:bg-[#1a0f1e] hover:text-white transition">{p.active ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                              <button onClick={async () => {
                                if (!confirm(`Delete ${p.id}?`)) return;
                                if (useCloud && supabase) {
                                  const { error } = await supabase.from('products').delete().eq('id', p.id);
                                  setMsg(error ? 'Error: ' + error.message : 'Product deleted.');
                                  if (!error) loadProducts();
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
                  <b>Shop by category</b> — website par Hero ke neeche photo cards dikhte hain. Tap = us keyword se collection filter.
                  <b>Dress</b> = sirf dresses · <b>Item</b> = sirf single-rent items (jewellery jaise, dress mix nahi).
                  Keyword comma/space se alag karo (jaise <code>jhumka, jewellery, tagdi</code>).
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => persistCats([{ id: `cat-${Date.now().toString(36)}`, label: 'New category', query: '', img: '/images/g-hero.webp', kind: 'dress' }, ...cats])} className="bg-[#1a0f1e] text-white text-[13px] font-semibold rounded-xl px-4 py-2.5 flex items-center gap-1.5"><Plus size={14} /> New category</button>
                  <button onClick={() => { if (confirm('Reset to default categories?')) persistCats(resetCategories()); }} className="text-[13px] font-semibold border rounded-xl px-4 py-2.5">Reset defaults</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {cats.map((c) => (
                    <div key={c.id} className="admin-card p-4 flex gap-3">
                      {c.img
                        ? <img src={c.img} alt="" className="w-16 h-[76px] object-cover rounded-xl border shrink-0" />
                        : <div className="w-16 h-[76px] rounded-xl border bg-black/5 grid place-items-center text-[10px] text-[#8a7584] shrink-0">No photo</div>}
                      <div className="flex-1 min-w-0 space-y-2">
                        <label className="label-pro block">Name<input value={c.label} onChange={(e) => persistCats(cats.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)))} className="admin-input mt-1" /></label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="label-pro block">Type
                            <select value={c.kind} onChange={(e) => persistCats(cats.map((x) => (x.id === c.id ? { ...x, kind: e.target.value as 'dress' | 'item' } : x)))} className="admin-input mt-1">
                              <option value="dress">Dress</option>
                              <option value="item">Item</option>
                            </select>
                          </label>
                          <label className="label-pro block">Keyword<input value={c.query} onChange={(e) => persistCats(cats.map((x) => (x.id === c.id ? { ...x, query: e.target.value.toLowerCase() } : x)))} placeholder="blouse" className="admin-input mt-1" /></label>
                        </div>
                        <div className="flex gap-1.5">
                          <input value={c.img} onChange={(e) => persistCats(cats.map((x) => (x.id === c.id ? { ...x, img: e.target.value } : x)))} placeholder="/images/… or URL" className="admin-input" />
                          <label title="Upload photo" className="shrink-0 grid place-items-center w-10 rounded-lg border cursor-pointer hover:bg-black hover:text-white transition text-sm">⇪
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const url = await uploadImage(f);
                              if (url) persistCats(cats.map((x) => (x.id === c.id ? { ...x, img: url } : x)));
                            }} />
                          </label>
                          <button title="Delete" onClick={() => { if (confirm(`Delete "${c.label}"?`)) persistCats(cats.filter((x) => x.id !== c.id)); }} className="shrink-0 w-10 grid place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white transition"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {cats.length === 0 && <p className="text-center text-sm text-[#8a7584] py-10">No categories — website par strip nahi dikhega. Add ya Reset karo.</p>}
              </div>
            )}

            {view === 'bookings' && (
              <div>
                <div className="flex gap-1.5 flex-wrap items-center">
                  {['all', ...STATUSES].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs font-bold rounded-full px-3.5 py-1.5 border capitalize ${statusFilter === s ? 'bg-[#1a0f1e] text-white border-[#1a0f1e]' : 'bg-white'}`}>{s} {s !== 'all' ? `· ${bookings.filter((b) => b.status === s).length}` : ''}</button>
                  ))}
                  <button onClick={() => downloadCSV('bookings.csv', filteredBookings)} className="ml-auto text-xs font-bold border rounded-full px-3.5 py-1.5 bg-white">Export CSV</button>
                </div>
                <div className="admin-card mt-4 overflow-x-auto">
                  <table className="w-full min-w-[1040px]">
                    <thead><tr className="border-b border-[#1a0f1e]/8"><th className="admin-th">Order</th><th className="admin-th">Customer</th><th className="admin-th">Event</th><th className="admin-th">Total</th><th className="admin-th">Deposit</th><th className="admin-th">Payment</th><th className="admin-th">Status</th><th className="admin-th text-right">Actions</th></tr></thead>
                    <tbody>
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-[#faf7ef]">
                          <td className="admin-td font-bold">{b.order_id || `#${String(b.id).slice(-6)}`}<span className="block text-[11px] font-normal text-[#8a7584]">#{String(b.id).slice(-6)}</span></td>
                          <td className="admin-td"><b className="block text-[13px]">{b.name}</b><a href={`tel:${b.phone}`} className="text-[12px] text-blue-700 hover:underline">{b.phone}</a></td>
                          <td className="admin-td text-[12.5px] text-[#3d2b36]">{b.event_date || '—'}<span className="block text-[#8a7584]">{b.category} · {b.size}</span></td>
                          <td className="admin-td font-bold">₹{(b.total || b.subtotal || 0).toLocaleString('en-IN')}{!!b.token_amount && <span className="block text-[11px] font-normal text-emerald-700">token ₹{Number(b.token_amount).toLocaleString('en-IN')}</span>}</td>
                          <td className="admin-td">
                            <b className="block text-[13px]">₹{Number(b.deposit || 0).toLocaleString('en-IN')}</b>
                            <button
                              title="Change deposit status (tap)"
                              onClick={async () => {
                                const next = b.deposit_status === 'collected' ? 'refunded' : b.deposit_status === 'refunded' ? 'pending' : 'collected';
                                if (useCloud && supabase) {
                                  try { await supabase.from('bookings').update({ deposit_status: next }).eq('id', b.id); } catch { /* purana schema */ }
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
                          <td className="admin-td"><span className="text-[11.5px] font-semibold">{b.payment_mode || 'pending'}</span><span className="block text-[11px] text-[#8a7584]">{b.payment_status || ''}{b.payment_id ? ` · ${String(b.payment_id).slice(0, 14)}` : ''}</span></td>
                          <td className="admin-td"><span className={`status-pill ${statusStyle[b.status] || ''}`}>{b.status}</span></td>
                          <td className="admin-td">
                            <div className="flex justify-end gap-1 flex-wrap">
                              {STATUSES.map((s) => (
                                <button key={s} onClick={async () => {
                                  if (useCloud && supabase) { await supabase.from('bookings').update({ status: s }).eq('id', b.id); loadBookings(); }
                                  else { updateLocalBooking(b.id, { status: s }); loadBookings(); }
                                }} className={`text-[10.5px] font-bold rounded-full px-2 py-1 border capitalize ${b.status === s ? 'bg-[#1a0f1e] text-white' : 'hover:border-black'}`}>{s}</button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredBookings.length === 0 && <p className="text-center text-sm text-[#8a7584] py-10">No bookings in this view.</p>}
                </div>
              </div>
            )}

            {view === 'deliveries' && <DeliveriesPanel bookings={bookings} />}

            {view === 'settings' && (
              <div className="admin-card p-6 max-w-2xl">
                <b>Store settings</b>
                <p className="text-[13px] text-[#6f5b6a] mt-1">{useCloud ? 'Supabase cloud connected. Data syncs across all devices.' : 'Local mode — data is stored in this browser. For multi-device sync, connect Supabase (optional).'}</p>
                <div className="mt-4 text-[13px] space-y-2 bg-[#faf7ef] border rounded-xl p-4">
                  <p><b>Website:</b> <Link to="/" className="underline">Open storefront</Link></p>
                  <p><b>Mode:</b> {useCloud ? 'Cloud (Supabase)' : 'Local (browser storage)'}</p>
                  <p><b>Products:</b> {products.length} · <b>Bookings:</b> {bookings.length}</p>
                </div>
                <button onClick={() => { if (confirm('Reset demo data?')) { localStorage.removeItem('raasleela-admin-products'); localStorage.removeItem('raasleela-admin-bookings'); localStorage.removeItem('raasleela-seeded'); loadProducts(); loadBookings(); } }} className="mt-4 text-[13px] font-semibold text-rose-700 border border-rose-200 rounded-full px-4 py-2">Reset local demo data</button>
              </div>
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
                    {['women', 'men', 'kids', 'combo', 'premium'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <label className="label-pro block">Name<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="admin-input mt-1.5" placeholder="Mirror-work Chaniya Choli" required /></label>
              <label className="label-pro block">Tagline<input value={editing.hindi} onChange={(e) => setEditing({ ...editing, hindi: e.target.value })} className="admin-input mt-1.5" /></label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([['rent3', '3-day rent'], ['rent9', '9-day rent'], ['buy', 'Buy price'], ['deposit', 'Deposit']] as const).map(([k, l]) => (
                  <label key={k} className="label-pro">{l}<input type="number" min={0} value={(editing as any)[k]} onChange={(e) => setEditing({ ...editing, [k]: Number(e.target.value) } as any)} className="admin-input mt-1.5" /></label>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="label-pro">Sizes (comma separated)<input value={editing.sizes.join(', ')} onChange={(e) => setEditing({ ...editing, sizes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="admin-input mt-1.5" /></label>
                <label className="label-pro">Stock<input type="number" min={0} value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} className="admin-input mt-1.5" /></label>
              </div>
              <div>
                <p className="label-pro">Photos (pehli line = main photo, ek line me ek URL/photo)</p>
                <div className="flex gap-3 mt-1.5">
                  <div className="flex gap-1.5 shrink-0">
                    {[editing.img, ...(editing.images ?? [])].filter(Boolean).slice(0, 4).map((src, i) => (
                      <img key={`${src}-${i}`} src={src} alt="" className={`w-14 h-16 object-cover rounded-xl border-2 ${i === 0 ? 'border-black' : ''}`} />
                    ))}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={[editing.img, ...(editing.images ?? [])].filter(Boolean).join('\n')}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                        setEditing({ ...editing, img: lines[0] ?? '', images: lines.slice(1) });
                      }}
                      className="admin-input" rows={3} placeholder={'/images/g-hero.webp\n/images/g-hero-back.webp'} />
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadImage(f);
                      if (url) setEditing({ ...editing, img: editing.img || url, images: editing.img ? [...(editing.images ?? []), url] : (editing.images ?? []) });
                    }} className="text-xs" />
                    {uploading && <span className="text-xs">Uploading…</span>}
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="label-pro">Badge (optional)<input value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} placeholder="BESTSELLER" className="admin-input mt-1.5" /></label>
                <label className="label-pro">Fabric<input value={editing.fabric} onChange={(e) => setEditing({ ...editing, fabric: e.target.value })} className="admin-input mt-1.5" /></label>
              </div>
              <label className="label-pro block">Description<textarea value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} className="admin-input mt-1.5" rows={3} /></label>
              <label className="label-pro block">Complete look — what the model wore (one per line: name | included / free / price · photo dot with @ x,y)
                <textarea
                  value={(editing.accessories ?? []).map((a) => `${a.name} | ${a.tag === 'addon' ? (a.price ?? 0) : a.tag}${a.x != null && a.y != null ? ` @ ${a.x},${a.y}` : ''}`).join('\n')}
                  onChange={(e) => setEditing({
                    ...editing,
                    accessories: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
                      const [left, coord] = l.split('@').map((s) => s.trim());
                      const [name, raw] = left.split('|').map((s) => s.trim());
                      const m = (coord ?? '').match(/(\d+)\s*,\s*(\d+)/);
                      const pos = m ? { x: Math.min(95, Number(m[1])), y: Math.min(95, Number(m[2])) } : {};
                      if (/^\d+$/.test(raw ?? '')) return { name, tag: 'addon' as const, price: Number(raw), ...pos };
                      if (raw === 'free') return { name, tag: 'free' as const, ...pos };
                      return { name, tag: 'included' as const, ...pos };
                    }),
                  })}
                  className="admin-input mt-1.5" rows={4}
                  placeholder={'Oxidised jhumka | 99 @ 67,24\nBandhani dupatta | included\nDandiya pair | free'}
                />
              </label>
              <p className="text-[11.5px] text-[#8a7584] -mt-2">Khaali chhodo to category ka default look apne aap lagega.</p>
              <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="w-4 h-4 accent-[#3d0a26]" /> Show on website</label>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-[#1a0f1e] text-white font-semibold rounded-full py-3 text-sm">Save product</button>
                <button type="button" onClick={() => setEditing(null)} className="flex-1 border font-semibold rounded-full py-3 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
